"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type CaseDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  documentType: string;
  status: "UPLOADED" | "PROCESSING" | "EXTRACTED" | "FAILED";
  pageCount: number;
  uploadedAt: string;
  previewUrl: string;
};

export default function CaseDocumentsPreviewPage() {
  const params = useParams<{ caseId: string }>();
  const searchParams = useSearchParams();
  const caseId = params.caseId;

  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    async function load() {
      if (!caseId) return;
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/documents`);
      if (!res.ok) return;
      const data: unknown = await res.json();
      const payload = data as { ok: boolean; documents: CaseDocument[] };
      if (!payload.ok) return;
      setDocuments(payload.documents);
      const queryDocId = searchParams.get("documentId");
      const initial =
        payload.documents.find((d) => d.id === queryDocId)?.id ??
        payload.documents[0]?.id ??
        "";
      setSelectedId(initial);
    }
    void load();
  }, [caseId, searchParams]);

  const selectedDoc = useMemo(
    () => documents.find((d) => d.id === selectedId) ?? null,
    [documents, selectedId]
  );

  return (
    <main className="container py-4">
      <div className="premium-card p-4">
        <h1 className="h4 fw-bold mb-3">Belge Onizleme Ekrani</h1>
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <label className="form-label fw-semibold">Belge Sec</label>
            <select
              className="form-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName} ({doc.documentType})
                </option>
              ))}
            </select>
            <div className="small text-muted mt-2">
              Case: <code>{caseId}</code>
            </div>
          </div>
          <div className="col-12 col-lg-8">
            {selectedDoc ? (
              <iframe
                title="Belge Onizleme"
                src={selectedDoc.previewUrl}
                style={{ width: "100%", height: "70vh", border: "1px solid #ddd" }}
              />
            ) : (
              <div className="text-muted">Onizlenecek belge bulunamadi.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

