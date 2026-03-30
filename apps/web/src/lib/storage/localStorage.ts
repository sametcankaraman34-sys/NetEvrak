import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function sanitizeFileName(fileName: string): string {
  // Dosya adını path traversal risklerinden arındırır.
  return fileName
    .replaceAll("\\", "_")
    .replaceAll("/", "_")
    .replaceAll("..", "_")
    .trim()
    .slice(0, 120);
}

export async function putLocalFile(input: {
  file: File;
  directory: string;
  originalFileName: string;
}): Promise<{ storageKey: string }> {
  const baseDir = process.env.UPLOAD_DIR ?? "uploads";
  const absBaseDir = path.isAbsolute(baseDir)
    ? baseDir
    : path.join(process.cwd(), baseDir);

  const safeName = sanitizeFileName(input.originalFileName || "file");
  const ext = path.extname(safeName);
  const nameWithoutExt = safeName.slice(0, safeName.length - ext.length);
  const safeFinalName = `${nameWithoutExt || "file"}_${randomUUID()}${ext}`;

  const storageKey = path.join(input.directory, safeFinalName);
  const absPath = path.join(absBaseDir, storageKey);

  await fs.mkdir(path.dirname(absPath), { recursive: true });
  const arrayBuffer = await input.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(absPath, buffer);

  return { storageKey };
}

