import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BookStatus, UserBook } from '@stacks/domain';
import { useLibrary } from '../src/library';
import { Cover } from '../src/Cover';
import { font, palette, shared, spacing } from '../src/theme';

const STATUS_ORDER: BookStatus[] = ['reading', 'want', 'finished', 'abandoned'];

type ShelfSection = { title: string; data: UserBook[] };

export default function ShelfScreen() {
  const { books, userBooks, streak, pendingIds, loading, error, reload } = useLibrary();
  const fade = useRef(new Animated.Value(0)).current;

  // Shelving a book or logging a sitting happens on another screen holding its
  // own copy of the library, so this one refetches whenever it comes back into
  // view rather than showing a shelf that is quietly out of date.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    if (loading) return;
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [loading, fade]);

  const sections = useMemo<ShelfSection[]>(
    () =>
      STATUS_ORDER.map((status) => ({
        title: status,
        data: userBooks.filter((ub) => ub.status === status),
      })).filter((s) => s.data.length > 0),
    [userBooks],
  );

  const titleFor = (ub: UserBook) => books.find((b) => b.id === ub.bookId)?.title ?? 'Unknown title';
  const authorFor = (ub: UserBook) =>
    books.find((b) => b.id === ub.bookId)?.author ?? 'Unknown author';

  if (error) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'The Stacks' }} />
        <Text style={styles.emptyTitle}>Could not load your library</Text>
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable
          style={({ pressed }) => [shared.primaryBtn, pressed && styles.pressed]}
          onPress={() => void reload()}
        >
          <Text style={shared.primaryBtnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!loading && userBooks.length === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'The Stacks' }} />
        <Text style={styles.streakHero}>
          {streak} day{streak === 1 ? '' : 's'}
        </Text>
        <Text style={styles.streakCaption}>reading streak</Text>
        <Text style={styles.emptyTitle}>Your shelves are empty</Text>
        <Text style={styles.emptyText}>
          Add a book from the Open Library and your stacks will grow here.
        </Text>
        <Pressable
          style={({ pressed }) => [shared.primaryBtn, pressed && styles.pressed]}
          onPress={() => router.push('/add')}
        >
          <Text style={shared.primaryBtnText}>Add a book</Text>
        </Pressable>
        <Pressable style={({ pressed }) => pressed && styles.pressed} onPress={() => router.push('/settings')}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Stack.Screen options={{ title: 'The Stacks' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.streakHero}>
              {streak} day{streak === 1 ? '' : 's'}
            </Text>
            <Text style={styles.streakCaption}>reading streak</Text>
            {pendingIds.size > 0 && (
              <Text style={styles.pendingText}>
                {pendingIds.size} sitting{pendingIds.size === 1 ? '' : 's'} waiting to sync
              </Text>
            )}
            <View style={styles.headerRow}>
              <Pressable
                style={({ pressed }) => [shared.primaryBtn, pressed && styles.pressed]}
                onPress={() => router.push('/add')}
              >
                <Text style={shared.primaryBtnText}>Add a book</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [shared.secondaryBtn, pressed && styles.pressed]}
                onPress={() => router.push('/settings')}
              >
                <Text style={shared.secondaryBtnText}>Settings</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/book/${item.id}`)}
          >
            <Cover coverId={books.find((b) => b.id === item.bookId)?.coverId ?? null} title={titleFor(item)} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {titleFor(item)}
              </Text>
              <Text style={styles.rowAuthor} numberOfLines={1}>
                {authorFor(item)}
              </Text>
            </View>
          </Pressable>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={palette.lamp} />
            </View>
          ) : (
            <Text style={styles.emptyText}>The shelves are empty.</Text>
          )
        }
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  streakHero: {
    color: palette.lamp,
    fontFamily: font.family.serif,
    fontSize: font.size.hero,
    fontWeight: '600',
  },
  streakCaption: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pendingText: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.xs,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  emptyTitle: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: palette.dust,
    fontFamily: font.family.mono,
    textAlign: 'center',
  },
  link: {
    color: palette.lamp,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  rowPressed: {
    backgroundColor: palette.ink,
    transform: [{ scale: 0.99 }],
  },
  sectionHeader: {
    ...shared.sectionHeader,
    borderTopColor: palette.oak,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: palette.oak,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.lg,
    fontWeight: '600',
  },
  rowAuthor: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    marginTop: spacing.xs,
  },
});