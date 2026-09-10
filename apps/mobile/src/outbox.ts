import type { SupabaseClient } from '@supabase/supabase-js';

export type PendingSession = {
  id: string;
  userBookId: string;
  readOn: string;
  pageStart: number | null;
  pageEnd: number | null;
  minutes: number | null;
  mood: string | null;
  note: string | null;
};

export type OutboxDb = {
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  getAllAsync(sql: string, params?: unknown[]): Promise<Array<PendingSession & { sent: number }>>;
};

export type Outbox = {
  enqueue(s: PendingSession): Promise<void>;
  pending(): Promise<PendingSession[]>;
  flush(): Promise<{ sent: number; failed: number }>;
};

const CREATE = `create table if not exists outbox (
  id text primary key,
  user_book_id text not null,
  read_on text not null,
  page_start integer,
  page_end integer,
  minutes integer,
  mood text,
  note text,
  sent integer not null default 0
)`;

const INSERT =
  'insert or ignore into outbox (id, user_book_id, read_on, page_start, page_end, minutes, mood, note) values (?, ?, ?, ?, ?, ?, ?, ?)';

const SELECT_PENDING =
  'select id, user_book_id as userBookId, read_on as readOn, page_start as pageStart, page_end as pageEnd, minutes, mood, note, sent from outbox where sent = 0';

const MARK_SENT = 'update outbox set sent = 1 where id = ?';

/** Drop the local `sent` column and keep the camelCase shape. */
function toPending(r: PendingSession & { sent: number }): PendingSession {
  return {
    id: r.id,
    userBookId: r.userBookId,
    readOn: r.readOn,
    pageStart: r.pageStart,
    pageEnd: r.pageEnd,
    minutes: r.minutes,
    mood: r.mood,
    note: r.note,
  };
}

/** Swap the camelCase shape back for the wire and drop `sent`, which sessions lacks. */
function toRows(rows: Array<PendingSession & { sent: number }>) {
  return rows.map((r) => ({
    id: r.id,
    user_book_id: r.userBookId,
    read_on: r.readOn,
    page_start: r.pageStart,
    page_end: r.pageEnd,
    minutes: r.minutes,
    mood: r.mood,
    note: r.note,
  }));
}

export function createOutbox(db: OutboxDb, client: SupabaseClient): Outbox {
  /**
   * Every operation waits on this. Firing the create and returning would let a
   * cold start's first enqueue reach SQLite before the table exists, and losing
   * a logged session is the one thing this module exists to prevent.
   */
  const ready = db.runAsync(CREATE);

  return {
    async enqueue(s) {
      await ready;
      await db.runAsync(INSERT, [
        s.id,
        s.userBookId,
        s.readOn,
        s.pageStart,
        s.pageEnd,
        s.minutes,
        s.mood,
        s.note,
      ]);
    },

    async pending() {
      await ready;
      const rows = await db.getAllAsync(SELECT_PENDING);
      return rows.map(toPending);
    },

    async flush() {
      await ready;
      const rows = await db.getAllAsync(SELECT_PENDING);
      if (rows.length === 0) return { sent: 0, failed: 0 };

      const { error } = await client
        .from('sessions')
        .upsert(toRows(rows), { onConflict: 'id', ignoreDuplicates: true });

      if (error) return { sent: 0, failed: rows.length };

      for (const r of rows) {
        await db.runAsync(MARK_SENT, [r.id]);
      }
      return { sent: rows.length, failed: 0 };
    },
  };
}