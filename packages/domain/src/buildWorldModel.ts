import { currentStreak } from './stats';
import { packShelves, spineWidth } from './shelves';
import { GENRES } from './types';
import type { Book, Genre, Session, ShelvedBook, UserBook, WorldModel } from './types';

/** Five walls of five boards per genre room. */
export const BOARDS_PER_ROOM = 25;
export const BOARD_SPAN = 4.87; // metres of usable board: hex side 5.77 less the end posts
const DEFAULT_PAGES = 300;

function shelved(userBook: UserBook, book: Book): ShelvedBook {
  const pages = book.pages ?? DEFAULT_PAGES;
  return {
    id: userBook.id,
    title: book.title,
    author: book.author,
    pages,
    spineWidth: spineWidth(pages),
    status: userBook.status === 'want' ? 'finished' : userBook.status,
  };
}

/**
 * Rows in, world out. The only place that decides what the library looks like,
 * so the world layer can be developed against a fixture with no database.
 *
 * Currently-reading books sit on the desk, not the shelf: they shelve themselves
 * when they are marked finished.
 */
export function buildWorldModel(
  userBooks: UserBook[],
  books: Book[],
  sessions: Session[],
  today: Date,
): WorldModel {
  const byId = new Map(books.map((b) => [b.id, b]));
  const resolved = userBooks
    .map((ub) => {
      const book = byId.get(ub.bookId);
      return book ? { userBook: ub, book } : null;
    })
    .filter((x): x is { userBook: UserBook; book: Book } => x !== null);

  const reading = resolved
    .filter(({ userBook }) => userBook.status === 'reading')
    .map(({ userBook, book }) => shelved(userBook, book));

  const rooms: WorldModel['rooms'] = [];
  for (const genre of GENRES) {
    // Everything you own stands in its room, including what you are reading —
    // a library you cannot see until you finish something is not a library.
    // The desk shows current reads as well; the shelf is where they live.
    const inGenre = resolved
      .filter(({ userBook }) => userBook.genre === genre && userBook.status !== 'want')
      .sort((a, b) => (a.userBook.finishedAt ?? a.userBook.addedAt).localeCompare(b.userBook.finishedAt ?? b.userBook.addedAt))
      .map(({ userBook, book }) => shelved(userBook, book));

    if (inGenre.length === 0) continue; // no books, no room: the arch stays bricked up

    rooms.push({ genre: genre as Genre, shelves: packShelves(inGenre, BOARDS_PER_ROOM, BOARD_SPAN).map((b) => b.books) });
  }

  return { rooms, reading, streak: currentStreak(sessions, today) };
}
