import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GENRES, type Book, type Genre, type UserBook } from '@stacks/domain';
import { addBook, coverUrl, loadLibrary, searchBooks, type SearchHit } from '@stacks/data';
import { supabase } from '../../supabase';
import { Shell } from '../components/Shell';

type Row = { userBook: UserBook; book: Book };

/**
 * An aborted request is not a failure in any client. Web throws AbortError;
 * React Native can surface a TypeError with "Abort" inside its message — so
 * match on the message, not the name.
 */
function isAbortError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === 'AbortError') return true;
  return e.message.toLowerCase().includes('abort');
}

export function Books() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<'all' | UserBook['status']>('all');
  const [genre, setGenre] = useState<'all' | Genre>('all');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { books, userBooks } = await loadLibrary(supabase);
    const byId = new Map(books.map((b) => [b.id, b]));
    setRows(userBooks.flatMap((ub) => {
      const book = byId.get(ub.bookId);
      return book ? [{ userBook: ub, book }] : [];
    }));
  }, []);

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, [refresh]);

  const shown = rows.filter(
    (r) => (status === 'all' || r.userBook.status === status) && (genre === 'all' || r.userBook.genre === genre),
  );

  return (
    <Shell>
      <AddBook onAdded={() => void refresh()} />

      <div className="flex flex-wrap gap-2 mt-10 mb-4 text-[11px] uppercase tracking-widest">
        {(['all', 'reading', 'finished', 'want', 'abandoned'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-2.5 py-1 rounded border ${status === s ? 'border-lamp text-lamp' : 'border-oak/50 text-dust'}`}
          >
            {s}
          </button>
        ))}
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value as Genre | 'all')}
          className="ml-auto bg-black/40 border border-oak/50 rounded px-2 py-1 text-dust"
        >
          <option value="all">every room</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
      {shown.length === 0 && <p className="text-dust text-sm">Nothing here yet. Add the book you are reading now.</p>}

      <ul data-testid="library" className="grid gap-3">
        {shown.map(({ userBook, book }) => (
          <li key={userBook.id} className="border border-oak/40 rounded p-3 flex gap-3 items-center">
            {coverUrl(book.coverId, 'S') ? (
              <img src={coverUrl(book.coverId, 'S')!} alt="" className="w-10 h-14 object-cover rounded-sm" />
            ) : (
              <div className="w-10 h-14 rounded-sm bg-oak/40" />
            )}
            <div className="min-w-0">
              <Link to={`/books/${userBook.id}`} className="font-serif text-paper hover:text-lamp block truncate">
                {book.title}
              </Link>
              <p className="text-xs text-dust truncate">
                {book.author} · {book.pages ?? '?'}pp · {userBook.genre} · {userBook.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function AddBook({ onAdded }: { onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<SearchHit | null>(null);
  const abort = useRef<AbortController | null>(null);
  // Monotone request id: a result is only worth keeping if it belongs to the
  // latest query. Superseded requests vanish silently no matter what settles.
  const seq = useRef(0);

  const byHand = () =>
    setPending({
      olWorkKey: `manual:${crypto.randomUUID()}`,
      title: query.trim(),
      author: '',
      pages: null,
      coverId: null,
      subjects: [],
      genre: 'fiction',
    });

  useEffect(() => {
    abort.current?.abort();
    const mine = ++seq.current;
    if (query.trim().length < 2) {
      setHits([]);
      setFailed(false);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    setSearching(true);
    setFailed(false);
    const timer = window.setTimeout(() => {
      searchBooks(query, controller.signal)
        .then((results) => {
          if (mine !== seq.current) return;
          setHits(results);
          setFailed(false);
          setSearching(false);
        })
        .catch((e: unknown) => {
          if (mine !== seq.current) return;
          if (isAbortError(e)) return;
          setFailed(true);
          setSearching(false);
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <section>
      <h1 className="font-serif text-2xl mb-4">Add a book</h1>
      <input
        data-testid="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="title or author"
        className="w-full bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm"
      />

      {/*
        Open Library is 40M editions and still does not have everything. When it
        answers with nothing, or with the wrong things, the way out must be on
        screen — not hidden behind their API failing.
      */}
      {failed && !searching && <p className="mt-3 text-xs text-red-300">Open Library did not answer.</p>}

      {searching && <p className="mt-3 text-xs text-dust">searching…</p>}

      {query.trim().length >= 2 && !searching && (
        <p className="mt-3 text-xs text-dust">
          {hits.length === 0 ? 'Nothing found. ' : 'Not the book you meant? '}
          <button data-testid="manual-entry" className="text-lamp underline" onClick={byHand}>
            add “{query.trim()}” by hand
          </button>
        </p>
      )}

      {hits.length > 0 && (
        <ul data-testid="results" className="mt-3 grid gap-2">
          {hits.map((hit) => (
            <li key={hit.olWorkKey}>
              <button
                onClick={() => setPending(hit)}
                className="w-full text-left border border-oak/40 hover:border-lamp rounded p-2.5 flex gap-3 items-center"
              >
                {coverUrl(hit.coverId, 'S') ? (
                  <img src={coverUrl(hit.coverId, 'S')!} alt="" className="w-8 h-11 object-cover rounded-sm" />
                ) : (
                  <div className="w-8 h-11 rounded-sm bg-oak/40" />
                )}
                <span className="min-w-0">
                  <span className="block font-serif text-paper truncate">{hit.title}</span>
                  <span className="block text-xs text-dust truncate">
                    {hit.author} · {hit.pages ?? 'pages unknown'} · {hit.genre}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pending && <ConfirmAdd hit={pending} onClose={() => setPending(null)} onAdded={onAdded} />}
    </section>
  );
}

function ConfirmAdd({ hit, onClose, onAdded }: { hit: SearchHit; onClose: () => void; onAdded: () => void }) {
  const [title, setTitle] = useState(hit.title);
  const [author, setAuthor] = useState(hit.author);
  // Spine width is page count, so a missing number makes an ugly shelf: ask.
  const [pages, setPages] = useState(hit.pages?.toString() ?? '');
  const [genre, setGenre] = useState<Genre>(hit.genre);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await addBook(
        supabase,
        { olWorkKey: hit.olWorkKey, title, author, pages: pages === '' ? null : Number(pages), coverId: hit.coverId, subjects: hit.subjects },
        genre,
      );
      onAdded();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'could not shelve it');
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border border-lamp/50 rounded p-4 grid gap-3" data-testid="confirm-add">
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="add-title"
          className="bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm" placeholder="title" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} data-testid="add-author"
          className="bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm" placeholder="author" />
        <input value={pages} onChange={(e) => setPages(e.target.value)} data-testid="add-pages" inputMode="numeric"
          className="bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm" placeholder="pages" />
        <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)} data-testid="add-genre"
          className="bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm">
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => void save()} disabled={busy} data-testid="add-confirm"
          className="px-4 py-2 rounded bg-lamp text-ink text-xs uppercase tracking-widest disabled:opacity-50">
          {busy ? 'shelving…' : 'shelve it'}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded border border-oak text-xs uppercase tracking-widest text-dust">
          cancel
        </button>
      </div>
    </div>
  );
}
