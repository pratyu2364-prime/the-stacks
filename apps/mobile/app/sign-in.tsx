import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth';

type Mode = 'signIn' | 'signUp';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signIn') await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'The Stacks' }} />
      <Text style={styles.title}>{mode === 'signIn' ? 'Sign in' : 'Create an account'}</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        editable={!busy}
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="password"
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={submit}
        disabled={busy || !email.trim() || !password}
      >
        <Text style={styles.buttonText}>
          {busy ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
        </Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} disabled={busy}>
        <Text style={styles.toggle}>
          {mode === 'signIn'
            ? 'No account yet? Sign up instead'
            : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
      <Text style={styles.note}>Password resets happen on the website.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  toggle: {
    color: '#2563eb',
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
  },
  note: {
    color: '#64748b',
    textAlign: 'center',
  },
});