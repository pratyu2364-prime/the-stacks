import { describe, expect, it } from 'vitest';
import { booksFinishedByMonth, currentStreak, minutesInRange, pagesInRange } from './stats';
import type { Session, UserBook } from './types';

const session = (readOn: string, extra: Partial<Session> = {}): Session => ({
  id: readOn + Math.random(),
  userBookId: 'ub1',
  readOn,
  pageStart: null,
  pageEnd: null,
  minutes: null,
  mood: null,
  note: null,
  ...extra,
});

const TODAY = new Date(2026, 8, 9); // 2026-09-09, local

describe('currentStreak', () => {
  it('is zero with no sessions', () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it('counts today alone as one', () => {
    expect(currentStreak([session('2026-09-09')], TODAY)).toBe(1);
  });

  it('survives a day that is not over yet', () => {
    expect(currentStreak([session('2026-09-08'), session('2026-09-07')], TODAY)).toBe(2);
  });

  it('breaks on a two-day gap', () => {
    expect(currentStreak([session('2026-09-06'), session('2026-09-05')], TODAY)).toBe(0);
  });

  it('counts two sessions on one day once', () => {
    const s = [session('2026-09-09'), session('2026-09-09'), session('2026-09-08')];
    expect(currentStreak(s, TODAY)).toBe(2);
  });

  it('does not care about input order', () => {
    const s = [session('2026-09-07'), session('2026-09-09'), session('2026-09-08')];
    expect(currentStreak(s, TODAY)).toBe(3);
  });

  it('stops at the first gap, ignoring older runs', () => {
    const s = [session('2026-09-09'), session('2026-09-08'), session('2026-09-05'), session('2026-09-04')];
    expect(currentStreak(s, TODAY)).toBe(2);
  });
});

describe('pagesInRange', () => {
  it('sums page deltas inside the range only', () => {
    const s = [
      session('2026-09-08', { pageStart: 100, pageEnd: 140 }),
      session('2026-09-09', { pageStart: 140, pageEnd: 175 }),
      session('2026-08-30', { pageStart: 0, pageEnd: 500 }),
    ];
    expect(pagesInRange(s, '2026-09-07', '2026-09-09')).toBe(75);
  });

  it('ignores sessions with missing page numbers', () => {
    expect(pagesInRange([session('2026-09-09')], '2026-09-01', '2026-09-09')).toBe(0);
  });

  it('never counts a backwards delta', () => {
    const s = [session('2026-09-09', { pageStart: 200, pageEnd: 20 })];
    expect(pagesInRange(s, '2026-09-01', '2026-09-09')).toBe(0);
  });
});

describe('minutesInRange', () => {
  it('sums minutes and treats null as zero', () => {
    const s = [session('2026-09-09', { minutes: 45 }), session('2026-09-09')];
    expect(minutesInRange(s, '2026-09-09', '2026-09-09')).toBe(45);
  });
});

describe('booksFinishedByMonth', () => {
  const book = (status: UserBook['status'], finishedAt: string | null): UserBook => ({
    id: Math.random().toString(),
    bookId: 'b',
    status,
    genre: 'fiction',
    rating: null,
    addedAt: '2026-01-01',
    finishedAt,
  });

  it('groups by month, ascending, ignoring unfinished books', () => {
    const books = [
      book('finished', '2026-09-02'),
      book('finished', '2026-09-20'),
      book('finished', '2026-07-11'),
      book('reading', null),
      book('abandoned', null),
    ];
    expect(booksFinishedByMonth(books)).toEqual([
      { month: '2026-07', count: 1 },
      { month: '2026-09', count: 2 },
    ]);
  });

  it('is empty when nothing is finished', () => {
    expect(booksFinishedByMonth([book('reading', null)])).toEqual([]);
  });
});
