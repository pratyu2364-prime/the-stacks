import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthValue = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    /**
     * Reading the stored session has hung on this platform before, and a hang
     * never reaches a catch. Eight seconds is far longer than a keystore read
     * should take, and losing the race means the reader signs in again — which
     * is a screen, not a void.
     */
    const withTimeout = <T,>(work: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        work,
        new Promise<T>((_resolve, reject) =>
          setTimeout(() => reject(new Error('timed out reading the stored session')), ms),
        ),
      ]);

    withTimeout(supabase.auth.getSession(), 8000)
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
      })
      // A session that cannot be read is a reader who signs in again. Leaving
      // `loading` true instead would strand the app on a blank screen with a
      // spinner and no way to say what went wrong.
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Could not read the stored session');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      error,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
      },
      async signUp(email, password) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, loading, error],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useAuth outside AuthProvider');
  return value;
}