import * as Crypto from 'expo-crypto';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { dayKey } from '@stacks/domain';
import { outbox } from '../src/db';

const asNumber = (value: string): number | null => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

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
          <View style={styles.field}>
            <Text style={styles.label}>Pages from</Text>
            <TextInput
              style={styles.input}
              value={pageStart}
              onChangeText={setPageStart}
              keyboardType="number-pad"
              placeholder="1"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Pages to</Text>
            <TextInput
              style={styles.input}
              value={pageEnd}
              onChangeText={setPageEnd}
              keyboardType="number-pad"
              placeholder="20"
            />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Minutes</Text>
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            placeholder="30"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Mood</Text>
          <TextInput style={styles.input} value={mood} onChangeText={setMood} placeholder="focused" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="What did you think?"
            multiline
          />
        </View>
        <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={save} disabled={busy}>
          <Text style={styles.buttonText}>Save session</Text>
        </Pressable>
        <Text style={styles.note}>Saved locally first — it syncs when you are back online.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    gap: 12,
    padding: 16,
  },
  row: {
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
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginTop: 8,
    padding: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  note: {
    color: '#64748b',
    textAlign: 'center',
  },
});