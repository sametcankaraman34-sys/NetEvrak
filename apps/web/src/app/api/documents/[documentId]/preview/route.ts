import fs from "node:fs/promises";
import { NextResponse } from "next/server";

import { getPrismaOrNull } from "@/lib/db/prisma";
import { getDocumentByIdInMemory } from "@/lib/db/inMemoryDb";
import { getLocalAbsolutePathFromStorageKey } from "@/lib/storage/localStorage";
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
    let storageKey: string | null = null;
    let mimeType: string | null = null;
    let fileName: string | null = null;

    if (!prisma) {
      const doc = getDocumentByIdInMemory(documentId);
      if (!doc) return NextResponse.json({ error: "DOCUMENT_NOT_FOUND" }, { status: 404 });
      storageKey = doc.storageKey;
      mimeType = doc.mimeType;
      fileName = doc.fileName;
    } else {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        select: { storageKey: true, mimeType: true, fileName: true },
      });
      if (!doc) return NextResponse.json({ error: "DOCUMENT_NOT_FOUND" }, { status: 404 });
      storageKey = doc.storageKey;
      mimeType = doc.mimeType;
      fileName = doc.fileName;
    }

    const absPath = getLocalAbsolutePathFromStorageKey(storageKey);
    const fileBuffer = await fs.readFile(absPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileName ?? "document"}"`,
      },
    });
  } catch (err) {
    captureError(err, { route: "GET /api/documents/:documentId/preview" });
    return NextResponse.json({ error: "PREVIEW_FAILED" }, { status: 500 });
  }
}

