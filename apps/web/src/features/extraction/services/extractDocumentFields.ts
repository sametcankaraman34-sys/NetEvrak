type ExtractedFieldInput = {
  fieldKey: string;
  fieldLabel: string;
  fieldValue: string;
  confidence: number;
  isRequired: boolean;
};

const LABELS: Record<string, string> = {
  tax_number: "Vergi Numarasi",
  company_name: "Sirket Unvani",
  authorized_person: "Yetkili Kisi",
  registry_number: "Sicil Numarasi",
  chamber_name: "Oda Adi",
  valid_until: "Gecerlilik Tarihi",
  person_name: "Kisi Adi",
  identity_number: "Kimlik Numarasi",
  period: "Donem",
  total_assets: "Toplam Aktif",
  net_sales: "Net Satis",
};

function mapFieldsByDocumentType(documentType: string, fileName: string): ExtractedFieldInput[] {
  const lowerName = fileName.toLowerCase();
  const base: Record<string, ExtractedFieldInput[]> = {
    tax_certificate: [
      { fieldKey: "tax_number", fieldLabel: LABELS.tax_number, fieldValue: "1234567890", confidence: 0.91, isRequired: true },
      { fieldKey: "company_name", fieldLabel: LABELS.company_name, fieldValue: lowerName.includes("abc") ? "ABC LTD" : "Ornek Sirket", confidence: 0.88, isRequired: true },
    ],
    signature_circular: [
      { fieldKey: "authorized_person", fieldLabel: LABELS.authorized_person, fieldValue: "Ahmet Yilmaz", confidence: 0.84, isRequired: true },
    ],
    trade_registry_gazette: [
      { fieldKey: "registry_number", fieldLabel: LABELS.registry_number, fieldValue: "TR-2026-001", confidence: 0.86, isRequired: true },
      { fieldKey: "company_name", fieldLabel: LABELS.company_name, fieldValue: "Ornek Sirket", confidence: 0.82, isRequired: true },
    ],
    activity_certificate: [
      { fieldKey: "chamber_name", fieldLabel: LABELS.chamber_name, fieldValue: "Istanbul Ticaret Odasi", confidence: 0.83, isRequired: true },
      { fieldKey: "valid_until", fieldLabel: LABELS.valid_until, fieldValue: "2026-12-31", confidence: 0.81, isRequired: true },
    ],
    identity_copy: [
      { fieldKey: "person_name", fieldLabel: LABELS.person_name, fieldValue: "Ahmet Yilmaz", confidence: 0.79, isRequired: true },
      { fieldKey: "identity_number", fieldLabel: LABELS.identity_number, fieldValue: "12345678901", confidence: 0.72, isRequired: true },
    ],
    balance_sheet: [
      { fieldKey: "period", fieldLabel: LABELS.period, fieldValue: "2025-Q4", confidence: 0.8, isRequired: true },
      { fieldKey: "total_assets", fieldLabel: LABELS.total_assets, fieldValue: "1500000", confidence: 0.76, isRequired: true },
    ],
    income_statement: [
      { fieldKey: "period", fieldLabel: LABELS.period, fieldValue: "2025-Q4", confidence: 0.8, isRequired: true },
      { fieldKey: "net_sales", fieldLabel: LABELS.net_sales, fieldValue: "2100000", confidence: 0.75, isRequired: true },
    ],
  };

  return base[documentType] ?? [];
}

export function extractDocumentFields(input: {
  documentType: string;
  fileName: string;
}): {
  provider: string;
  rawResponseJson: unknown;
  confidenceAvg: number;
  extractedFields: Array<{
    fieldKey: string;
    fieldLabel: string;
    fieldValue: string;
    normalizedValue: string;
    confidence: number;
    isRequired: boolean;
    isValid: boolean;
    validationMessage: string;
  }>;
} {
  const provider = "mock_ocr_v1";
  const raw = {
    fileName: input.fileName,
    detectedDocumentType: input.documentType,
    tokens: ["stub"],
  };
  const mapped = mapFieldsByDocumentType(input.documentType, input.fileName).map((f) => ({
    fieldKey: f.fieldKey,
    fieldLabel: f.fieldLabel,
    fieldValue: f.fieldValue,
    normalizedValue: f.fieldValue.trim(),
    confidence: f.confidence,
    isRequired: f.isRequired,
    isValid: f.fieldValue.trim().length > 0,
    validationMessage: f.fieldValue.trim().length > 0 ? "" : "Bos deger",
  }));
  const confidenceAvg =
    mapped.length === 0 ? 0 : mapped.reduce((a, b) => a + b.confidence, 0) / mapped.length;

  return {
    provider,
    rawResponseJson: raw,
    confidenceAvg,
    extractedFields: mapped,
  };
}

