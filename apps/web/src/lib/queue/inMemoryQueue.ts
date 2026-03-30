import { getPrismaOrNull } from "../db/prisma";
import { logger } from "../logger";
import {
  getDocumentByIdInMemory,
  getExtractionResultByDocumentIdInMemory,
  setDocumentStatusInMemory,
  upsertExtractionResultInMemory,
} from "../db/inMemoryDb";
import { extractDocumentFields } from "@/features/extraction/services/extractDocumentFields";

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
      const doc = getDocumentByIdInMemory(documentId);
      if (doc && !getExtractionResultByDocumentIdInMemory(documentId)) {
        const extracted = extractDocumentFields({
          documentType: doc.documentType,
          fileName: doc.fileName,
        });
        upsertExtractionResultInMemory({
          documentId,
          provider: extracted.provider,
          rawResponseJson: extracted.rawResponseJson,
          confidenceAvg: extracted.confidenceAvg,
          extractedFields: extracted.extractedFields.map((f) => ({
            fieldKey: f.fieldKey,
            fieldLabel: f.fieldLabel,
            fieldValue: f.fieldValue,
            normalizedValue: f.normalizedValue,
            confidence: f.confidence,
            isRequired: f.isRequired,
            isValid: f.isValid,
            validationMessage: f.validationMessage,
          })),
        });
      }
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

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { fileName: true, documentType: true },
    });

    const extracted = extractDocumentFields({
      documentType: doc?.documentType ?? "unknown",
      fileName: doc?.fileName ?? "unknown",
    });

    await prisma.extractionResult.create({
      data: {
        documentId,
        provider: extracted.provider,
        rawResponseJson: extracted.rawResponseJson as object,
        confidenceAvg: extracted.confidenceAvg,
        extractedFields: {
          create: extracted.extractedFields,
        },
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "EXTRACTED" },
    });
  }
}

