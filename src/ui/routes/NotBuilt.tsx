import { Link } from 'react-router-dom';

export function NotBuilt({ title, task }: { title: string; task: string }) {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md border border-oak/60 rounded-lg p-8 text-center bg-black/30">
        <h1 className="font-serif text-2xl text-paper mb-2">{title}</h1>
        <p className="text-dust text-sm leading-relaxed">
          Not built yet. Lands in task <span className="text-lamp">{task}</span>.
        </p>
        <Link to="/" className="inline-block mt-6 text-xs uppercase tracking-widest text-lamp hover:underline">
          back to the door
        </Link>
      </div>
    </main>
  );
}
