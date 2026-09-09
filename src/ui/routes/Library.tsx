import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildWorldModel, type WorldModel } from '../../domain';
import { loadLibrary } from '../../data';
import { createWorld, fixtureModel } from '../../world';
import { useAuth } from '../auth';

/** Owns a canvas and nothing else. React never enters the render loop. */
export function Library() {
  const { session } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<WorldModel | null>(null);
  const [looking, setLooking] = useState('');
  const [error, setError] = useState<string | null>(null);

  // A signed-out visitor walks the demo library; a reader walks their own.
  useEffect(() => {
    let cancelled = false;
    if (!session) {
      setModel(fixtureModel());
      return () => { cancelled = true; };
    }
    loadLibrary()
      .then(({ books, userBooks, sessions }) => {
        if (!cancelled) setModel(buildWorldModel(userBooks, books, sessions, new Date()));
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !model) return;
    const lite = new URLSearchParams(window.location.search).has('lite');
    const world = createWorld(canvas, model, lite);
    const poll = window.setInterval(() => {
      const book = world.lookedAt();
      setLooking(book ? `${book.title} - ${book.author} \u00b7 ${book.pages}pp` : '');
    }, 150);
    return () => {
      window.clearInterval(poll);
      world.dispose();
    };
  }, [model]);

  const empty = model !== null && model.rooms.length === 0 && model.reading.length === 0;

  return (
    <div className="fixed inset-0 bg-gloom">
      <canvas ref={canvasRef} className="w-full h-full block" data-testid="world-canvas" />

      {!model && !error && (
        <p className="absolute inset-0 grid place-items-center text-dust text-sm">shelving your books...</p>
      )}
      {error && <p className="absolute inset-0 grid place-items-center text-red-300 text-sm">{error}</p>}

      {empty && (
        <div className="absolute inset-x-0 bottom-24 text-center px-6">
          <p className="text-dust text-sm">
            Every arch is bricked up, because you have not read anything here yet.{' '}
            <Link to="/books" className="text-lamp hover:underline">Shelve your first book.</Link>
          </p>
        </div>
      )}

      <p className="absolute top-4 inset-x-0 text-center text-[11px] tracking-[0.2em] text-dust pointer-events-none">
        click to walk &middot; WASD + mouse &middot; shift to hurry &middot; esc to release
      </p>
      <p data-testid="looking-at" className="absolute bottom-4 right-4 text-xs text-lamp pointer-events-none">{looking}</p>
      <Link to={session ? '/dashboard' : '/'} className="absolute bottom-4 left-4 text-[11px] tracking-widest text-dust hover:text-lamp">
        &larr; leave
      </Link>
    </div>
  );
}
