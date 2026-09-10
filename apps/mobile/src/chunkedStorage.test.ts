import { createChunkedStorage } from './chunkedStorage';

/** expo-secure-store's real behaviour: it refuses a value beyond its limit. */
function fakeSecureStore(limit = 2048) {
  const map = new Map<string, string>();
  return {
    map,
    async getItemAsync(key: string) {
      return map.get(key) ?? null;
    },
    async setItemAsync(key: string, value: string) {
      if (value.length > limit) throw new Error('Value too large for SecureStore');
      map.set(key, value);
    },
    async deleteItemAsync(key: string) {
      map.delete(key);
    },
  };
}

const session = (size: number) => 'x'.repeat(size);

it('round-trips a small value untouched', async () => {
  const store = fakeSecureStore();
  const storage = createChunkedStorage(store);

  await storage.setItem('sb-auth', 'short');

  expect(store.map.get('sb-auth')).toBe('short');
  expect(await storage.getItem('sb-auth')).toBe('short');
});

it('round-trips a session larger than the store allows', async () => {
  const store = fakeSecureStore();
  const storage = createChunkedStorage(store);
  const big = session(6000);

  await storage.setItem('sb-auth', big);

  expect(await storage.getItem('sb-auth')).toBe(big);
  for (const value of store.map.values()) expect(value.length).toBeLessThanOrEqual(2048);
});

it('returns null for a key that was never written', async () => {
  expect(await createChunkedStorage(fakeSecureStore()).getItem('sb-auth')).toBeNull();
});

it('leaves nothing behind when a chunked value is removed', async () => {
  const store = fakeSecureStore();
  const storage = createChunkedStorage(store);

  await storage.setItem('sb-auth', session(6000));
  await storage.removeItem('sb-auth');

  expect(store.map.size).toBe(0);
  expect(await storage.getItem('sb-auth')).toBeNull();
});

it('replaces a long value with a short one without stale chunks', async () => {
  const store = fakeSecureStore();
  const storage = createChunkedStorage(store);

  await storage.setItem('sb-auth', session(6000));
  await storage.setItem('sb-auth', 'short');

  expect(await storage.getItem('sb-auth')).toBe('short');
  expect(store.map.size).toBe(1);
});

it('reports a truncated value as missing rather than returning half a session', async () => {
  const store = fakeSecureStore();
  const storage = createChunkedStorage(store);

  await storage.setItem('sb-auth', session(6000));
  await store.deleteItemAsync('sb-auth.1');

  expect(await storage.getItem('sb-auth')).toBeNull();
});
