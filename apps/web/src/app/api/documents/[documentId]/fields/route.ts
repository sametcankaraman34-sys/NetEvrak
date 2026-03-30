import { NextResponse } from "next/server";

import { getPrismaOrNull } from "@/lib/db/prisma";
import {
  getExtractionResultByDocumentIdInMemory,
  updateExtractedFieldInMemory,
} from "@/lib/db/inMemoryDb";
import { captureError } from "@/lib/monitoring";

export async function GET(
  _req: Request,
  context: { params: { documentId: string } }
) {
  try {
    const documentId = context.params.documentId;
    if (!documentId) {
      return NextResponse.json({ error: "DOCUMENT_ID_REQUIRED" }, { status: 400 });
    }

    const prisma = getPrismaOrNull();
    if (!prisma) {
      const result = getExtractionResultByDocumentIdInMemory(documentId);
      if (!result) return NextResponse.json({ error: "EXTRACTION_NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ ok: true, extraction: result }, { status: 200 });
    }

    const result = await prisma.extractionResult.findFirst({
      where: { documentId },
      orderBy: { processedAt: "desc" },
      include: { extractedFields: true },
    });
    if (!result) return NextResponse.json({ error: "EXTRACTION_NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true, extraction: result }, { status: 200 });
  } catch (err) {
    captureError(err, { route: "GET /api/documents/:documentId/fields" });
    return NextResponse.json({ error: "FIELDS_FETCH_FAILED" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: { documentId: string } }
) {
  try {
    const documentId = context.params.documentId;
    if (!documentId) {
      return NextResponse.json({ error: "DOCUMENT_ID_REQUIRED" }, { status: 400 });
    }

    const body = (await req.json()) as { fieldKey?: string; fieldValue?: string };
    const fieldKey = body.fieldKey?.trim() ?? "";
    const fieldValue = body.fieldValue ?? "";
    if (!fieldKey) {
      return NextResponse.json({ error: "FIELD_KEY_REQUIRED" }, { status: 400 });
    }

    const prisma = getPrismaOrNull();
    if (!prisma) {
      const updated = updateExtractedFieldInMemory({ documentId, fieldKey, fieldValue });
      if (!updated) return NextResponse.json({ error: "FIELD_NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ ok: true, extraction: updated }, { status: 200 });
    }

    const result = await prisma.extractionResult.findFirst({
      where: { documentId },
      orderBy: { processedAt: "desc" },
      include: { extractedFields: true },
    });
    if (!result) return NextResponse.json({ error: "EXTRACTION_NOT_FOUND" }, { status: 404 });

    const target = result.extractedFields.find((f) => f.fieldKey === fieldKey);
    if (!target) return NextResponse.json({ error: "FIELD_NOT_FOUND" }, { status: 404 });

    await prisma.extractedField.update({
      where: { id: target.id },
      data: {
        fieldValue,
        normalizedValue: fieldValue.trim(),
        isValid: fieldValue.trim().length > 0,
        validationMessage: fieldValue.trim().length > 0 ? "" : "Bos deger",
      },
    });

    const refreshed = await prisma.extractionResult.findFirst({
      where: { id: result.id },
      include: { extractedFields: true },
    });

    return NextResponse.json({ ok: true, extraction: refreshed }, { status: 200 });
  } catch (err) {
    captureError(err, { route: "PATCH /api/documents/:documentId/fields" });
    return NextResponse.json({ error: "FIELD_UPDATE_FAILED" }, { status: 500 });
  }
}

