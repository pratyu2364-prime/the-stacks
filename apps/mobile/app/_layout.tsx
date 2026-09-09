import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/auth';
import { outbox } from '../src/db';

function Gate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/sign-in" />;

  return <Stack />;
}

export default function RootLayout() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void outbox.flush();
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}