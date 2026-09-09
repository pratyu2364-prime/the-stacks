import type { ShelvedBook } from './types';

/** Spine width in metres from page count. A fat spine always means a long book. */
export function spineWidth(pages: number): number {
  const clamped = Math.min(Math.max(pages, 0), 850);
  return 0.09 + (clamped / 850) * 0.16;
}

export type PackedBoard = {
  books: ShelvedBook[];
  /** Metres left over to the right of the bookend — the honest empty space. */
  gap: number;
};

/**
 * Fill boards left to right, in order, no reflow. Deterministic: the same books
 * in the same order always land on the same board, so the library does not
 * rearrange itself behind the user's back.
 */
export function packShelves(books: ShelvedBook[], boardCount: number, boardSpan: number): PackedBoard[] {
  const boards: PackedBoard[] = Array.from({ length: boardCount }, () => ({ books: [], gap: boardSpan }));
  const GAP_BETWEEN = 0.012;

  let index = 0;
  for (const book of books) {
    while (index < boardCount) {
      const board = boards[index];
      const needed = book.spineWidth + (board.books.length > 0 ? GAP_BETWEEN : 0);
      if (needed <= board.gap) {
        board.books.push(book);
        board.gap -= needed;
        break;
      }
      index += 1;
    }
    if (index >= boardCount) break; // room is full; the caller opens another one
  }
  return boards;
}

/** Books that did not fit in `boardCount` boards of `boardSpan` metres. */
export function overflow(books: ShelvedBook[], boardCount: number, boardSpan: number): ShelvedBook[] {
  const packed = packShelves(books, boardCount, boardSpan).flatMap((b) => b.books);
  return books.slice(packed.length);
}
