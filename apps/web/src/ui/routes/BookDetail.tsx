import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Book, Session, UserBook } from '@stacks/domain';
import { dayKey } from '@stacks/domain';
import { coverUrl, loadLibrary, logSession, removeBook, setStatus, updateSession, removeSession } from '@stacks/data';
import { supabase } from '../../supabase';
import { Shell } from '../components/Shell';

export function BookDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [userBook, setUserBook] = useState<UserBook | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadLibrary(supabase);
    const ub = data.userBooks.find((u) => u.id === id) ?? null;
    setUserBook(ub);
    setBook(ub ? data.books.find((b) => b.id === ub.bookId) ?? null : null);
    setSessions(data.sessions.filter((s) => s.userBookId === id).sort((a, b) => a.readOn.localeCompare(b.readOn)));
  }, [id]);

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, [refresh]);

  const lastPage = useMemo(
    () => sessions.reduce((page, s) => (s.pageEnd != null && s.pageEnd > page ? s.pageEnd : page), 0),
    [sessions],
  );

  if (error) return <Shell><p className="text-red-300 text-sm">{error}</p></Shell>;
  if (!book || !userBook) return <Shell><p className="text-dust text-sm">looking for it…</p></Shell>;

  const progress = book.pages ? Math.min(100, Math.round((lastPage / book.pages) * 100)) : null;

  return (
    <Shell>
      <div className="flex gap-5 items-start mb-8">
        {coverUrl(book.coverId, 'M') ? (
          <img src={coverUrl(book.coverId, 'M')!} alt="" className="w-24 rounded shadow-lg" />
        ) : (
          <div className="w-24 h-36 rounded bg-oak/40" />
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-3xl text-paper">{book.title}</h1>
          <p className="text-dust text-sm mt-1">{book.author} · {book.pages ?? '?'}pp · {userBook.genre}</p>
          {progress !== null && (
            <div className="mt-3 w-56 h-1.5 bg-oak/40 rounded overflow-hidden">
              <div className="h-full bg-lamp" style={{ width: `${progress}%` }} data-testid="progress" />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {(['reading', 'finished', 'abandoned'] as const).map((s) => (
              <button
                key={s}
                onClick={() => void setStatus(supabase, userBook.id, s).then(refresh)}
                className={`px-2.5 py-1 rounded border text-[11px] uppercase tracking-widest ${
                  userBook.status === s ? 'border-lamp text-lamp' : 'border-oak/50 text-dust'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const sittingCount = sessions.length;
              const msg = sittingCount > 0
                ? `Remove "${book.title}"? This also deletes the ${sittingCount} sitting${sittingCount === 1 ? '' : 's'} you logged for it.`
                : `Remove "${book.title}" from your shelves?`;
              if (!window.confirm(msg)) return;
              removeBook(supabase, userBook.id)
                .then(() => navigate('/books'))
                .catch((e: Error) => {
                  setError(e.message);
                });
            }}
            className="mt-3 px-2.5 py-1 rounded border border-red-400/50 text-red-300 text-[11px] uppercase tracking-widest"
          >
            remove
          </button>
        </div>
      </div>

      <LogSession userBookId={userBook.id} lastPage={lastPage} onLogged={() => void refresh()} />

      <h2 className="font-serif text-xl mt-10 mb-3">The thread</h2>
      {sessions.length === 0 && <p className="text-dust text-sm">No sittings logged yet.</p>}
      <ol data-testid="thread" className="grid gap-3">
        {sessions.map((s) => (
          <SittingRow key={s.id} session={s} onSaved={() => void refresh()} />
        ))}
      </ol>
    </Shell>
  );
}

function SittingRow({ session, onSaved }: { session: Session; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [readOn, setReadOn] = useState(session.readOn);
  const [pageStart, setPageStart] = useState(session.pageStart != null ? String(session.pageStart) : '');
  const [pageEnd, setPageEnd] = useState(session.pageEnd != null ? String(session.pageEnd) : '');
  const [minutes, setMinutes] = useState(session.minutes != null ? String(session.minutes) : '');
  const [mood, setMood] = useState(session.mood ?? '');
  const [note, setNote] = useState(session.note ?? '');

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await updateSession(supabase, session.id, {
        readOn,
        pageStart: pageStart === '' ? null : Number(pageStart),
        pageEnd: pageEnd === '' ? null : Number(pageEnd),
        minutes: minutes === '' ? null : Number(minutes),
        mood: mood || null,
        note: note || null,
      });
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'could not save');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!window.confirm('Delete this sitting?')) return;
    setBusy(true);
    removeSession(supabase, session.id)
      .then(onSaved)
      .catch((e: Error) => { setError(e.message); setBusy(false); });
  }

  if (editing) {
    return (
      <li className="border border-oak/60 rounded p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
          <input type="date" value={readOn} onChange={(e) => setReadOn(e.target.value)}
            className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
          <input value={pageStart} onChange={(e) => setPageStart(e.target.value)} inputMode="numeric"
            placeholder="from p." className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
          <input value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} inputMode="numeric"
            placeholder="to p." className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
          <input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="numeric"
            placeholder="minutes" className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
          <input value={mood} onChange={(e) => setMood(e.target.value)}
            placeholder="mood" className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="what you thought while reading"
          className="w-full bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm font-serif"
        />
        {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={() => void save()} disabled={busy}
            className="px-4 py-2 rounded bg-lamp text-ink text-xs uppercase tracking-widest disabled:opacity-50">
            {busy ? 'saving…' : 'save'}
          </button>
          <button onClick={() => setEditing(false)} disabled={busy}
            className="px-4 py-2 rounded border border-oak/50 text-dust text-xs uppercase tracking-widest">
            cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="border-l-2 border-oak/60 pl-4 py-1 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-dust">
            {session.readOn}
            {session.pageStart != null && session.pageEnd != null && ` · pp ${session.pageStart}–${session.pageEnd}`}
            {session.minutes != null && ` · ${session.minutes} min`}
            {session.mood && ` · ${session.mood}`}
          </p>
          {session.note && <p className="text-sm text-paper/90 mt-1 whitespace-pre-wrap font-serif">{session.note}</p>}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="px-2 py-0.5 rounded border border-oak/50 text-dust text-[10px] uppercase tracking-widest">
            edit
          </button>
          <button onClick={confirmDelete} disabled={busy}
            className="px-2 py-0.5 rounded border border-red-400/50 text-red-300 text-[10px] uppercase tracking-widest disabled:opacity-50">
            delete
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-300 mt-1">{error}</p>}
    </li>
  );
}

/**
 * The most-used screen in the product. Date is today, the page you stopped on is
 * already filled in, and the cursor is in the note — a sitting should take under
 * twenty seconds to record, keyboard only.
 */
function LogSession({ userBookId, lastPage, onLogged }: { userBookId: string; lastPage: number; onLogged: () => void }) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [readOn, setReadOn] = useState(dayKey(new Date()));
  const [pageStart, setPageStart] = useState(String(lastPage || ''));
  const [pageEnd, setPageEnd] = useState('');
  const [minutes, setMinutes] = useState('');
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPageStart(String(lastPage || '')), [lastPage]);
  useEffect(() => noteRef.current?.focus(), []);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await logSession(supabase, {
        userBookId,
        readOn,
        pageStart: pageStart === '' ? null : Number(pageStart),
        pageEnd: pageEnd === '' ? null : Number(pageEnd),
        minutes: minutes === '' ? null : Number(minutes),
        mood: mood || null,
        note: note || null,
      });
      setPageEnd('');
      setMinutes('');
      setMood('');
      setNote('');
      onLogged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'could not log it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-oak/50 rounded p-4">
      <h2 className="font-serif text-xl mb-3">Log a sitting</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <input type="date" value={readOn} onChange={(e) => setReadOn(e.target.value)} data-testid="session-date"
          className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
        <input value={pageStart} onChange={(e) => setPageStart(e.target.value)} data-testid="session-from" inputMode="numeric"
          placeholder="from p." className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
        <input value={pageEnd} onChange={(e) => setPageEnd(e.target.value)} data-testid="session-to" inputMode="numeric"
          placeholder="to p." className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
        <input value={minutes} onChange={(e) => setMinutes(e.target.value)} data-testid="session-minutes" inputMode="numeric"
          placeholder="minutes" className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
        <input value={mood} onChange={(e) => setMood(e.target.value)} data-testid="session-mood"
          placeholder="mood" className="bg-black/40 border border-oak/60 rounded px-2 py-1.5 text-sm" />
      </div>
      <textarea
        ref={noteRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        data-testid="session-note"
        rows={4}
        placeholder="what you thought while reading"
        className="w-full bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm font-serif"
      />
      {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
      <button onClick={() => void save()} disabled={busy} data-testid="session-save"
        className="mt-3 px-4 py-2 rounded bg-lamp text-ink text-xs uppercase tracking-widest disabled:opacity-50">
        {busy ? 'writing…' : 'log it'}
      </button>
    </section>
  );
}
