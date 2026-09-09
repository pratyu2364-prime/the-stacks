import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth';
import { DEFAULT_NUDGE_TIME, readNudgeTime, writeNudgeTime, type NudgeTime } from '../src/nudgeTime';
import { supabase } from '../src/supabase';

const asInt = (value: string): number | null => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [hour, setHour] = useState(String(DEFAULT_NUDGE_TIME.hour));
  const [minute, setMinute] = useState(String(DEFAULT_NUDGE_TIME.minute).padStart(2, '0'));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    readNudgeTime().then((time) => {
      if (!active) return;
      setHour(String(time.hour));
      setMinute(String(time.minute).padStart(2, '0'));
    });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setError(null);
    setMessage(null);
    const hourValue = asInt(hour);
    const minuteValue = asInt(minute);
    if (
      hourValue === null ||
      minuteValue === null ||
      hourValue < 0 ||
      hourValue > 23 ||
      minuteValue < 0 ||
      minuteValue > 59
    ) {
      setError('Time must be between 00:00 and 23:59.');
      return;
    }
    setBusy(true);
    const time: NudgeTime = { hour: hourValue, minute: minuteValue };
    await writeNudgeTime(time);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setMessage('Nudge scheduled for daily at the time you set.');
    } else {
      setMessage(
        'Nudge time saved, but notifications are off. Enable them in your device settings to be nudged.',
      );
    }
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Text style={styles.section}>Daily nudge</Text>
      <View style={styles.timeRow}>
        <View style={styles.field}>
          <Text style={styles.label}>Hour (0–23)</Text>
          <TextInput
            style={styles.input}
            value={hour}
            onChangeText={setHour}
            keyboardType="number-pad"
            placeholder="20"
            editable={!busy}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Minute (0–59)</Text>
          <TextInput
            style={styles.input}
            value={minute}
            onChangeText={setMinute}
            keyboardType="number-pad"
            placeholder="00"
            editable={!busy}
          />
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={save}
        disabled={busy}
      >
        <Text style={styles.buttonText}>Save nudge time</Text>
      </Pressable>
      <Text style={styles.note}>
        You get one nudge a day, and only on days you have not logged a session yet.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.section}>Account</Text>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={() => void signOut()}
        disabled={busy}
      >
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
      <Pressable
        style={[styles.dangerButton, busy && styles.buttonDisabled]}
        onPress={() => {
          Alert.alert(
            'Delete account?',
            'This will permanently delete your account, all your shelved books, and every logged reading session. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  setBusy(true);
                  setError(null);
                  setMessage(null);
                  try {
                    const { error: fnError } = await supabase.functions.invoke('delete-account', {
                      method: 'DELETE',
                    });
                    if (fnError) throw new Error(fnError.message);
                    await signOut();
                  } catch (e: unknown) {
                    setBusy(false);
                    setError(e instanceof Error ? e.message : 'Deletion failed.');
                  }
                },
              },
            ],
          );
        }}
        disabled={busy}
      >
        <Text style={styles.dangerButtonText}>Delete my account</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    gap: 12,
    padding: 16,
  },
  section: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
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
  dangerButton: {
    alignItems: 'center',
    borderColor: '#dc2626',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  dangerButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
  },
  message: {
    color: '#475569',
  },
  note: {
    color: '#64748b',
  },
  divider: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    marginVertical: 8,
  },
});