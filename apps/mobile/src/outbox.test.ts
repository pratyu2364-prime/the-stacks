import { createOutbox, type PendingSession } from './outbox';

const row = (id: string): PendingSession => ({
  id,
  userBookId: 'ub1',
  readOn: '2026-09-09',
  pageStart: 1,
  pageEnd: 20,
  minutes: 30,
  mood: null,
  note: null,
});

/** A fake standing in for expo-sqlite: same two calls, plain arrays. */
function fakeDb() {
  const rows: Array<PendingSession & { sent: number }> = [];
  return {
    rows,
    async runAsync(sql: string, params: unknown[] = []) {
      if (sql.startsWith('insert')) {
        const [id] = params as string[];
        if (!rows.some((r) => r.id === id)) {
          rows.push({ ...(row(id) as PendingSession), sent: 0 });
        }
      }
      if (sql.startsWith('update')) {
        const [id] = params as string[];
        const found = rows.find((r) => r.id === id);
        if (found) found.sent = 1;
      }
    },
    async getAllAsync() {
      return rows.filter((r) => r.sent === 0);
    },
  };
}

function fakeClient(behavior: 'ok' | 'fail') {
  const inserted: string[] = [];
  return {
    inserted,
    from() {
      return {
        upsert: async (values: { id: string }[]) => {
          if (behavior === 'fail') return { error: { message: 'network' } };
          for (const v of values) if (!inserted.includes(v.id)) inserted.push(v.id);
          return { error: null };
        },
      };
    },
  };
}

it('sends a queued session and marks it sent', async () => {
  const db = fakeDb();
  const client = fakeClient('ok');
  const outbox = createOutbox(db as never, client as never);

  await outbox.enqueue(row('s1'));
  expect(await outbox.pending()).toHaveLength(1);

  const result = await outbox.flush();

  expect(result).toEqual({ sent: 1, failed: 0 });
  expect(await outbox.pending()).toHaveLength(0);
  expect(client.inserted).toEqual(['s1']);
});

it('keeps the row queued when the write fails', async () => {
  const db = fakeDb();
  const outbox = createOutbox(db as never, fakeClient('fail') as never);

  await outbox.enqueue(row('s1'));
  const result = await outbox.flush();

  expect(result).toEqual({ sent: 0, failed: 1 });
  expect(await outbox.pending()).toHaveLength(1);
});

it('flushing twice writes one row, not two', async () => {
  const db = fakeDb();
  const client = fakeClient('ok');
  const outbox = createOutbox(db as never, client as never);

  await outbox.enqueue(row('s1'));
  await outbox.flush();
  await outbox.enqueue(row('s1'));
  await outbox.flush();

  expect(client.inserted).toEqual(['s1']);
});

it('a session queued before a restart is still there after one', async () => {
  const db = fakeDb();
  await createOutbox(db as never, fakeClient('fail') as never).enqueue(row('s1'));

  const afterRestart = createOutbox(db as never, fakeClient('ok') as never);

  expect(await afterRestart.pending()).toHaveLength(1);
  expect(await afterRestart.flush()).toEqual({ sent: 1, failed: 0 });
});

it('waits for the table before the first write, however slow the create is', async () => {
  const db = fakeDb();
  const created: string[] = [];
  const slowDb = {
    ...db,
    async runAsync(sql: string, params: unknown[] = []) {
      if (sql.startsWith('create')) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        created.push('create');
        return;
      }
      if (created.length === 0) throw new Error('no such table: outbox');
      return db.runAsync(sql, params);
    },
    async getAllAsync() {
      if (created.length === 0) throw new Error('no such table: outbox');
      return db.getAllAsync();
    },
  };

  const outbox = createOutbox(slowDb as never, fakeClient('ok') as never);
  await outbox.enqueue(row('s1'));

  expect(await outbox.pending()).toHaveLength(1);
});
