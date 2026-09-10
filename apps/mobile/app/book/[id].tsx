import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLibrary } from '../../src/library';
import { Cover } from '../../src/Cover';
import { font, palette, shared, spacing } from '../../src/theme';
import type { Session } from '@stacks/domain';
import type { SessionPatch } from '@stacks/data';

function asNumber(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function SittingRow({
  session,
  onSaved,
  onDelete,
  onEdit,
  pending,
}: {
  session: Session;
  onSaved: () => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, patch: SessionPatch) => Promise<void>;
  pending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [readOn, setReadOn] = useState(session.readOn);
  const [pageStart, setPageStart] = useState(session.pageStart != null ? String(session.pageStart) : '');
  const [pageEnd, setPageEnd] = useState(session.pageEnd != null ? String(session.pageEnd) : '');
  const [minutes, setMinutes] = useState(session.minutes != null ? String(session.minutes) : '');
  const [mood, setMood] = useState(session.mood ?? '');
  const [note, setNote] = useState(session.note ?? '');

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const patch: SessionPatch = {
        readOn,
        pageStart: asNumber(pageStart),
        pageEnd: asNumber(pageEnd),
        minutes: asNumber(minutes),
        mood: mood.trim() || null,
        note: note.trim() || null,
      };
      await onEdit(session.id, patch);
      setExpanded(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete sitting', 'Are you sure you want to delete this sitting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(session.id),
      },
    ]);
  }

  if (expanded) {
    return (
      <View style={styles.editContainer}>
        <Text style={shared.label}>Date</Text>
        <TextInput value={readOn} onChangeText={setReadOn} style={shared.input} placeholderTextColor={palette.dust} />
        <View style={styles.editRow}>
          <View style={styles.editField}>
            <Text style={shared.label}>From</Text>
            <TextInput value={pageStart} onChangeText={setPageStart} keyboardType="number-pad" style={shared.input} placeholderTextColor={palette.dust} placeholder="p." />
          </View>
          <View style={styles.editField}>
            <Text style={shared.label}>To</Text>
            <TextInput value={pageEnd} onChangeText={setPageEnd} keyboardType="number-pad" style={shared.input} placeholderTextColor={palette.dust} placeholder="p." />
          </View>
        </View>
        <View style={styles.editRow}>
          <View style={styles.editField}>
            <Text style={shared.label}>Minutes</Text>
            <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" style={shared.input} placeholderTextColor={palette.dust} />
          </View>
          <View style={styles.editField}>
            <Text style={shared.label}>Mood</Text>
            <TextInput value={mood} onChangeText={setMood} style={shared.input} placeholderTextColor={palette.dust} />
          </View>
        </View>
        <Text style={shared.label}>Note</Text>
        <TextInput value={note} onChangeText={setNote} multiline style={[shared.input, styles.noteInput]} placeholderTextColor={palette.dust} placeholder="What did you think?" />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.editActions}>
          <Pressable
            style={({ pressed }) => [shared.primaryBtn, pressed && styles.pressed, busy && styles.disabled]}
            onPress={() => void save()}
            disabled={busy}
          >
            <Text style={shared.primaryBtnText}>{busy ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [shared.secondaryBtn, pressed && styles.pressed]}
            onPress={() => setExpanded(false)}
            disabled={busy}
          >
            <Text style={shared.secondaryBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (pending) {
    return (
      <View style={styles.sessionRow}>
        <Text style={styles.sessionDate}>{session.readOn}</Text>
        <Text style={styles.sessionDetail}>
          {[session.pageStart != null && session.pageEnd != null ? `${session.pageStart}–${session.pageEnd}` : null, session.minutes != null ? `${session.minutes} min` : null, session.mood]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {session.note && <Text style={styles.sessionNote} numberOfLines={2}>{session.note}</Text>}
        <Text style={styles.pendingHint}>not synced yet</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.sessionRow, pressed && styles.pressed]}
      onPress={() => setExpanded(true)}
      onLongPress={confirmDelete}
    >
      <Text style={styles.sessionDate}>{session.readOn}</Text>
      <Text style={styles.sessionDetail}>
        {[session.pageStart != null && session.pageEnd != null ? `${session.pageStart}–${session.pageEnd}` : null, session.minutes != null ? `${session.minutes} min` : null, session.mood]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      {session.note && <Text style={styles.sessionNote} numberOfLines={2}>{session.note}</Text>}
      <Text style={styles.hint}>tap to edit · hold to delete</Text>
    </Pressable>
  );
}

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, userBooks, sessions, pendingIds, loading, reload, removeBook, deleteSession, editSession } = useLibrary();
  const fade = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const [, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    if (loading) return;
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [loading, fade]);

  const userBook = userBooks.find((ub) => ub.id === id);
  const book = userBook ? books.find((b) => b.id === userBook.bookId) : undefined;

  const bookSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.userBookId === id)
        .sort((a, b) => b.readOn.localeCompare(a.readOn)),
    [sessions, id],
  );

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteSession(sessionId);
    } catch (e) {
      Alert.alert('Could not delete', e instanceof Error ? e.message : 'Unknown error');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.lamp} />
      </View>
    );
  }

  if (!userBook) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Book' }} />
        <Text style={styles.emptyText}>This book is not on your shelves.</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Stack.Screen options={{ title: book?.title ?? 'Book' }} />
      <FlatList
        data={bookSessions}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Cover coverId={book?.coverId ?? null} title={book?.title ?? '?'} size="M" />
              <View style={styles.headerText}>
                <Text style={styles.title}>{book?.title ?? 'Unknown title'}</Text>
                <Text style={styles.author}>{book?.author ?? 'Unknown author'}</Text>
              </View>
            </View>
            <Text style={styles.status}>{userBook.status}</Text>
            <Pressable
              style={({ pressed }) => [shared.primaryBtn, styles.logButton, pressed && styles.pressed]}
              onPress={() => router.push(`/log?userBookId=${userBook.id}`)}
            >
              <Text style={shared.primaryBtnText}>Log a session</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [shared.destructiveBtn, styles.removeButton, pressed && styles.pressed]}
              onPress={() => {
                const name = book?.title ?? 'This book';
                const sittingCount = bookSessions.length;
                const message =
                  sittingCount > 0
                    ? `Remove "${name}"? This also deletes the ${sittingCount} sitting${sittingCount === 1 ? '' : 's'} you logged for it.`
                    : `Remove "${name}" from your shelves?`;
                Alert.alert('Remove book', message, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                      removeBook(userBook.id)
                        .then(() => router.replace('/'))
                        .catch((e: Error) => Alert.alert('Could not remove it', e.message));
                    },
                  },
                ]);
              }}
            >
              <Text style={shared.destructiveBtnText}>Remove</Text>
            </Pressable>
            <Text style={styles.sectionHeader}>Sessions</Text>
          </View>
        }
        renderItem={({ item }) => (
          <SittingRow session={item} onSaved={refresh} onDelete={handleDeleteSession} onEdit={editSession} pending={pendingIds.has(item.id)} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No sessions for this book yet.</Text>}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.gloom,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: palette.gloom,
  },
  header: {
    padding: spacing.lg,
  },
  headerTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.xl,
    fontWeight: '600',
  },
  author: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.md,
    marginTop: spacing.xs,
  },
  status: {
    alignSelf: 'flex-start',
    color: palette.lamp,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: spacing.md,
    textTransform: 'uppercase',
  },
  logButton: {
    marginTop: spacing.lg,
  },
  removeButton: {
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sectionHeader: {
    ...shared.sectionHeader,
    borderTopColor: palette.oak,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  sessionRow: {
    borderBottomColor: palette.oak,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sessionDate: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.md,
    fontWeight: '600',
  },
  sessionDetail: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    marginTop: spacing.xs,
  },
  sessionNote: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.sm,
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  hint: {
    color: palette.oak,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    marginTop: spacing.xs,
  },
  pendingHint: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  emptyText: {
    color: palette.dust,
    fontFamily: font.family.mono,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  editContainer: {
    borderBottomColor: palette.oak,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  editRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editField: {
    flex: 1,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: {
    color: palette.danger,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});
