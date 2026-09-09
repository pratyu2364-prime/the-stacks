import { router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { searchBooks, type SearchHit } from '@stacks/data';
import { useLibrary } from '../src/library';

export default function AddScreen() {
  const { addBook } = useLibrary();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [shelvingId, setShelvingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    const timer = setTimeout(() => {
      searchBooks(query, controller.signal)
        .then((results) => {
          setHits(results);
          setNetworkError(null);
          setSearching(false);
        })
        .catch((e: Error) => {
          if (e.name === 'AbortError') return;
          setNetworkError(e.message || 'Open Library did not answer.');
          setSearching(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const shelve = useCallback(
    async (hit: SearchHit) => {
      setShelvingId(hit.olWorkKey);
      try {
        await addBook(hit);
        router.back();
      } catch (e) {
        setNetworkError(e instanceof Error ? e.message : 'Could not shelve the book.');
        setShelvingId(null);
      }
    },
    [addBook],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Add a book' }} />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="title or author"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {networkError && <Text style={styles.error}>{networkError}</Text>}

      {searching && <ActivityIndicator style={styles.spinner} />}

      <FlatList
        data={hits}
        keyExtractor={(item) => item.olWorkKey}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => void shelve(item)}
            disabled={shelvingId !== null}
          >
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowAuthor} numberOfLines={1}>
              {item.author}
            </Text>
            {shelvingId === item.olWorkKey && (
              <ActivityIndicator style={styles.rowSpinner} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          !searching && query.trim().length >= 2 ? (
            <Text style={styles.empty}>Nothing found.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  input: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  spinner: { marginTop: 16 },
  row: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '500' },
  rowAuthor: { color: '#64748b', flexShrink: 1, marginLeft: 8 },
  rowSpinner: { marginLeft: 8 },
  empty: { color: '#64748b', padding: 16, textAlign: 'center' },
});
