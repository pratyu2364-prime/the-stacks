import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  booksFinishedByMonth,
  currentStreak,
  dayKey,
  minutesInRange,
  pagesInRange,
  type Book,
  type Session,
  type UserBook,
} from '@stacks/domain';
import { loadLibrary } from '../../data';
import { Shell } from '../components/Shell';
import { MonthBars } from '../components/MonthBars';

export function Dashboard() {
  const [data, setData] = useState<{ books: Book[]; userBooks: UserBook[]; sessions: Session[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 6 * 86_400_000);
    const from = dayKey(weekAgo);
    const to = dayKey(today);
    return {
      streak: currentStreak(data.sessions, today),
      pages: pagesInRange(data.sessions, from, to),
      minutes: minutesInRange(data.sessions, from, to),
      months: booksFinishedByMonth(data.userBooks),
      reading: data.userBooks.filter((u) => u.status === 'reading'),
    };
  }, [data]);

  if (error) return <Shell><p className="text-red-300 text-sm">{error}</p></Shell>;
  if (!data || !stats) return <Shell><p className="text-dust text-sm">counting…</p></Shell>;

  const titleOf = (userBook: UserBook) => data.books.find((b) => b.id === userBook.bookId)?.title ?? 'a book';
  const recent = [...data.sessions].sort((a, b) => b.readOn.localeCompare(a.readOn)).slice(0, 6);

  return (
    <Shell>
      <div className="grid sm:grid-cols-3 gap-3 mb-10">
        <Stat label="streak" value={stats.streak} unit={stats.streak === 1 ? 'day' : 'days'} lit={stats.streak > 0} testId="streak" />
        <Stat label="pages this week" value={stats.pages} unit="pp" testId="pages" />
        <Stat label="time this week" value={stats.minutes} unit="min" testId="minutes" />
      </div>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-3">On the desk</h2>
        {stats.reading.length === 0 ? (
          <p className="text-dust text-sm">
            Nothing open. <Link to="/books" className="text-lamp hover:underline">Shelve what you are reading.</Link>
          </p>
        ) : (
          <ul className="grid gap-2" data-testid="reading-now">
            {stats.reading.map((userBook) => (
              <li key={userBook.id}>
                <Link to={`/books/${userBook.id}`} className="block border border-oak/40 hover:border-lamp rounded px-3 py-2">
                  <span className="font-serif text-paper">{titleOf(userBook)}</span>
                  <span className="text-xs text-dust ml-2">log a sitting →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-3">Books finished</h2>
        <MonthBars months={stats.months} />
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Lately</h2>
        {recent.length === 0 && <p className="text-dust text-sm">No sittings yet.</p>}
        <ol className="grid gap-2">
          {recent.map((s) => {
            const owner = data.userBooks.find((u) => u.id === s.userBookId);
            return (
              <li key={s.id} className="border-l-2 border-oak/60 pl-3 py-1">
                <p className="text-[11px] uppercase tracking-widest text-dust">
                  {s.readOn} · {owner ? titleOf(owner) : 'a book'}
                  {s.pageStart != null && s.pageEnd != null && ` · pp ${s.pageStart}–${s.pageEnd}`}
                </p>
                {s.note && <p className="text-sm font-serif text-paper/90 truncate">{s.note}</p>}
              </li>
            );
          })}
        </ol>
      </section>
    </Shell>
  );
}

function Stat({ label, value, unit, lit, testId }: { label: string; value: number; unit: string; lit?: boolean; testId: string }) {
  return (
    <div className={`border rounded p-4 ${lit ? 'border-lamp/70 bg-lamp/5' : 'border-oak/40'}`}>
      <p className="text-[11px] uppercase tracking-widest text-dust">{label}</p>
      <p className="mt-1">
        <span data-testid={testId} className={`text-3xl font-mono ${lit ? 'text-lamp' : 'text-paper'}`}>{value}</span>
        <span className="text-dust text-sm ml-1.5">{unit}</span>
      </p>
    </div>
  );
}
