import type { StacksStorage } from '@stacks/data';

/**
 * expo-secure-store refuses values much beyond 2KB, and a Supabase session
 * carries two JWTs, so a real session can exceed the limit and vanish on write.
 * Values are split across numbered keys with a small header, which keeps the
 * whole session inside the Android Keystore rather than moving it somewhere
 * roomier and less protected.
 */
const CHUNK = 1536;
const HEADER = 'chunks:';

type KeyValueStore = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

const partKey = (key: string, i: number) => `${key}.${i}`;

export function createChunkedStorage(store: KeyValueStore): StacksStorage {
  return {
    async getItem(key) {
      const head = await store.getItemAsync(key);
      if (head === null) return null;
      if (!head.startsWith(HEADER)) return head;

      const count = Number(head.slice(HEADER.length));
      if (!Number.isInteger(count) || count < 1) return null;

      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        const part = await store.getItemAsync(partKey(key, i));
        // A half-written value is no value: report it missing so the caller
        // signs in again rather than parsing a truncated session.
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    },

    async setItem(key, value) {
      await this.removeItem(key);

      if (value.length <= CHUNK) {
        await store.setItemAsync(key, value);
        return;
      }

      const parts: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK) parts.push(value.slice(i, i + CHUNK));

      // The parts land before the header, so a crash midway leaves no header
      // claiming chunks that were never written.
      for (const [i, part] of parts.entries()) await store.setItemAsync(partKey(key, i), part);
      await store.setItemAsync(key, `${HEADER}${parts.length}`);
    },

    async removeItem(key) {
      const head = await store.getItemAsync(key);
      if (head !== null && head.startsWith(HEADER)) {
        const count = Number(head.slice(HEADER.length));
        for (let i = 0; Number.isInteger(count) && i < count; i++) {
          await store.deleteItemAsync(partKey(key, i));
        }
      }
      await store.deleteItemAsync(key);
    },
  };
}
