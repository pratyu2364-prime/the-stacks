import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLibrary } from '../../src/library';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { books, userBooks, sessions, loading } = useLibrary();

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
        <ActivityIndicator size="large" />
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
    <View style={styles.container}>
      <Stack.Screen options={{ title: book?.title ?? 'Book' }} />
      <FlatList
        data={bookSessions}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{book?.title ?? 'Unknown title'}</Text>
            <Text style={styles.author}>{book?.author ?? 'Unknown author'}</Text>
            <Text style={styles.status}>{userBook.status}</Text>
            <Pressable style={styles.logButton} onPress={() => router.push(`/log?userBookId=${userBook.id}`)}>
              <Text style={styles.logButtonText}>Log a session</Text>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  author: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 2,
  },
  status: {
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  logButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 14,
  },
  logButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHeader: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    textTransform: 'uppercase',
  },
  sessionRow: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  sessionDetail: {
    color: '#64748b',
    marginTop: 2,
  },
  emptyText: {
    color: '#64748b',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});