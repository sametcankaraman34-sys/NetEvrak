import { getPrismaOrNull } from "../db/prisma";
import { logger } from "../logger";
import { setDocumentStatusInMemory } from "../db/inMemoryDb";

type Job =
  | {
      type: "PROCESS_DOCUMENT";
      documentId: string;
      enqueuedAt: number;
    };

function makeJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export class InMemoryQueue {
  private isProcessing = false;

  async enqueue(job: Job): Promise<{ jobId: string }> {
    const jobId = makeJobId();
    // Node event loop üzerinden “async job” davranışını simüle ediyoruz.
    setImmediate(() => {
      void this.processJob(job).catch((err) => {
        logger.error("Queue job failed", {
          jobId,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    });

    return { jobId };
  }

  private async processJob(job: Job): Promise<void> {
    if (this.isProcessing) {
      // Aynı anda çok job işlenmesin (local için basit).
      // Yeni job geldiğinde kısa bir süre sonra event loop ile tekrar denenecek.
      setImmediate(() => {
        void this.processJob(job).catch(() => undefined);
      });
      return;
    }

    this.isProcessing = true;
    try {
      switch (job.type) {
        case "PROCESS_DOCUMENT":
          await this.processDocument(job.documentId);
          return;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processDocument(documentId: string): Promise<void> {
    const prisma = getPrismaOrNull();

    if (!prisma) {
      setDocumentStatusInMemory(documentId, "PROCESSING");
      // Local demo: extraction result saklamıyoruz; sadece statüyü ileri alıyoruz.
      setDocumentStatusInMemory(documentId, "EXTRACTED");
      return;
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    // İdempotency: Aynı document için extraction result tekrar üretilmesin.
    const existing = await prisma.extractionResult.findFirst({
      where: { documentId },
    });

    if (existing) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "EXTRACTED" },
      });
      return;
    }

    await prisma.extractionResult.create({
      data: {
        documentId,
        provider: "in_memory_stub",
        rawResponseJson: {},
        confidenceAvg: 0,
        extractedFields: {
          create: [],
        },
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "EXTRACTED" },
    });
  }
}

