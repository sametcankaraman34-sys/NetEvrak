import type { PrismaClient } from "@prisma/client";

import { getCaseInMemory, getDocumentsByCaseIdInMemory, getExtractionResultByDocumentIdInMemory } from "@/lib/db/inMemoryDb";
import { loadAccountingBasicTemplate } from "@/lib/rules/loadAccountingBasicTemplate";
import { evaluateChecklist } from "@/features/checklist/services/evaluateChecklist";

type ReportHistoryItem = {
  happenedAt: string;
  action: string;
  entityType: "document" | "extraction";
  entityId: string;
};

export type CaseReportPayload = {
  case: { id: string; sector: string };
  profileCode: string;
  profileLabel: string;
  summary: {
    uploadedCount: number;
    passCount: number;
    missingCount: number;
    reviewCount: number;
    failCount: number;
  };
  checklist: Array<{ code: string; label: string; status: string; reason: string }>;
  missingDocuments: Array<{ code: string; label: string; reason: string }>;
  fieldResults: Array<{
    documentId: string;
    documentType: string;
    fieldKey: string;
    fieldLabel: string;
    fieldValue: string;
    confidence: number;
    isValid: boolean;
  }>;
  history: ReportHistoryItem[];
};

export async function buildCaseReport(input: {
  caseId: string;
  profileCode?: string;
  prisma: PrismaClient | null;
}): Promise<CaseReportPayload | null> {
  const template = await loadAccountingBasicTemplate();
  const selectedProfile = input.profileCode;

  if (!input.prisma) {
    const caseRecord = getCaseInMemory(input.caseId);
    if (!caseRecord) return null;

    const docs = getDocumentsByCaseIdInMemory(input.caseId);
    const extracted = docs
      .map((d) => ({ doc: d, extraction: getExtractionResultByDocumentIdInMemory(d.id) }))
      .filter((x) => Boolean(x.extraction));

    const checklistEval = evaluateChecklist({
      template,
      profileCode: selectedProfile,
      documents: docs.map((d) => ({ id: d.id, documentType: d.documentType })),
      extractions: extracted.map((x) => ({
        documentId: x.doc.id,
        fields: (x.extraction?.extractedFields ?? []).map((f) => ({
          fieldKey: f.fieldKey,
          normalizedValue: f.normalizedValue,
          confidence: f.confidence,
          isValid: f.isValid,
        })),
      })),
    });

    const fieldResults = extracted.flatMap((x) =>
      (x.extraction?.extractedFields ?? []).map((f) => ({
        documentId: x.doc.id,
        documentType: x.doc.documentType,
        fieldKey: f.fieldKey,
        fieldLabel: f.fieldLabel,
        fieldValue: f.fieldValue,
        confidence: f.confidence,
        isValid: f.isValid,
      }))
    );

    const history: ReportHistoryItem[] = [
      ...docs.map((d) => ({
        happenedAt: d.uploadedAt,
        action: "DOCUMENT_UPLOADED",
        entityType: "document" as const,
        entityId: d.id,
      })),
      ...extracted.map((x) => ({
        happenedAt: x.extraction?.processedAt ?? new Date().toISOString(),
        action: "DOCUMENT_EXTRACTED",
        entityType: "extraction" as const,
        entityId: x.extraction?.id ?? x.doc.id,
      })),
    ].sort((a, b) => (a.happenedAt < b.happenedAt ? 1 : -1));

    return formatReport({
      caseRecord,
      profileCode: checklistEval.profileCode,
      profileLabel: checklistEval.profileLabel,
      checklist: checklistEval.requiredDocuments,
      uploadedCount: docs.length,
      fieldResults,
      history,
    });
  }

  const caseRecord = await input.prisma.case.findUnique({
    where: { id: input.caseId },
    select: { id: true, sector: true },
  });
  if (!caseRecord) return null;

  const docs = await input.prisma.document.findMany({
    where: { caseId: input.caseId },
    select: { id: true, documentType: true, uploadedAt: true },
    orderBy: { uploadedAt: "desc" },
  });

  const extractionResults = await input.prisma.extractionResult.findMany({
    where: { documentId: { in: docs.map((d) => d.id) } },
    include: { extractedFields: true },
    orderBy: { processedAt: "desc" },
  });
  const byDoc = new Map<string, (typeof extractionResults)[number]>();
  for (const e of extractionResults) {
    if (!byDoc.has(e.documentId)) byDoc.set(e.documentId, e);
  }

  const checklistEval = evaluateChecklist({
    template,
    profileCode: selectedProfile,
    documents: docs.map((d) => ({ id: d.id, documentType: d.documentType })),
    extractions: [...byDoc.entries()].map(([documentId, extraction]) => ({
      documentId,
      fields: extraction.extractedFields.map((f) => ({
        fieldKey: f.fieldKey,
        normalizedValue: f.normalizedValue,
        confidence: f.confidence,
        isValid: f.isValid,
      })),
    })),
  });

  const fieldResults = docs.flatMap((doc) => {
    const extraction = byDoc.get(doc.id);
    if (!extraction) return [];
    return extraction.extractedFields.map((f) => ({
      documentId: doc.id,
      documentType: doc.documentType,
      fieldKey: f.fieldKey,
      fieldLabel: f.fieldLabel,
      fieldValue: f.fieldValue,
      confidence: f.confidence,
      isValid: f.isValid,
    }));
  });

  const logs = await input.prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "document", entityId: { in: docs.map((d) => d.id) } },
        { entityType: "case", entityId: input.caseId },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, action: true, entityType: true, entityId: true },
    take: 50,
  });

  const history: ReportHistoryItem[] = [
    ...logs.map((l) => ({
      happenedAt: l.createdAt.toISOString(),
      action: l.action,
      entityType: (l.entityType === "document" ? "document" : "extraction") as
        | "document"
        | "extraction",
      entityId: l.entityId,
    })),
    ...[...byDoc.values()].map((e) => ({
      happenedAt: e.processedAt.toISOString(),
      action: "DOCUMENT_EXTRACTED",
      entityType: "extraction" as const,
      entityId: e.id,
    })),
  ].sort((a, b) => (a.happenedAt < b.happenedAt ? 1 : -1));

  return formatReport({
    caseRecord,
    profileCode: checklistEval.profileCode,
    profileLabel: checklistEval.profileLabel,
    checklist: checklistEval.requiredDocuments,
    uploadedCount: docs.length,
    fieldResults,
    history,
  });
}

function formatReport(input: {
  caseRecord: { id: string; sector: string };
  profileCode: string;
  profileLabel: string;
  checklist: Array<{ code: string; label: string; status: string; reason: string }>;
  uploadedCount: number;
  fieldResults: CaseReportPayload["fieldResults"];
  history: ReportHistoryItem[];
}): CaseReportPayload {
  const missingDocuments = input.checklist
    .filter((x) => x.status === "MISSING")
    .map((x) => ({ code: x.code, label: x.label, reason: x.reason }));
  const passCount = input.checklist.filter((x) => x.status === "PASS").length;
  const missingCount = input.checklist.filter((x) => x.status === "MISSING").length;
  const reviewCount = input.checklist.filter((x) => x.status === "NEEDS_REVIEW").length;
  const failCount = input.checklist.filter((x) => x.status === "FAIL").length;

  return {
    case: input.caseRecord,
    profileCode: input.profileCode,
    profileLabel: input.profileLabel,
    summary: {
      uploadedCount: input.uploadedCount,
      passCount,
      missingCount,
      reviewCount,
      failCount,
    },
    checklist: input.checklist,
    missingDocuments,
    fieldResults: input.fieldResults,
    history: input.history.slice(0, 50),
  };
}

