"use client";

import { useEffect, useState, type FormEvent } from "react";

type UiMessage = { type: "success" | "danger" | "warning"; text: string };

type TemplateDocumentOption = {
  code: string;
  label: string;
  required: boolean;
};

type ChecklistItem = {
  code: string;
  label: string;
  status: "PASS" | "MISSING";
};

type ChecklistSummary = {
  case: { id: string; sector: string };
  template: { name: string; version: number };
  requiredDocuments: ChecklistItem[];
  uploadedCount: number;
};

export default function HomePage() {
  const [caseId, setCaseId] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<UiMessage | null>(null);
  const [lastDocumentId, setLastDocumentId] = useState<string | null>(null);
  const [templateDocs, setTemplateDocs] = useState<TemplateDocumentOption[]>([]);
  const [checklistSummary, setChecklistSummary] =
    useState<ChecklistSummary | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch("/api/checklist/templates/accounting-basic");
        if (!res.ok) return;

        const data: unknown = await res.json();
        const payload = data as {
          ok: boolean;
          template?: {
            documentRequirements?: Array<{
              code: string;
              label: string;
              required: boolean;
            }>;
          };
        };

        const docs = payload.template?.documentRequirements ?? [];
        const options: TemplateDocumentOption[] = docs.map((d) => ({
          code: d.code,
          label: d.label,
          required: d.required,
        }));

        setTemplateDocs(options);

        if (options.length > 0) {
          const firstRequired = options.find((d) => d.required)?.code ?? options[0].code;
          setDocumentType(firstRequired);
        }
      } catch {
        // Template yüklenemezse UI boş seçenekle kalır.
      }
    }

    void loadTemplate();
  }, []);

  async function loadChecklist(currentCaseId: string) {
    try {
      const res = await fetch(
        `/api/cases/${encodeURIComponent(currentCaseId)}/checklist`
      );
      if (!res.ok) {
        setChecklistSummary(null);
        return;
      }

      const data: unknown = await res.json();
      const payload = data as ChecklistSummary & { ok: boolean };
      if (payload.ok === false) {
        setChecklistSummary(null);
        return;
      }

      setChecklistSummary({
        case: payload.case,
        template: payload.template,
        requiredDocuments: payload.requiredDocuments,
        uploadedCount: payload.uploadedCount,
      });
    } catch {
      setChecklistSummary(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedCaseId = caseId.trim();
    const trimmedDocumentType = documentType.trim();

    if (!trimmedCaseId) {
      setMessage({ type: "warning", text: "caseId zorunludur." });
      return;
    }
    if (!trimmedDocumentType) {
      setMessage({ type: "warning", text: "Belge Tipi zorunludur." });
      return;
    }
    if (!file) {
      setMessage({ type: "warning", text: "Lütfen bir dosya seçin." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("caseId", trimmedCaseId);
      formData.append("documentType", trimmedDocumentType);
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const payload = data as { error?: string; details?: string };
        const errorCode = payload.error ?? "UPLOAD_FAILED";
        const details = payload.details ? ` - ${payload.details}` : "";
        setMessage({ type: "danger", text: `${errorCode}${details}` });
        return;
      }

      const okPayload = data as { ok: true; documentId: string; status: string };
      setLastDocumentId(okPayload.documentId);
      setMessage({
        type: "success",
        text: `Yükleme tamamlandı. Durum: ${okPayload.status}`,
      });

      await loadChecklist(trimmedCaseId);
    } catch {
      setMessage({ type: "danger", text: "Sunucuya bağlanılamadı." });
    } finally {
      setLoading(false);
    }
  }

  const missingCount = checklistSummary
    ? checklistSummary.requiredDocuments.filter((d) => d.status === "MISSING")
        .length
    : 0;

  const passCount = checklistSummary
    ? checklistSummary.requiredDocuments.length - missingCount
    : 0;

  const uploadProgress = loading
    ? 35
    : checklistSummary
      ? missingCount === 0
        ? 100
        : 70
      : message?.type === "success"
        ? 70
        : 0;

  return (
    <main>
      <div className="row g-4 mb-3">
        <div className="col-12 col-lg-3">
          <div className="premium-card p-3 p-lg-4 h-100">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div className="text-muted small fw-semibold">Vakalar</div>
                <div className="h3 fw-bold mb-0">0</div>
              </div>
              <span className="badge text-bg-primary rounded-pill">MVP</span>
            </div>
            <div className="mt-2 netevrak-muted small">Aktif case listesi yakında.</div>
          </div>
        </div>
        <div className="col-12 col-lg-3">
          <div className="premium-card p-3 p-lg-4 h-100">
            <div>
              <div className="text-muted small fw-semibold">Belgeler</div>
              <div className="h3 fw-bold mb-0">
                {checklistSummary ? checklistSummary.uploadedCount : 0}
              </div>
            </div>
            <div className="mt-2 netevrak-muted small">
              {checklistSummary
                ? "Yüklenen dokümanlar case bazında takip edilir."
                : "Yükleme sonrası durum güncellenir."}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-3">
          <div className="premium-card p-3 p-lg-4 h-100">
            <div>
              <div className="text-muted small fw-semibold">Checklist</div>
              <div className="h3 fw-bold mb-0">
                {checklistSummary ? `${passCount}/${checklistSummary.requiredDocuments.length}` : "0/0"}
              </div>
            </div>
            {checklistSummary ? (
              <div className="mt-3">
                <div className="list-group list-group-flush">
                  {checklistSummary.requiredDocuments.map((item) => (
                    <div
                      key={item.code}
                      className="list-group-item bg-transparent px-0 d-flex justify-content-between align-items-center gap-2"
                    >
                      <span className="small netevrak-muted">{item.label}</span>
                      <span
                        className={`badge rounded-pill ${
                          item.status === "PASS"
                            ? "text-bg-success"
                            : "text-bg-danger"
                        }`}
                      >
                        {item.status === "PASS" ? "Tamam" : "Eksik"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-2 netevrak-muted small">
                caseId ile upload yaptıkça checklist dolar.
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-3">
          <div className="premium-card p-3 p-lg-4 h-100">
            <div>
              <div className="text-muted small fw-semibold">Export</div>
              <div className="h3 fw-bold mb-0">Hazır</div>
            </div>
            <div className="mt-2 netevrak-muted small">Excel/PDF çıktısı planlanır.</div>
          </div>
        </div>
      </div>

      <div className="premium-card p-3 p-lg-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <div className="fw-semibold">Faz Durumu</div>
            <div className="small netevrak-muted">
              Faz 0 (muhasebe matrisi) ve Faz 1 (teknik temel) MVP kapsaminda aktif.
            </div>
          </div>
          <div className="d-flex gap-2">
            <span className="badge text-bg-success rounded-pill">Faz 0 - Tamam</span>
            <span className="badge text-bg-success rounded-pill">Faz 1 - Tamam</span>
          </div>
        </div>
      </div>

      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-lg-5">
          <div className="premium-card h-100 p-4 p-lg-5">
            <div className="d-flex align-items-start justify-content-between gap-3">
              <div>
                <h1 className="h3 fw-bold mb-2">Dikey Belge Kontrol</h1>
                <p className="netevrak-muted mb-0">
                  MVP kapsamındaki akış: dosya yükleme, belge türü tespiti, eksik
                  belge uyarısı ve checklist doğrulama.
                </p>
              </div>
              <span className="badge text-bg-primary rounded-pill">Premium Light</span>
            </div>

            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">İşleme Durumu</div>
                <div className="text-muted small">{loading ? "Çalışıyor" : "Hazır"}</div>
              </div>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                  aria-valuenow={uploadProgress}
                />
              </div>

              <div className="row g-2 mt-3">
                <div className="col-6">
                  <div className="status-list-item p-3 h-100">
                    <div className="fw-semibold">1. Upload</div>
                    <div className="netevrak-muted small">
                      {loading ? "Gönderiliyor..." : "Beklemede"}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="status-list-item p-3 h-100">
                    <div className="fw-semibold">2. Extraction</div>
                    <div className="netevrak-muted small">
                      {message?.type === "success" ? "Hazırlandı" : "Tetiklenecek"}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="status-list-item p-3 h-100">
                    <div className="fw-semibold">3. Checklist</div>
                    <div className="netevrak-muted small">Kural setine göre</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="status-list-item p-3 h-100">
                    <div className="fw-semibold">4. Export</div>
                    <div className="netevrak-muted small">Rapor indirilebilir</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 small netevrak-muted">
              Not: Bu ekran MVP için görsel/UX iskeleti tamamlar; upload akışı API üzerinden çalışır.
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="premium-card h-100 p-4 p-lg-5">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <h2 className="h5 fw-bold mb-0">Hızlı Dosya Yükle</h2>
              {lastDocumentId ? (
                <span className="badge rounded-pill text-bg-success text-truncate">
                  Son belge: {lastDocumentId.length > 20 ? `${lastDocumentId.slice(0, 10)}...` : lastDocumentId}
                </span>
              ) : (
                <span className="badge rounded-pill text-bg-secondary">Beklemede</span>
              )}
            </div>

            {message ? (
              <div
                className={`alert ${
                  message.type === "success"
                    ? "alert-success"
                    : message.type === "warning"
                      ? "alert-warning"
                      : "alert-danger"
                } alert-dismissible fade show`}
                role="alert"
              >
                {message.text}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Case ID</label>
                  <input
                    className="form-control"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    placeholder="Örn: case_123"
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Belge Tipi</label>
                  <select
                    className="form-select"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    disabled={loading || templateDocs.length === 0}
                  >
                    {templateDocs.map((doc) => (
                      <option key={doc.code} value={doc.code}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Dosya</label>
                  <input
                    className="form-control"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] ?? null;
                      setFile(selected);
                    }}
                    disabled={loading}
                  />
                  {file ? (
                    <div className="netevrak-muted small mt-1">
                      Seçili: {file.name} ({Math.max(0, Math.round(file.size / 1024))} KB)
                    </div>
                  ) : null}
                </div>

                <div className="col-12">
                  <button className="btn btn-premium btn-lg w-100" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Yükleniyor...
                      </>
                    ) : (
                      "Dosyayı Yükle"
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-4 small netevrak-muted">
              Kabul edilen formatlar: PDF, JPG, JPEG, PNG. Maksimum boyut: 20MB.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

