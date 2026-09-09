import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createWorld, fixtureModel } from '../../world';

/** Owns a canvas and nothing else. React never enters the render loop. */
export function Library() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [looking, setLooking] = useState<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lite = new URLSearchParams(window.location.search).has('lite');
    const world = createWorld(canvas, fixtureModel(), lite);
    setReady(true);
    const poll = window.setInterval(() => {
      const book = world.lookedAt();
      setLooking(book ? `${book.title} — ${book.author} · ${book.pages}pp` : '');
    }, 150);
    return () => {
      window.clearInterval(poll);
      world.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gloom">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {!ready && <p className="absolute inset-0 grid place-items-center text-dust text-sm">shelving your books…</p>}
      <p className="absolute top-4 inset-x-0 text-center text-[11px] tracking-[0.2em] text-dust pointer-events-none">
        click to walk · WASD + mouse · shift to hurry · esc to release
      </p>
      <p className="absolute bottom-4 right-4 text-xs text-lamp pointer-events-none">{looking}</p>
      <Link to="/" className="absolute bottom-4 left-4 text-[11px] tracking-widest text-dust hover:text-lamp">
        ← leave
      </Link>
    </div>
  );
}
