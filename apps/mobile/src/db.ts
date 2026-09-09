import * as SQLite from 'expo-sqlite';
import type { PendingSession } from './outbox';
import { createOutbox, type Outbox, type OutboxDb } from './outbox';
import { supabase } from './supabase';

const database = SQLite.openDatabaseSync('stacks.db');

/** Narrow expo-sqlite's row type down to the shape the outbox speaks. */
const db: OutboxDb = {
  runAsync: (sql, params = []) => database.runAsync(sql, params as never),
  getAllAsync: (sql) =>
    database.getAllAsync(sql) as Promise<Array<PendingSession & { sent: number }>>,
};

export const outbox: Outbox = createOutbox(db, supabase);