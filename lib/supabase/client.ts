import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
