import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth';
import { DEFAULT_NUDGE_TIME, readNudgeTime, writeNudgeTime, type NudgeTime } from '../src/nudgeTime';
import { supabase } from '../src/supabase';
import { font, palette, shared, spacing } from '../src/theme';

const asInt = (value: string): number | null => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

function TimeField({
  label,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={shared.label}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[shared.input, focused && styles.inputFocused]}
        placeholderTextColor={palette.dust}
        onFocus={(e) => {
          setFocused(true);
          inputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          inputProps.onBlur?.(e);
        }}
      />
    </View>
  );
}

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
        <TimeField
          label="Hour (0–23)"
          value={hour}
          onChangeText={setHour}
          keyboardType="number-pad"
          placeholder="20"
          editable={!busy}
        />
        <TimeField
          label="Minute (0–59)"
          value={minute}
          onChangeText={setMinute}
          keyboardType="number-pad"
          placeholder="00"
          editable={!busy}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable
        style={({ pressed }) => [
          shared.primaryBtn,
          busy && styles.buttonDisabled,
          pressed && !busy && styles.pressed,
        ]}
        onPress={save}
        disabled={busy}
      >
        <Text style={shared.primaryBtnText}>Save nudge time</Text>
      </Pressable>
      <Text style={styles.note}>
        You get one nudge a day, and only on days you have not logged a session yet.
      </Text>

      <View style={styles.divider} />

      <Text style={styles.section}>Account</Text>
      <Pressable
        style={({ pressed }) => [
          shared.secondaryBtn,
          busy && styles.buttonDisabled,
          pressed && !busy && styles.pressed,
        ]}
        onPress={() => void signOut()}
        disabled={busy}
      >
        <Text style={shared.secondaryBtnText}>Sign out</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          shared.destructiveBtn,
          busy && styles.buttonDisabled,
          pressed && !busy && styles.pressed,
        ]}
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
        <Text style={shared.destructiveBtnText}>Delete my account</Text>
      </Pressable>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.gloom,
    gap: spacing.md,
    padding: spacing.lg,
  },
  section: {
    ...shared.sectionHeader,
    borderTopColor: palette.oak,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.xs,
  },
  inputFocused: {
    borderColor: palette.lamp,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  errorText: {
    color: palette.danger,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  message: {
    color: palette.paper,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  note: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  divider: {
    borderBottomColor: palette.oak,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
});