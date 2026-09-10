import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth';
import { font, palette, shared, spacing } from '../src/theme';

type Mode = 'signIn' | 'signUp';

function Input(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[shared.input, focused && styles.inputFocused]}
      placeholderTextColor={palette.dust}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

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
      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        editable={!busy}
      />
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="password"
        secureTextEntry
        autoCapitalize="none"
        editable={!busy}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={({ pressed }) => [
          shared.primaryBtn,
          styles.button,
          busy && styles.buttonDisabled,
          pressed && !busy && styles.pressed,
        ]}
        onPress={submit}
        disabled={busy || !email.trim() || !password}
      >
        <Text style={shared.primaryBtnText}>
          {busy ? 'Working…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
        </Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.toggleWrap, pressed && styles.pressed]}
        onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        disabled={busy}
      >
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
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.gloom,
  },
  title: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.xl,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  inputFocused: {
    borderColor: palette.lamp,
  },
  button: {
    padding: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  toggleWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggle: {
    color: palette.lamp,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    textAlign: 'center',
  },
  error: {
    color: palette.danger,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  note: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    textAlign: 'center',
  },
});