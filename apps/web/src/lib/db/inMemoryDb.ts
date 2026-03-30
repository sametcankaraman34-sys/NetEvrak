import { randomUUID } from "node:crypto";

type InMemoryCase = {
  id: string;
  sector: string;
};

type InMemoryDocument = {
  id: string;
  caseId: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  pageCount: number;
  uploadedAt: string;
  status: "UPLOADED" | "PROCESSING" | "EXTRACTED" | "FAILED";
};

type InMemoryExtractedField = {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
  normalizedValue: string;
  confidence: number;
  isRequired: boolean;
  isValid: boolean;
  validationMessage: string;
};

type InMemoryExtractionResult = {
  id: string;
  documentId: string;
  provider: string;
  rawResponseJson: unknown;
  confidenceAvg: number;
  processedAt: string;
  extractedFields: InMemoryExtractedField[];
};

type InMemoryStore = {
  cases: Map<string, InMemoryCase>;
  documents: Map<string, InMemoryDocument>;
  extractionResults: Map<string, InMemoryExtractionResult>;
};

const globalForDb = globalThis as unknown as {
  __netEvrakInMemoryStore?: InMemoryStore;
};

function getStore(): InMemoryStore {
  if (!globalForDb.__netEvrakInMemoryStore) {
    globalForDb.__netEvrakInMemoryStore = {
      cases: new Map(),
      documents: new Map(),
      extractionResults: new Map(),
    };
  }

  return globalForDb.__netEvrakInMemoryStore;
}

export function ensureCaseInMemory(caseId: string, sector: string): void {
  const store = getStore();
  if (!store.cases.has(caseId)) {
    store.cases.set(caseId, { id: caseId, sector });
  }
}

export function getCaseInMemory(caseId: string): InMemoryCase | null {
  const store = getStore();
  return store.cases.get(caseId) ?? null;
}

export function createDocumentInMemory(input: {
  caseId: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
  pageCount: number;
}): { id: string; status: InMemoryDocument["status"] } {
  const store = getStore();
  const id = randomUUID();
  const doc: InMemoryDocument = {
    id,
    caseId: input.caseId,
    documentType: input.documentType,
    fileName: input.fileName,
    mimeType: input.mimeType,
    storageKey: input.storageKey,
    pageCount: input.pageCount,
    uploadedAt: new Date().toISOString(),
    status: "UPLOADED",
  };
  store.documents.set(id, doc);
  return { id, status: doc.status };
}

export function getDocumentsByCaseIdInMemory(caseId: string): InMemoryDocument[] {
  const store = getStore();
  return [...store.documents.values()].filter((d) => d.caseId === caseId);
}

export function getDocumentTypesByCaseIdInMemory(caseId: string): string[] {
  return getDocumentsByCaseIdInMemory(caseId).map((d) => d.documentType);
}

export function getDocumentByIdInMemory(documentId: string): InMemoryDocument | null {
  const store = getStore();
  return store.documents.get(documentId) ?? null;
}

export function setDocumentStatusInMemory(
  documentId: string,
  status: InMemoryDocument["status"]
): void {
  const store = getStore();
  const doc = store.documents.get(documentId);
  if (!doc) return;
  doc.status = status;
}

export function getExtractionResultByDocumentIdInMemory(
  documentId: string
): InMemoryExtractionResult | null {
  const store = getStore();
  return (
    [...store.extractionResults.values()].find((r) => r.documentId === documentId) ??
    null
  );
}

export function upsertExtractionResultInMemory(input: {
  documentId: string;
  provider: string;
  rawResponseJson: unknown;
  confidenceAvg: number;
  extractedFields: Omit<InMemoryExtractedField, "id">[];
}): InMemoryExtractionResult {
  const store = getStore();
  const existing = getExtractionResultByDocumentIdInMemory(input.documentId);
  const resultId = existing?.id ?? randomUUID();
  const mappedFields: InMemoryExtractedField[] = input.extractedFields.map((f) => ({
    id: randomUUID(),
    ...f,
  }));

  const result: InMemoryExtractionResult = {
    id: resultId,
    documentId: input.documentId,
    provider: input.provider,
    rawResponseJson: input.rawResponseJson,
    confidenceAvg: input.confidenceAvg,
    processedAt: new Date().toISOString(),
    extractedFields: mappedFields,
  };

  store.extractionResults.set(resultId, result);
  return result;
}

export function updateExtractedFieldInMemory(input: {
  documentId: string;
  fieldKey: string;
  fieldValue: string;
}): InMemoryExtractionResult | null {
  const store = getStore();
  const existing = getExtractionResultByDocumentIdInMemory(input.documentId);
  if (!existing) return null;

  const idx = existing.extractedFields.findIndex((f) => f.fieldKey === input.fieldKey);
  if (idx === -1) return null;

  existing.extractedFields[idx] = {
    ...existing.extractedFields[idx],
    fieldValue: input.fieldValue,
    normalizedValue: input.fieldValue.trim(),
    confidence: Math.min(existing.extractedFields[idx].confidence, 0.99),
    isValid: input.fieldValue.trim().length > 0,
    validationMessage: input.fieldValue.trim().length > 0 ? "" : "Bos deger",
  };

  store.extractionResults.set(existing.id, existing);
  return existing;
}

