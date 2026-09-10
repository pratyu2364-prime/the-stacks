import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStacksClient } from './client';

const memoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: async (k: string) => map.get(k) ?? null,
    setItem: async (k: string, v: string) => void map.set(k, v),
    removeItem: async (k: string) => void map.delete(k),
    map,
  };
};

/**
 * supabase-js validates and decodes the JWT before it will persist a session,
 * and a token with no exp goes down a network refresh path. So the injected
 * storage is exercised with a decodable, non-expired token and a stubbed user
 * fetch — the point is that the write lands in the injected storage, nowhere
 * near localStorage.
 */
const NOW = Math.floor(Date.now() / 1000);
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64url = (value: unknown): string => {
  const chars = JSON.stringify(value);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '';
    out += i + 2 < bytes.length ? B64[b2 & 63] : '';
  }
  return out;
};
const accessToken = [
  base64url({ alg: 'none' }),
  base64url({ sub: 'test-user', exp: NOW + 3600 }),
  'c2ln',
].join('.');

describe('createStacksClient', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('persists the session through the injected storage, not localStorage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          user: { id: 'test-user', aud: 'authenticated', role: 'authenticated' },
        }),
      })),
    );

    const storage = memoryStorage();
    const client = createStacksClient({
      url: 'http://localhost:54321',
      anonKey: 'anon',
      storage,
    });

    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: 'r',
    });
    expect(error).toBeNull();
    expect([...storage.map.keys()].length).toBeGreaterThan(0);
  });

  it('rejects a missing url instead of silently pointing at localhost', () => {
    expect(() => createStacksClient({ url: '', anonKey: 'anon', storage: memoryStorage() })).toThrow(
      /url/i,
    );
  });
});