import type { Book, Genre, Session, UserBook } from '../domain';
import { supabase } from './client';

type BookRow = {
  id: string;
  ol_work_key: string;
  title: string;
  author: string;
  pages: number | null;
  cover_id: number | null;
  subjects: string[];
};

type UserBookRow = {
  id: string;
  book_id: string;
  status: UserBook['status'];
  genre: Genre;
  rating: number | null;
  added_at: string;
  finished_at: string | null;
};

type SessionRow = {
  id: string;
  user_book_id: string;
  read_on: string;
  page_start: number | null;
  page_end: number | null;
  minutes: number | null;
  mood: string | null;
  note: string | null;
};

const toBook = (r: BookRow): Book => ({
  id: r.id,
  olWorkKey: r.ol_work_key,
  title: r.title,
  author: r.author,
  pages: r.pages,
  coverId: r.cover_id,
  subjects: r.subjects,
});

const toUserBook = (r: UserBookRow): UserBook => ({
  id: r.id,
  bookId: r.book_id,
  status: r.status,
  genre: r.genre,
  rating: r.rating,
  addedAt: r.added_at,
  finishedAt: r.finished_at,
});

const toSession = (r: SessionRow): Session => ({
  id: r.id,
  userBookId: r.user_book_id,
  readOn: r.read_on,
  pageStart: r.page_start,
  pageEnd: r.page_end,
  minutes: r.minutes,
  mood: r.mood,
  note: r.note,
});

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('no data returned');
  return result.data;
}

/** Everything the dashboard and the world need, in three round trips. */
export async function loadLibrary(): Promise<{ books: Book[]; userBooks: UserBook[]; sessions: Session[] }> {
  const userBookRows = unwrap(await supabase.from('user_books').select('*').order('added_at'));
  const bookIds = [...new Set((userBookRows as UserBookRow[]).map((r) => r.book_id))];
  const bookRows = bookIds.length
    ? unwrap(await supabase.from('books').select('*').in('id', bookIds))
    : [];
  const sessionRows = unwrap(await supabase.from('sessions').select('*').order('read_on'));

  return {
    books: (bookRows as BookRow[]).map(toBook),
    userBooks: (userBookRows as UserBookRow[]).map(toUserBook),
    sessions: (sessionRows as SessionRow[]).map(toSession),
  };
}

export type NewBook = {
  olWorkKey: string;
  title: string;
  author: string;
  pages: number | null;
  coverId: number | null;
  subjects: string[];
};

/**
 * Cache the book for everyone, then shelve it for this reader. The upsert keeps
 * the cache single-copy per Open Library work; after this the world never waits
 * on a third party again.
 */
export async function addBook(book: NewBook, genre: Genre, status: UserBook['status'] = 'reading'): Promise<UserBook> {
  const cached = unwrap(
    await supabase
      .from('books')
      .upsert(
        {
          ol_work_key: book.olWorkKey,
          title: book.title,
          author: book.author,
          pages: book.pages,
          cover_id: book.coverId,
          subjects: book.subjects,
        },
        { onConflict: 'ol_work_key', ignoreDuplicates: false },
      )
      .select()
      .single(),
  ) as BookRow;

  const shelved = unwrap(
    await supabase.from('user_books').insert({ book_id: cached.id, status, genre }).select().single(),
  ) as UserBookRow;

  return toUserBook(shelved);
}

export type NewSession = {
  userBookId: string;
  readOn: string;
  pageStart: number | null;
  pageEnd: number | null;
  minutes: number | null;
  mood: string | null;
  note: string | null;
};

export async function logSession(session: NewSession): Promise<Session> {
  const row = unwrap(
    await supabase
      .from('sessions')
      .insert({
        user_book_id: session.userBookId,
        read_on: session.readOn,
        page_start: session.pageStart,
        page_end: session.pageEnd,
        minutes: session.minutes,
        mood: session.mood,
        note: session.note,
      })
      .select()
      .single(),
  ) as SessionRow;
  return toSession(row);
}

export async function setStatus(userBookId: string, status: UserBook['status']): Promise<void> {
  const finished_at = status === 'finished' ? new Date().toISOString() : null;
  const { error } = await supabase.from('user_books').update({ status, finished_at }).eq('id', userBookId);
  if (error) throw new Error(error.message);
}
