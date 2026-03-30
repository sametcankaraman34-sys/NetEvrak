import type {
  ChecklistTemplateConfig,
  DocumentRequirement,
} from "@/lib/rules/loadAccountingBasicTemplate";

type ChecklistStatus = "PASS" | "MISSING" | "NEEDS_REVIEW";

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
        status: "NEEDS_REVIEW",
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
  }

  return {
    code: requirement.code,
    label: requirement.label,
    status: "PASS",
    reason: "Belge ve zorunlu alanlar uygun",
  };
}

