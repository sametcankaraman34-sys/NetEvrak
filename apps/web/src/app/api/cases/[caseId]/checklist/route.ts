import { NextResponse } from "next/server";

import { getPrismaOrNull } from "@/lib/db/prisma";
import { loadAccountingBasicTemplate } from "@/lib/rules/loadAccountingBasicTemplate";
import { captureError } from "@/lib/monitoring";
import {
  getCaseInMemory,
  getDocumentsByCaseIdInMemory,
  getExtractionResultByDocumentIdInMemory,
} from "@/lib/db/inMemoryDb";
import { evaluateChecklist } from "@/features/checklist/services/evaluateChecklist";

export async function GET(
  req: Request,
  context: { params: { caseId: string } }
) {
  try {
    const caseId = context.params.caseId;
    if (!caseId) {
      return NextResponse.json({ error: "CASE_ID_REQUIRED" }, { status: 400 });
    }

    const prisma = getPrismaOrNull();
    const template = await loadAccountingBasicTemplate();
    const profileCode = new URL(req.url).searchParams.get("profile") ?? undefined;

    if (!prisma) {
      const caseRecord = getCaseInMemory(caseId);
      if (!caseRecord) {
        return NextResponse.json(
          { error: "CASE_NOT_FOUND" },
          { status: 404 }
        );
      }

      const uploadedDocuments = getDocumentsByCaseIdInMemory(caseId);
      const evaluated = evaluateChecklist({
        template,
        profileCode,
        documents: uploadedDocuments.map((d) => ({ id: d.id, documentType: d.documentType })),
        extractions: uploadedDocuments
          .map((d) => {
            const extraction = getExtractionResultByDocumentIdInMemory(d.id);
            if (!extraction) return null;
            return {
              documentId: d.id,
              fields: extraction.extractedFields.map((f) => ({
                fieldKey: f.fieldKey,
                normalizedValue: f.normalizedValue,
                confidence: f.confidence,
                isValid: f.isValid,
              })),
            };
          })
          .filter((e): e is NonNullable<typeof e> => Boolean(e)),
      });

      return NextResponse.json(
        {
          ok: true,
          case: caseRecord,
          template: { name: template.templateName, version: template.version },
          profile: {
            code: evaluated.profileCode,
            label: evaluated.profileLabel,
            options: template.requirementProfiles ?? [],
          },
          requiredDocuments: evaluated.requiredDocuments,
          uploadedCount: uploadedDocuments.length,
        },
        { status: 200 }
      );
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, sector: true },
    });

    if (!caseRecord) {
      return NextResponse.json({ error: "CASE_NOT_FOUND" }, { status: 404 });
    }

    const uploadedDocuments = await prisma.document.findMany({
      where: { caseId: caseRecord.id },
      select: { id: true, documentType: true },
    });
    const extractionResults = await prisma.extractionResult.findMany({
      where: { documentId: { in: uploadedDocuments.map((d) => d.id) } },
      include: { extractedFields: true },
      orderBy: { processedAt: "desc" },
    });
    const seenDocIds = new Set<string>();
    const normalizedExtractions = extractionResults
      .filter((r) => {
        if (seenDocIds.has(r.documentId)) return false;
        seenDocIds.add(r.documentId);
        return true;
      })
      .map((r) => ({
        documentId: r.documentId,
        fields: r.extractedFields.map((f) => ({
          fieldKey: f.fieldKey,
          normalizedValue: f.normalizedValue,
          confidence: f.confidence,
          isValid: f.isValid,
        })),
      }));
    const evaluated = evaluateChecklist({
      template,
      profileCode,
      documents: uploadedDocuments,
      extractions: normalizedExtractions,
    });

    return NextResponse.json(
      {
        ok: true,
        case: caseRecord,
        template: { name: template.templateName, version: template.version },
        profile: {
          code: evaluated.profileCode,
          label: evaluated.profileLabel,
          options: template.requirementProfiles ?? [],
        },
        requiredDocuments: evaluated.requiredDocuments,
        uploadedCount: uploadedDocuments.length,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    captureError(err, { route: "GET /api/cases/:caseId/checklist" });
    return NextResponse.json(
      { error: "CHECKLIST_FAILED", details: message },
      { status: 500 }
    );
  }
}

