import { NextResponse } from "next/server";

import { getPrismaOrNull } from "@/lib/db/prisma";
import { captureError } from "@/lib/monitoring";
import { getDocumentsByCaseIdInMemory } from "@/lib/db/inMemoryDb";

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
    if (!prisma) {
      const documents = getDocumentsByCaseIdInMemory(caseId).map((d) => ({
        id: d.id,
        fileName: d.fileName,
        mimeType: d.mimeType,
        documentType: d.documentType,
        status: d.status,
        pageCount: d.pageCount,
        uploadedAt: d.uploadedAt,
        previewUrl: `/api/documents/${d.id}/preview`,
      }));

      return NextResponse.json({ ok: true, documents }, { status: 200 });
    }

    const documents = await prisma.document.findMany({
      where: { caseId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        documentType: true,
        status: true,
        pageCount: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        documents: documents.map((d) => ({
          ...d,
          previewUrl: `/api/documents/${d.id}/preview`,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    captureError(err, { route: "GET /api/cases/:caseId/documents" });
    return NextResponse.json({ error: "DOCUMENTS_FETCH_FAILED" }, { status: 500 });
  }
}

