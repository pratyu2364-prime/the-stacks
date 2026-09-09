import { Link, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth';

const link = ({ isActive }: { isActive: boolean }) =>
  `text-[11px] uppercase tracking-widest ${isActive ? 'text-lamp' : 'text-dust hover:text-paper'}`;

export function Shell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-oak/40 px-5 py-3 flex items-center gap-6">
        <Link to="/dashboard" className="font-serif text-paper text-lg">The Stacks</Link>
        <nav className="flex gap-5">
          <NavLink to="/dashboard" className={link}>desk</NavLink>
          <NavLink to="/books" className={link}>books</NavLink>
          <NavLink to="/library" className={link}>library</NavLink>
        </nav>
        <button onClick={() => void signOut()} className="ml-auto text-[11px] uppercase tracking-widest text-dust hover:text-paper">
          sign out
        </button>
      </header>
      <main className="px-5 py-8 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
