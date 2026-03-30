import path from "node:path";
import { NextResponse } from "next/server";

import { uploadRequestSchema } from "@/lib/validators/upload";
import { uploadDocumentToCase } from "@/features/documents/services/uploadDocument";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function inferMimeTypeFromExtension(ext: string): string | null {
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const caseIdRaw = formData.get("caseId");
    const documentTypeRaw = formData.get("documentType");
    const fileRaw = formData.get("file");

    const parsed = uploadRequestSchema.parse({
      caseId: typeof caseIdRaw === "string" ? caseIdRaw : "",
      documentType:
        typeof documentTypeRaw === "string" ? documentTypeRaw : "",
    });

    if (!fileRaw || typeof fileRaw === "string") {
      return NextResponse.json(
        { error: "FILE_REQUIRED" },
        { status: 400 }
      );
    }

    const file = fileRaw;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    const originalFileName = file.name || "upload";
    const ext = path.extname(originalFileName).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      return NextResponse.json(
        { error: "UNSUPPORTED_FILE_EXTENSION" },
        { status: 400 }
      );
    }

    const inferredMime = inferMimeTypeFromExtension(ext);
    const mimeType = file.type || inferredMime || "application/octet-stream";

    if (!allowedMimeTypes.has(mimeType)) {
      return NextResponse.json(
        { error: "UNSUPPORTED_MIME_TYPE" },
        { status: 400 }
      );
    }

    const result = await uploadDocumentToCase({
      caseId: parsed.caseId,
      file,
      originalFileName,
      mimeType,
      documentType: parsed.documentType,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";

    if (message === "CASE_NOT_FOUND") {
      return NextResponse.json({ error: "CASE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "UPLOAD_FAILED", details: message },
      { status: 500 }
    );
  }
}

