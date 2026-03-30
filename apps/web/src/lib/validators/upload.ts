import { z } from "zod";

export const uploadRequestSchema = z.object({
  caseId: z.string().min(1, "caseId zorunludur"),
  documentType: z.string().min(1, "documentType zorunludur"),
});

