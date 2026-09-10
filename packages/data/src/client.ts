import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Session storage is a constructor argument because the two clients disagree:
 * the browser has localStorage, the phone has the Android Keystore behind
 * expo-secure-store. The data package must know about neither.
 */
export type StacksStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type StacksClientConfig = {
  url: string;
  anonKey: string;
  storage: StacksStorage;
};

/**
 * The anon key is public by design — it ships in both clients and RLS is what
 * keeps one reader out of another's library. The service-role key is never used
 * by this project and must never reach the repo, CI, or an APK.
 */
export function createStacksClient({ url, anonKey, storage }: StacksClientConfig): SupabaseClient {
  if (!url) throw new Error('supabase url is required');
  if (!anonKey) throw new Error('supabase anon key is required');

  return createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}