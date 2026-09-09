import { createClient } from '@supabase/supabase-js';

/**
 * The anon key is public by design — it ships in the bundle and RLS is what
 * keeps one reader out of another's library. The service-role key is never used
 * by this project and must never reach the repo or CI.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'anon', {
  auth: { persistSession: true, autoRefreshToken: true },
});
