import type { Session, UserBook } from './types';

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` for a local calendar day. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDay(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/**
 * Consecutive local days ending today or yesterday. Yesterday still counts, so
 * a streak is not lost before the day it belongs to is over. Two sessions on
 * the same day count once.
 */
export function currentStreak(sessions: Session[], today: Date): number {
  if (sessions.length === 0) return 0;
  const days = new Set(sessions.map((s) => s.readOn));
  const todayMs = parseDay(dayKey(today));

  let cursor = days.has(dayKey(today)) ? todayMs : todayMs - DAY_MS;
  if (!days.has(dayKey(new Date(cursor)))) return 0;

  let streak = 0;
  while (days.has(dayKey(new Date(cursor)))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

function inRange(s: Session, from: string, to: string): boolean {
  return s.readOn >= from && s.readOn <= to;
}

export function pagesInRange(sessions: Session[], from: string, to: string): number {
  return sessions.filter((s) => inRange(s, from, to)).reduce((total, s) => {
    if (s.pageStart == null || s.pageEnd == null) return total;
    return total + Math.max(0, s.pageEnd - s.pageStart);
  }, 0);
}

export function minutesInRange(sessions: Session[], from: string, to: string): number {
  return sessions
    .filter((s) => inRange(s, from, to))
    .reduce((total, s) => total + (s.minutes ?? 0), 0);
}

/** Finished books per `YYYY-MM`, ascending. */
export function booksFinishedByMonth(books: UserBook[]): Array<{ month: string; count: number }> {
  const counts = new Map<string, number>();
  for (const b of books) {
    if (b.status !== 'finished' || !b.finishedAt) continue;
    const month = b.finishedAt.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
