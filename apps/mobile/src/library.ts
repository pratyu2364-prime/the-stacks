import { useCallback, useEffect, useState } from 'react';
import { addBook as dataAddBook, loadLibrary, removeBook as dataRemoveBook, updateSession as dataUpdateSession, removeSession as dataRemoveSession, type NewBook, type SearchHit, type SessionPatch } from '@stacks/data';
import { currentStreak, type Book, type BookStatus, type Session, type UserBook } from '@stacks/domain';
import { outbox } from './db';
import { supabase } from './supabase';

type LibraryValue = {
  books: Book[];
  userBooks: UserBook[];
  sessions: Session[];
  pendingIds: Set<string>;
  streak: number;
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  addBook(hit: SearchHit, status?: BookStatus): Promise<void>;
  removeBook(userBookId: string): Promise<void>;
  editSession(id: string, patch: SessionPatch): Promise<void>;
  deleteSession(id: string): Promise<void>;
};

export function useLibrary(): LibraryValue {
  const [books, setBooks] = useState<Book[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const lib = await loadLibrary(supabase);
      const pending = await outbox.pending();
      const serverIds = new Set(lib.sessions.map((s) => s.id));
      const merged = [
        ...lib.sessions,
        ...pending.filter((p) => !serverIds.has(p.id)),
      ];
      // A row the server already has is not pending, whatever the outbox still
      // says: marking it unsynced would both lie to the reader and withhold the
      // edit controls from a sitting that can perfectly well be edited.
      const pendingSet = new Set(
        pending.filter((p) => !serverIds.has(p.id)).map((p) => p.id),
      );
      setBooks(lib.books);
      setUserBooks(lib.userBooks);
      setSessions(merged);
      setPendingIds(pendingSet);
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

  const removeBookById = useCallback(
    async (userBookId: string) => {
      await dataRemoveBook(supabase, userBookId);
      await reload();
    },
    [reload],
  );

  const editSessionById = useCallback(
    async (sessionId: string, patch: SessionPatch) => {
      await dataUpdateSession(supabase, sessionId, patch);
      await reload();
    },
    [reload],
  );

  const deleteSessionById = useCallback(
    async (sessionId: string) => {
      await dataRemoveSession(supabase, sessionId);
      await reload();
    },
    [reload],
  );

  return {
    books,
    userBooks,
    sessions,
    pendingIds,
    streak: currentStreak(sessions, new Date()),
    loading,
    error,
    reload,
    addBook: shelvedAddBook,
    removeBook: removeBookById,
    editSession: editSessionById,
    deleteSession: deleteSessionById,
  };
}