import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.35em] text-dust mb-6">a reading habit, made of rooms</p>
      <h1 className="font-serif text-5xl sm:text-6xl text-paper mb-6">The Stacks</h1>
      <p className="max-w-xl text-sm sm:text-base leading-relaxed text-dust mb-10">
        Log what you read and what you thought while reading it. Every book you finish
        stands on a shelf, with its title on the spine, in the room for its subject.
        An empty shelf is an honest report on your month.
      </p>
      <div className="flex gap-3">
        <Link
          to="/signup"
          className="px-5 py-2.5 rounded bg-lamp text-ink text-xs uppercase tracking-widest hover:brightness-110"
        >
          start a library
        </Link>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded border border-oak text-paper text-xs uppercase tracking-widest hover:bg-oak/30"
        >
          sign in
        </Link>
      </div>
      <Link to="/library" className="mt-12 text-[11px] uppercase tracking-widest text-dust hover:text-lamp">
        walk the demo library →
      </Link>
    </main>
  );
}
