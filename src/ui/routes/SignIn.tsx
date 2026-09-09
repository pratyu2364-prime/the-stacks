import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function SignIn({ mode }: { mode: 'in' | 'up' }) {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={location.state?.from ?? '/dashboard'} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'in') await signIn(email, password);
      else await signUp(email, password);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'that did not work');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm border border-oak/50 rounded-lg p-8 bg-black/30">
        <h1 className="font-serif text-2xl mb-6">{mode === 'in' ? 'Sign in' : 'Start a library'}</h1>
        <label className="block text-[11px] uppercase tracking-widest text-dust mb-1">email</label>
        <input
          data-testid="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm"
        />
        <label className="block text-[11px] uppercase tracking-widest text-dust mb-1">password</label>
        <input
          data-testid="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 bg-black/40 border border-oak/60 rounded px-3 py-2 text-sm"
        />
        {error && <p data-testid="auth-error" className="text-sm text-red-300 mb-4">{error}</p>}
        <button
          data-testid="submit"
          disabled={busy}
          className="w-full py-2.5 rounded bg-lamp text-ink text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {busy ? 'opening…' : mode === 'in' ? 'sign in' : 'create account'}
        </button>
        <p className="mt-5 text-center text-xs text-dust">
          {mode === 'in' ? (
            <Link to="/signup" className="hover:text-lamp">no library yet?</Link>
          ) : (
            <Link to="/login" className="hover:text-lamp">already have one?</Link>
          )}
        </p>
      </form>
    </main>
  );
}
