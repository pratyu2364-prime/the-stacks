import { router, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { BookStatus, UserBook } from '@stacks/domain';
import { useLibrary } from '../src/library';

const STATUS_ORDER: BookStatus[] = ['reading', 'want', 'finished', 'abandoned'];

type ShelfSection = { title: string; data: UserBook[] };

export default function ShelfScreen() {
  const { books, userBooks, streak, loading, error, reload } = useLibrary();

  const sections = useMemo<ShelfSection[]>(
    () =>
      STATUS_ORDER.map((status) => ({
        title: status,
        data: userBooks.filter((ub) => ub.status === status),
      })).filter((s) => s.data.length > 0),
    [userBooks],
  );

  const titleFor = (ub: UserBook) => books.find((b) => b.id === ub.bookId)?.title ?? 'Unknown title';
  const authorFor = (ub: UserBook) => books.find((b) => b.id === ub.bookId)?.author ?? 'Unknown author';

  if (error) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'The Stacks' }} />
        <Text style={styles.emptyTitle}>Could not load your library</Text>
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable style={styles.button} onPress={() => void reload()}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!loading && userBooks.length === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'The Stacks' }} />
        <Text style={styles.streak}>Streak: {streak} day{streak === 1 ? '' : 's'}</Text>
        <Text style={styles.emptyTitle}>Your shelves are empty</Text>
        <Text style={styles.emptyText}>
          Add a book from the Open Library and your stacks will grow here.
        </Text>
        <Pressable style={styles.button} onPress={() => router.push('/add')}>
          <Text style={styles.buttonText}>Add a book</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/settings')}>
          <Text style={styles.link}>Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'The Stacks' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.streak}>Streak: {streak} day{streak === 1 ? '' : 's'}</Text>
            <View style={styles.headerRow}>
              <Pressable style={styles.button} onPress={() => router.push('/add')}>
                <Text style={styles.buttonText}>Add a book</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/settings')}>
                <Text style={styles.link}>Settings</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/book/${item.id}`)}>
            <Text style={styles.rowTitle}>{titleFor(item)}</Text>
            <Text style={styles.rowAuthor}>{authorFor(item)}</Text>
          </Pressable>
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <Text style={styles.emptyText}>The shelves are empty.</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  streak: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    color: '#2563eb',
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'capitalize',
  },
  row: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    padding: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowAuthor: {
    color: '#64748b',
    marginTop: 2,
  },
});