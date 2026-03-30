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

type InMemoryStore = {
  cases: Map<string, InMemoryCase>;
  documents: Map<string, InMemoryDocument>;
};

const globalForDb = globalThis as unknown as {
  __netEvrakInMemoryStore?: InMemoryStore;
};

function getStore(): InMemoryStore {
  if (!globalForDb.__netEvrakInMemoryStore) {
    globalForDb.__netEvrakInMemoryStore = {
      cases: new Map(),
      documents: new Map(),
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

