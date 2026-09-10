import * as Crypto from 'expo-crypto';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { dayKey } from '@stacks/domain';
import { outbox } from '../src/db';
import { font, palette, shared, spacing } from '../src/theme';

const asNumber = (value: string): number | null => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

function Field({
  label,
  style,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={shared.label}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[shared.input, focused && styles.inputFocused, style]}
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

export default function LogScreen() {
  const { userBookId } = useLocalSearchParams<{ userBookId: string }>();
  const [pageStart, setPageStart] = useState('');
  const [pageEnd, setPageEnd] = useState('');
  const [minutes, setMinutes] = useState('');
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    await outbox.enqueue({
      id: Crypto.randomUUID(),
      userBookId,
      readOn: dayKey(new Date()),
      pageStart: asNumber(pageStart),
      pageEnd: asNumber(pageEnd),
      minutes: asNumber(minutes),
      mood: mood.trim() || null,
      note: note.trim() || null,
    });
    void outbox.flush();
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Log a session' }} />
      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.row}>
          <Field
            label="Pages from"
            value={pageStart}
            onChangeText={setPageStart}
            keyboardType="number-pad"
            placeholder="1"
          />
          <Field
            label="Pages to"
            value={pageEnd}
            onChangeText={setPageEnd}
            keyboardType="number-pad"
            placeholder="20"
          />
        </View>
        <Field
          label="Minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
          placeholder="30"
        />
        <Field label="Mood" value={mood} onChangeText={setMood} placeholder="focused" />
        <Field
          label="Note"
          value={note}
          onChangeText={setNote}
          placeholder="What did you think?"
          multiline
          style={[styles.noteInput]}
        />
        <Pressable
          style={({ pressed }) => [
            shared.primaryBtn,
            styles.button,
            busy && styles.buttonDisabled,
            pressed && !busy && styles.pressed,
          ]}
          onPress={save}
          disabled={busy}
        >
          <Text style={shared.primaryBtnText}>Save session</Text>
        </Pressable>
        <Text style={styles.note}>Saved locally first — it syncs when you are back online.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.gloom,
  },
  form: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  row: {
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
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  note: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    textAlign: 'center',
  },
});