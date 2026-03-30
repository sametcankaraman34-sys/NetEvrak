import { getPrismaOrNull } from "@/lib/db/prisma";
import { putFile } from "@/lib/storage";
import { enqueueExtractionJob } from "@/lib/queue";
import { logger } from "@/lib/logger";
import { ensureCaseById } from "@/features/cases/services/ensureCase";
import {
  createDocumentInMemory,
  ensureCaseInMemory,
} from "@/lib/db/inMemoryDb";

export async function uploadDocumentToCase(input: {
  caseId: string;
  file: File;
  originalFileName: string;
  mimeType: string;
  documentType: string;
  pageCount: number;
}): Promise<{ documentId: string; status: string }> {
  const prisma = getPrismaOrNull();
  const FIXED_SECTOR = "accounting";

  if (!prisma) {
    ensureCaseInMemory(input.caseId, FIXED_SECTOR);
    const { storageKey } = await putFile({
      file: input.file,
      directory: "cases/documents",
      originalFileName: input.originalFileName,
    });

    const created = createDocumentInMemory({
      caseId: input.caseId,
      documentType: input.documentType,
      fileName: input.originalFileName,
      mimeType: input.mimeType,
      storageKey,
      pageCount: input.pageCount,
    });

    const job = await enqueueExtractionJob({ documentId: created.id });
    logger.info("Extraction job enqueued (in-memory)", {
      documentId: created.id,
      jobId: job.jobId,
    });

    return { documentId: created.id, status: created.status };
  }

  await ensureCaseById(prisma, input.caseId);

  const { storageKey } = await putFile({
    file: input.file,
    directory: "cases/documents",
    originalFileName: input.originalFileName,
  });

  const document = await prisma.document.create({
    data: {
      caseId: input.caseId,
      fileName: input.originalFileName,
      mimeType: input.mimeType,
      storageKey,
      documentType: input.documentType,
      status: "UPLOADED",
      pageCount: input.pageCount,
    },
    select: { id: true, status: true, storageKey: true },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "document",
      entityId: document.id,
      action: "DOCUMENT_UPLOADED",
      actorId: null,
      payloadJson: {
        caseId: input.caseId,
        storageKey: document.storageKey,
        mimeType: input.mimeType,
      },
    },
  });

  const job = await enqueueExtractionJob({ documentId: document.id });
  logger.info("Extraction job enqueued", {
    documentId: document.id,
    jobId: job.jobId,
  });

  return { documentId: document.id, status: document.status };
}

