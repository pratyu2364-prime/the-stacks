import { describe, expect, it } from 'vitest';
import { BOARDS_PER_ROOM, buildWorldModel } from './buildWorldModel';
import type { Book, Session, UserBook } from './types';

const TODAY = new Date(2026, 8, 9);

const book = (id: string, title: string, pages: number | null = 300): Book => ({
  id,
  olWorkKey: `/works/${id}`,
  title,
  author: 'Author',
  pages,
  coverId: null,
  subjects: [],
});

const userBook = (id: string, bookId: string, over: Partial<UserBook> = {}): UserBook => ({
  id,
  bookId,
  status: 'finished',
  genre: 'fiction',
  rating: null,
  addedAt: '2026-01-01',
  finishedAt: '2026-02-01',
  ...over,
});

const session = (readOn: string): Session => ({
  id: readOn,
  userBookId: 'ub1',
  readOn,
  pageStart: null,
  pageEnd: null,
  minutes: null,
  mood: null,
  note: null,
});

describe('buildWorldModel', () => {
  it('is an empty world for a new account', () => {
    const model = buildWorldModel([], [], [], TODAY);
    expect(model.rooms).toEqual([]);
    expect(model.reading).toEqual([]);
    expect(model.streak).toBe(0);
  });

  it('opens a room only for genres that hold books', () => {
    const books = [book('b1', 'A Novel'), book('b2', 'A Treatise')];
    const ubs = [userBook('u1', 'b1'), userBook('u2', 'b2', { genre: 'philosophy' })];
    const model = buildWorldModel(ubs, books, [], TODAY);
    expect(model.rooms.map((r) => r.genre)).toEqual(['fiction', 'philosophy']);
  });

  it('puts a book you are reading on the desk and on its shelf', () => {
    const books = [book('b1', 'In Progress')];
    const ubs = [userBook('u1', 'b1', { status: 'reading', finishedAt: null })];
    const model = buildWorldModel(ubs, books, [], TODAY);
    expect(model.reading.map((b) => b.title)).toEqual(['In Progress']);
    // One owned book is enough to open a room: otherwise a new reader walks
    // into a library with no shelves anywhere, which is what shipped first.
    expect(model.rooms.map((r) => r.genre)).toEqual(['fiction']);
    expect(model.rooms[0].shelves[0].map((b) => b.title)).toEqual(['In Progress']);
  });

  it('leaves want-to-read books out of the world entirely', () => {
    const ubs = [userBook('u1', 'b1', { status: 'want', finishedAt: null })];
    const model = buildWorldModel(ubs, [book('b1', 'Someday')], [], TODAY);
    expect(model.rooms).toEqual([]);
    expect(model.reading).toEqual([]);
  });

  it('gives every room the full board count', () => {
    const model = buildWorldModel([userBook('u1', 'b1')], [book('b1', 'One')], [], TODAY);
    expect(model.rooms[0].shelves).toHaveLength(BOARDS_PER_ROOM);
    expect(model.rooms[0].shelves[0].map((b) => b.title)).toEqual(['One']);
  });

  it('defaults a missing page count instead of producing a zero-width spine', () => {
    const model = buildWorldModel([userBook('u1', 'b1')], [book('b1', 'No Pages', null)], [], TODAY);
    expect(model.rooms[0].shelves[0][0].pages).toBe(300);
    expect(model.rooms[0].shelves[0][0].spineWidth).toBeGreaterThan(0.09);
  });

  it('ignores a user_book whose book row is missing', () => {
    const model = buildWorldModel([userBook('u1', 'ghost')], [], [], TODAY);
    expect(model.rooms).toEqual([]);
  });

  it('shelves in finishing order', () => {
    const books = [book('b1', 'Second'), book('b2', 'First')];
    const ubs = [
      userBook('u1', 'b1', { finishedAt: '2026-05-01' }),
      userBook('u2', 'b2', { finishedAt: '2026-03-01' }),
    ];
    const model = buildWorldModel(ubs, books, [], TODAY);
    expect(model.rooms[0].shelves[0].map((b) => b.title)).toEqual(['First', 'Second']);
  });

  it('carries the streak through', () => {
    const model = buildWorldModel([], [], [session('2026-09-09'), session('2026-09-08')], TODAY);
    expect(model.streak).toBe(2);
  });
});
