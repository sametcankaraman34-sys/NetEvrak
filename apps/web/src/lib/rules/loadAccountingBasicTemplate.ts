import fs from "node:fs/promises";
import path from "node:path";

export type ChecklistRuleType = "document_exists" | "field_required";

export type ChecklistRule =
  | { type: "document_exists" }
  | { type: "field_required"; field: string };

export type DocumentRequirement = {
  code: string;
  label: string;
  required: boolean;
  rules: ChecklistRule[];
};

export type ChecklistRequirementProfile = {
  code: string;
  label: string;
  requiredDocumentCodes: string[];
};

export type ChecklistTemplateConfig = {
  sector: string;
  templateName: string;
  version: number;
  documentRequirements: DocumentRequirement[];
  requirementProfiles?: ChecklistRequirementProfile[];
};

export async function loadAccountingBasicTemplate(): Promise<ChecklistTemplateConfig> {
  const configPath = path.resolve(
    process.cwd(),
    "../../packages/rules/checklist-rules/accounting-basic.json"
  );

  const raw = await fs.readFile(configPath, "utf-8");
  return JSON.parse(raw) as ChecklistTemplateConfig;
}

