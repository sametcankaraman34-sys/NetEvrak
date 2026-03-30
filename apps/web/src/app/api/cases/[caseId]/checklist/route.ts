import { NextResponse } from "next/server";

import { getPrismaOrNull } from "@/lib/db/prisma";
import { loadAccountingBasicTemplate } from "@/lib/rules/loadAccountingBasicTemplate";
import {
  getCaseInMemory,
  getDocumentsByCaseIdInMemory,
} from "@/lib/db/inMemoryDb";

export async function GET(
  _req: Request,
  context: { params: { caseId: string } }
) {
  try {
    const caseId = context.params.caseId;
    if (!caseId) {
      return NextResponse.json({ error: "CASE_ID_REQUIRED" }, { status: 400 });
    }

    const prisma = getPrismaOrNull();
    const template = await loadAccountingBasicTemplate();

    if (!prisma) {
      const caseRecord = getCaseInMemory(caseId);
      if (!caseRecord) {
        return NextResponse.json(
          { error: "CASE_NOT_FOUND" },
          { status: 404 }
        );
      }

      const requiredDocuments = template.documentRequirements.filter(
        (d) => d.required
      );
      const uploadedDocuments = getDocumentsByCaseIdInMemory(caseId);
      const uploadedSet = new Set(
        uploadedDocuments.map((d) => d.documentType)
      );

      const requiredResults = requiredDocuments.map((req) => ({
        code: req.code,
        label: req.label,
        status: uploadedSet.has(req.code) ? "PASS" : "MISSING",
      }));

      return NextResponse.json(
        {
          ok: true,
          case: caseRecord,
          template: { name: template.templateName, version: template.version },
          requiredDocuments: requiredResults,
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

    const requiredDocuments = template.documentRequirements.filter(
      (d) => d.required
    );

    const uploadedDocuments = await prisma.document.findMany({
      where: { caseId: caseRecord.id },
      select: { documentType: true },
    });

    const uploadedSet = new Set(uploadedDocuments.map((d) => d.documentType));

    const requiredResults = requiredDocuments.map((req) => ({
      code: req.code,
      label: req.label,
      status: uploadedSet.has(req.code) ? "PASS" : "MISSING",
    }));

    return NextResponse.json(
      {
        ok: true,
        case: caseRecord,
        template: { name: template.templateName, version: template.version },
        requiredDocuments: requiredResults,
        uploadedCount: uploadedDocuments.length,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json(
      { error: "CHECKLIST_FAILED", details: message },
      { status: 500 }
    );
  }
}

