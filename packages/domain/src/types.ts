/** Domain types. Mirrors the schema in the design spec, section 4. */

export const GENRES = ['fiction', 'philosophy', 'science', 'history', 'arts', 'practical'] as const;
export type Genre = (typeof GENRES)[number];

export type BookStatus = 'want' | 'reading' | 'finished' | 'abandoned';

export type Book = {
  id: string;
  olWorkKey: string;
  title: string;
  author: string;
  pages: number | null;
  coverId: number | null;
  subjects: string[];
};

export type UserBook = {
  id: string;
  bookId: string;
  status: BookStatus;
  genre: Genre;
  rating: number | null;
  addedAt: string;
  finishedAt: string | null;
};

export type Session = {
  id: string;
  userBookId: string;
  /** Local calendar day, `YYYY-MM-DD`. Never a timestamp: the day is the unit. */
  readOn: string;
  pageStart: number | null;
  pageEnd: number | null;
  minutes: number | null;
  mood: string | null;
  note: string | null;
};

export type ShelvedBook = {
  id: string;
  title: string;
  author: string;
  pages: number;
  spineWidth: number;
  status: Exclude<BookStatus, 'want'>;
};

export type WorldModel = {
  rooms: Array<{ genre: Genre; shelves: ShelvedBook[][] }>;
  reading: ShelvedBook[];
  streak: number;
};
