import type {
  ChecklistTemplateConfig,
  DocumentRequirement,
} from "@/lib/rules/loadAccountingBasicTemplate";

type ChecklistStatus = "PASS" | "MISSING" | "NEEDS_REVIEW" | "FAIL";

type DocumentInput = {
  id: string;
  documentType: string;
};

type ExtractionFieldInput = {
  fieldKey: string;
  normalizedValue: string;
  confidence: number;
  isValid: boolean;
};

type ExtractionInput = {
  documentId: string;
  fields: ExtractionFieldInput[];
};

export function evaluateChecklist(input: {
  template: ChecklistTemplateConfig;
  profileCode?: string;
  documents: DocumentInput[];
  extractions: ExtractionInput[];
}): {
  profileCode: string;
  profileLabel: string;
  requiredDocuments: Array<{
    code: string;
    label: string;
    status: ChecklistStatus;
    reason: string;
  }>;
} {
  const profile = resolveProfile(input.template, input.profileCode);
  const requiredByProfile = new Set(profile.requiredDocumentCodes);
  const requirements = input.template.documentRequirements.filter((r) =>
    requiredByProfile.has(r.code)
  );

  const docsByType = new Map<string, DocumentInput[]>();
  for (const doc of input.documents) {
    const list = docsByType.get(doc.documentType) ?? [];
    list.push(doc);
    docsByType.set(doc.documentType, list);
  }

  const extractionByDocId = new Map<string, ExtractionInput>();
  for (const e of input.extractions) {
    extractionByDocId.set(e.documentId, e);
  }

  const requiredDocuments = requirements.map((req) =>
    evaluateRequirement(req, docsByType.get(req.code) ?? [], extractionByDocId)
  );

  const companyNames = collectFieldValues(input.documents, extractionByDocId, "company_name");
  const personNames = collectFieldValues(input.documents, extractionByDocId, "person_name");
  const authorizedNames = collectFieldValues(
    input.documents,
    extractionByDocId,
    "authorized_person"
  );
  const hasCompanyMismatch = companyNames.size > 1;
  const hasPersonAuthorizedMismatch =
    personNames.size > 0 && authorizedNames.size > 0 && !hasIntersection(personNames, authorizedNames);

  for (const item of requiredDocuments) {
    if (item.status === "PASS" && hasCompanyMismatch) {
      item.status = "NEEDS_REVIEW";
      item.reason = "Sirket unvani belgeler arasinda tutarsiz";
    }
    if (item.status === "PASS" && hasPersonAuthorizedMismatch) {
      item.status = "NEEDS_REVIEW";
      item.reason = "Yetkili kisi ve kimlik bilgisi tutarsiz";
    }
  }

  return {
    profileCode: profile.code,
    profileLabel: profile.label,
    requiredDocuments,
  };
}

function resolveProfile(template: ChecklistTemplateConfig, requested?: string) {
  const profiles = template.requirementProfiles ?? [];
  if (profiles.length === 0) {
    return {
      code: "default",
      label: "Varsayilan",
      requiredDocumentCodes: template.documentRequirements
        .filter((d) => d.required)
        .map((d) => d.code),
    };
  }
  return (
    profiles.find((p) => p.code === requested) ??
    profiles[0]
  );
}

function evaluateRequirement(
  requirement: DocumentRequirement,
  docs: DocumentInput[],
  extractionByDocId: Map<string, ExtractionInput>
): { code: string; label: string; status: ChecklistStatus; reason: string } {
  if (docs.length === 0) {
    return {
      code: requirement.code,
      label: requirement.label,
      status: "MISSING",
      reason: "Belge yuklenmedi",
    };
  }

  const requiredFields = requirement.rules
    .filter((r) => r.type === "field_required")
    .map((r) => r.field);
  if (requiredFields.length === 0) {
    return {
      code: requirement.code,
      label: requirement.label,
      status: "PASS",
      reason: "Belge mevcut",
    };
  }

  const allFields = docs
    .map((d) => extractionByDocId.get(d.id))
    .filter((e): e is ExtractionInput => Boolean(e))
    .flatMap((e) => e.fields);

  if (allFields.length === 0) {
    return {
      code: requirement.code,
      label: requirement.label,
      status: "NEEDS_REVIEW",
      reason: "Extraction sonucu bekleniyor",
    };
  }

  for (const fieldKey of requiredFields) {
    const field = allFields.find((f) => f.fieldKey === fieldKey);
    if (!field || !field.normalizedValue.trim()) {
      return {
        code: requirement.code,
        label: requirement.label,
        status: "FAIL",
        reason: `Alan eksik: ${fieldKey}`,
      };
    }
    if (!field.isValid || field.confidence < 0.75) {
      return {
        code: requirement.code,
        label: requirement.label,
        status: "NEEDS_REVIEW",
        reason: `Dogrulama gerekli: ${fieldKey}`,
      };
    }

    const semanticCheck = validateSemanticField(fieldKey, field.normalizedValue);
    if (semanticCheck === "FAIL") {
      return {
        code: requirement.code,
        label: requirement.label,
        status: "FAIL",
        reason: `Gecersiz format: ${fieldKey}`,
      };
    }
    if (semanticCheck === "NEEDS_REVIEW") {
      return {
        code: requirement.code,
        label: requirement.label,
        status: "NEEDS_REVIEW",
        reason: `Kontrol gerekli: ${fieldKey}`,
      };
    }
  }

  return {
    code: requirement.code,
    label: requirement.label,
    status: "PASS",
    reason: "Belge ve zorunlu alanlar uygun",
  };
}

function validateSemanticField(
  fieldKey: string,
  normalizedValue: string
): "PASS" | "NEEDS_REVIEW" | "FAIL" {
  if (fieldKey === "tax_number") {
    return /^\d{10}$/.test(normalizedValue) ? "PASS" : "FAIL";
  }
  if (fieldKey === "identity_number") {
    return /^\d{11}$/.test(normalizedValue) ? "PASS" : "FAIL";
  }
  if (fieldKey === "valid_until") {
    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) return "FAIL";
    return date.getTime() >= Date.now() ? "PASS" : "FAIL";
  }
  if (fieldKey === "period") {
    const match = normalizedValue.match(/^(\d{4})/);
    if (!match) return "NEEDS_REVIEW";
    const year = Number(match[1]);
    const currentYear = new Date().getFullYear();
    return year >= currentYear - 1 ? "PASS" : "NEEDS_REVIEW";
  }
  return "PASS";
}

function collectFieldValues(
  documents: DocumentInput[],
  extractionByDocId: Map<string, ExtractionInput>,
  fieldKey: string
): Set<string> {
  const values = new Set<string>();
  for (const doc of documents) {
    const extraction = extractionByDocId.get(doc.id);
    if (!extraction) continue;
    const field = extraction.fields.find((f) => f.fieldKey === fieldKey);
    if (field && field.normalizedValue.trim()) {
      values.add(field.normalizedValue.trim().toLowerCase());
    }
  }
  return values;
}

function hasIntersection(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}

