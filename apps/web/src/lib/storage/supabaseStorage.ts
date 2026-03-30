import { randomUUID } from "node:crypto";
import path from "node:path";

import { sanitizeFileName } from "./localStorage";
import { getSupabaseClientOrNull, getSupabaseConfigOrNull } from "@/lib/supabase/client";

export async function putSupabaseFile(input: {
  file: File;
  directory: string;
  originalFileName: string;
}): Promise<{ storageKey: string }> {
  const supabase = getSupabaseClientOrNull();
  const cfg = getSupabaseConfigOrNull();
  if (!supabase || !cfg) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const safeName = sanitizeFileName(input.originalFileName || "file");
  const ext = path.extname(safeName);
  const nameWithoutExt = safeName.slice(0, safeName.length - ext.length);
  const finalName = `${nameWithoutExt || "file"}_${randomUUID()}${ext}`;
  const storageKey = `${input.directory}/${finalName}`.replaceAll("\\", "/");

  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const { error } = await supabase.storage
    .from(cfg.bucket)
    .upload(storageKey, fileBuffer, {
      upsert: false,
      contentType: input.file.type || "application/octet-stream",
    });
  if (error) {
    throw new Error(`SUPABASE_UPLOAD_FAILED: ${error.message}`);
  }

  return { storageKey };
}

export async function createSupabaseSignedUrl(storageKey: string): Promise<string> {
  const supabase = getSupabaseClientOrNull();
  const cfg = getSupabaseConfigOrNull();
  if (!supabase || !cfg) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase.storage
    .from(cfg.bucket)
    .createSignedUrl(storageKey, 60 * 5);
  if (error || !data?.signedUrl) {
    throw new Error(`SUPABASE_SIGNED_URL_FAILED: ${error?.message ?? "UNKNOWN"}`);
  }

  return data.signedUrl;
}

