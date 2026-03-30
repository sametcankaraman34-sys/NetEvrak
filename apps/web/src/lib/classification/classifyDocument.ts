type ClassificationResult = {
  documentType: string;
  confidence: number;
};

export function classifyDocumentByNameAndMime(input: {
  fileName: string;
  mimeType: string;
}): ClassificationResult {
  const name = input.fileName.toLowerCase();
  const mime = input.mimeType.toLowerCase();

  const rules: Array<{ type: string; keywords: string[] }> = [
    { type: "tax_certificate", keywords: ["vergi", "tax"] },
    { type: "signature_circular", keywords: ["imza", "signature", "sirkuler"] },
    { type: "trade_registry_gazette", keywords: ["ticaret", "sicil", "registry"] },
    { type: "activity_certificate", keywords: ["faaliyet", "activity"] },
    { type: "identity_copy", keywords: ["kimlik", "identity", "id_card"] },
    { type: "tax_plate_previous_year", keywords: ["previous", "gecen", "yil"] },
    { type: "balance_sheet", keywords: ["bilanco", "balance"] },
    { type: "income_statement", keywords: ["gelir", "income"] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((k) => name.includes(k))) {
      return { documentType: rule.type, confidence: 0.9 };
    }
  }

  if (mime === "application/pdf") {
    return { documentType: "tax_certificate", confidence: 0.5 };
  }

  return { documentType: "identity_copy", confidence: 0.4 };
}

