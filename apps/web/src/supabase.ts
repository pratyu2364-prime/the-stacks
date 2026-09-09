import { createStacksClient, type StacksStorage } from '@stacks/data';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isConfigured = Boolean(url && anonKey);

const browserStorage: StacksStorage = {
  getItem: async (k) => window.localStorage.getItem(k),
  setItem: async (k, v) => window.localStorage.setItem(k, v),
  removeItem: async (k) => window.localStorage.removeItem(k),
};

/**
 * A build with no Supabase vars still has to render the "not open yet" state,
 * so the unconfigured case gets a client that points nowhere rather than a
 * throw at module load.
 */
export const supabase = createStacksClient({
  url: url || 'http://localhost:54321',
  anonKey: anonKey || 'anon',
  storage: browserStorage,
});