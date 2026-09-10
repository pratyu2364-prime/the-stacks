import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLibrary } from '../../src/library';
import { Cover } from '../../src/Cover';
import { font, palette, shared, spacing } from '../../src/theme';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, userBooks, sessions, loading, reload, removeBook } = useLibrary();
  const fade = useRef(new Animated.Value(0)).current;

  // The log sheet writes through its own copy of the library, so this screen
  // refetches on focus to show the sitting that was just logged.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
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
          <View style={styles.sessionRow}>
            <Text style={styles.sessionDate}>{item.readOn}</Text>
            <Text style={styles.sessionDetail}>
              {[item.pageStart != null && item.pageEnd != null ? `${item.pageStart}–${item.pageEnd}` : null, item.minutes != null ? `${item.minutes} min` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
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
  emptyText: {
    color: palette.dust,
    fontFamily: font.family.mono,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});