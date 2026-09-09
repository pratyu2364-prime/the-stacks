import { describe, expect, it } from 'vitest';
import { overflow, packShelves, spineWidth } from './shelves';
import type { ShelvedBook } from './types';

const book = (id: string, pages: number): ShelvedBook => ({
  id,
  title: `Book ${id}`,
  author: 'Someone',
  pages,
  spineWidth: spineWidth(pages),
  status: 'finished',
});

describe('spineWidth', () => {
  it('is thinnest at zero pages', () => expect(spineWidth(0)).toBeCloseTo(0.09));
  it('caps at 850 pages', () => {
    expect(spineWidth(850)).toBeCloseTo(0.25);
    expect(spineWidth(2000)).toBeCloseTo(0.25);
  });
  it('orders books by length', () => expect(spineWidth(824)).toBeGreaterThan(spineWidth(106)));
  it('clamps negative nonsense', () => expect(spineWidth(-40)).toBeCloseTo(0.09));
});

describe('packShelves', () => {
  it('returns the asked-for number of boards even with no books', () => {
    const boards = packShelves([], 5, 4);
    expect(boards).toHaveLength(5);
    expect(boards.every((b) => b.books.length === 0 && b.gap === 4)).toBe(true);
  });

  it('fills the first board before starting the second', () => {
    const books = Array.from({ length: 6 }, (_, i) => book(`b${i}`, 300));
    const boards = packShelves(books, 3, 0.6);
    expect(boards[0].books.length).toBeGreaterThan(0);
    expect(boards[0].books.length + boards[1].books.length).toBe(6);
    expect(boards[2].books).toHaveLength(0);
  });

  it('leaves the leftover space as gap', () => {
    const boards = packShelves([book('a', 0)], 1, 1);
    expect(boards[0].gap).toBeCloseTo(1 - 0.09);
  });

  it('is deterministic', () => {
    const books = Array.from({ length: 10 }, (_, i) => book(`b${i}`, 100 * i));
    expect(packShelves(books, 4, 1)).toEqual(packShelves(books, 4, 1));
  });

  it('drops nothing silently — overflow reports what did not fit', () => {
    const books = Array.from({ length: 30 }, (_, i) => book(`b${i}`, 800));
    const left = overflow(books, 2, 0.6);
    expect(left.length).toBeGreaterThan(0);
    expect(left[0].id).toBe(`b${30 - left.length}`);
  });
});
