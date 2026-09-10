import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './auth';

jest.mock('./supabase', () => {
  const listeners: Array<(e: string, s: unknown) => void> = [];
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithPassword: jest.fn(async () => ({ error: null })),
      },
    },
  };
});

function Probe() {
  const { session, loading } = useAuth();
  return <Text>{loading ? 'loading' : session ? 'signed-in' : 'signed-out'}</Text>;
}

it('starts loading and settles to signed-out with no stored session', async () => {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
});