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
import { font, palette, shared, spacing } from '../src/theme';

export default function AddScreen() {
  const { addBook } = useLibrary();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
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
      <View style={styles.searchWrap}>
        <TextInput
          style={[shared.input, focused && styles.inputFocused]}
          value={query}
          onChangeText={setQuery}
          placeholder="title or author"
          placeholderTextColor={palette.dust}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      {networkError && <Text style={styles.error}>{networkError}</Text>}

      {searching && <ActivityIndicator style={styles.spinner} color={palette.lamp} />}

      <FlatList
        data={hits}
        keyExtractor={(item) => item.olWorkKey}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
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
              <ActivityIndicator style={styles.rowSpinner} color={palette.lamp} />
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
  container: {
    flex: 1,
    backgroundColor: palette.gloom,
  },
  searchWrap: {
    padding: spacing.lg,
  },
  inputFocused: {
    borderColor: palette.lamp,
  },
  error: {
    color: palette.danger,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  spinner: { marginTop: spacing.md },
  row: {
    alignItems: 'center',
    borderBottomColor: palette.oak,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowPressed: {
    backgroundColor: palette.ink,
  },
  rowTitle: {
    color: palette.paper,
    flex: 1,
    fontFamily: font.family.serif,
    fontSize: font.size.lg,
    fontWeight: '600',
  },
  rowAuthor: {
    color: palette.dust,
    flexShrink: 1,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    marginLeft: spacing.sm,
  },
  rowSpinner: { marginLeft: spacing.sm },
  empty: {
    color: palette.dust,
    fontFamily: font.family.mono,
    padding: spacing.lg,
    textAlign: 'center',
  },
});