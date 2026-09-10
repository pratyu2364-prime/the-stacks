import { router, Stack, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { loadLibrary } from '@stacks/data';
import type { Session, UserBook } from '@stacks/domain';
import { AuthProvider, useAuth } from '../src/auth';
import { outbox } from '../src/db';
import { syncNudge } from '../src/nudge';
import { readNudgeTime } from '../src/nudgeTime';
import { supabase } from '../src/supabase';

function mostRecentlyReadReadingBook(userBooks: UserBook[], sessions: Session[]): string | null {
  const reading = userBooks.filter((ub) => ub.status === 'reading');
  if (reading.length === 0) return null;
  let bestId: string | null = null;
  let bestOn = '';
  for (const ub of reading) {
    const latest = sessions
      .filter((s) => s.userBookId === ub.id)
      .sort((a, b) => b.readOn.localeCompare(a.readOn))[0]?.readOn;
    if (latest && latest >= bestOn) {
      bestId = ub.id;
      bestOn = latest;
    }
  }
  return bestId;
}

function Gate() {
  const { session, loading } = useAuth();
  const signedIn = session != null;
  const segments = useSegments();

  useEffect(() => {
    if (!signedIn) return;

    const onActive = async () => {
      void outbox.flush();
      try {
        const [lib, time] = await Promise.all([loadLibrary(supabase), readNudgeTime()]);
        await syncNudge(lib.sessions, new Date(), time);
      } catch {
        // The nudge is a nicety, never worth failing the foreground cycle for.
      }
    };

    const onResponse = async () => {
      try {
        const lib = await loadLibrary(supabase);
        const userBookId = mostRecentlyReadReadingBook(lib.userBooks, lib.sessions);
        if (userBookId) router.push(`/log?userBookId=${userBookId}`);
        else router.replace('/');
      } catch {
        router.replace('/');
      }
    };

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void onActive();
    });
    const notifSub = Notifications.addNotificationResponseReceivedListener(() => {
      void onResponse();
    });

    return () => {
      appStateSub.remove();
      notifSub.remove();
    };
  }, [signedIn]);

  /**
   * The navigator is rendered on every path, including while the stored session
   * is still being read. Returning a redirect or a bare spinner instead leaves
   * expo-router with no mounted root to navigate within, which is a grey screen
   * and a stuttering spinner rather than an error.
   */
  const onSignIn = segments[0] === 'sign-in';

  useEffect(() => {
    if (loading) return;
    if (!signedIn && !onSignIn) router.replace('/sign-in');
    if (signedIn && onSignIn) router.replace('/');
  }, [loading, signedIn, onSignIn]);

  return (
    <View style={{ flex: 1 }}>
      <Stack />
      {loading ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#faf7f2',
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}