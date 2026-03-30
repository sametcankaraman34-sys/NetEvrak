import { createClient } from "@supabase/supabase-js";

type SupabaseClientConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

const globalForSupabase = globalThis as unknown as {
  __netevrakSupabaseConfig?: SupabaseClientConfig;
};

export function getSupabaseConfigOrNull(): SupabaseClientConfig | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!url || !serviceRoleKey || !bucket) {
    return null;
  }

  if (!globalForSupabase.__netevrakSupabaseConfig) {
    globalForSupabase.__netevrakSupabaseConfig = { url, serviceRoleKey, bucket };
  }

  return globalForSupabase.__netevrakSupabaseConfig;
}

export function getSupabaseClientOrNull() {
  const cfg = getSupabaseConfigOrNull();
  if (!cfg) return null;
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

