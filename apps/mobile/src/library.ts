import { useCallback, useEffect, useState } from 'react';
import { addBook as dataAddBook, loadLibrary, type NewBook, type SearchHit } from '@stacks/data';
import { currentStreak, type Book, type BookStatus, type Session, type UserBook } from '@stacks/domain';
import { supabase } from './supabase';

type LibraryValue = {
  books: Book[];
  userBooks: UserBook[];
  sessions: Session[];
  streak: number;
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  addBook(hit: SearchHit, status?: BookStatus): Promise<void>;
};

export function useLibrary(): LibraryValue {
  const [books, setBooks] = useState<Book[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const lib = await loadLibrary(supabase);
      setBooks(lib.books);
      setUserBooks(lib.userBooks);
      setSessions(lib.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const shelvedAddBook = useCallback(
    async (hit: SearchHit, status: BookStatus = 'reading') => {
      const book: NewBook = {
        olWorkKey: hit.olWorkKey,
        title: hit.title,
        author: hit.author,
        pages: hit.pages,
        coverId: hit.coverId,
        subjects: hit.subjects,
      };
      await dataAddBook(supabase, book, hit.genre, status);
      await reload();
    },
    [reload],
  );

  return {
    books,
    userBooks,
    sessions,
    streak: currentStreak(sessions, new Date()),
    loading,
    error,
    reload,
    addBook: shelvedAddBook,
  };
}