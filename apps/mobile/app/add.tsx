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
import { GENRES, type Genre } from '@stacks/domain';
import { searchBooks, type SearchHit } from '@stacks/data';
import { useLibrary } from '../src/library';
import { Cover } from '../src/Cover';
import { font, palette, radii, shared, spacing } from '../src/theme';

/**
 * An aborted request is not a failure in any client. Web throws AbortError;
 * React Native has been seen surfacing a TypeError with "Abort" inside its
 * message — so match on the message, not the name.
 */
function isAbortError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === 'AbortError') return true;
  return e.message.toLowerCase().includes('abort');
}

function manualKey(): string {
  return `manual:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AddScreen() {
  const { addBook } = useLibrary();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [shelvingId, setShelvingId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [shelvingError, setShelvingError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Monotone request id: a result is only worth keeping if it belongs to the
  // latest query. Superseded requests vanish silently no matter what settles.
  const seqRef = useRef(0);

  useEffect(() => {
    abortRef.current?.abort();
    const mine = ++seqRef.current;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setSearching(false);
      setNetworkError(null);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setNetworkError(null);
    const timer = setTimeout(() => {
      searchBooks(query, controller.signal)
        .then((results) => {
          if (mine !== seqRef.current) return;
          setHits(results);
          setSearching(false);
          setNetworkError(null);
        })
        .catch((e) => {
          if (mine !== seqRef.current) return;
          if (isAbortError(e)) return;
          setSearching(false);
          setNetworkError(e instanceof Error ? e.message : 'Open Library did not answer.');
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const openManual = useCallback(() => {
    setManualOpen(true);
    setShelvingError(null);
  }, []);

  const closeManual = useCallback(() => {
    setManualOpen(false);
    setShelvingError(null);
  }, []);

  const shelve = useCallback(
    async (hit: SearchHit) => {
      setShelvingId(hit.olWorkKey);
      setShelvingError(null);
      try {
        await addBook(hit);
        router.back();
      } catch (e) {
        setShelvingError(e instanceof Error ? e.message : 'Could not shelve the book.');
        setShelvingId(null);
      }
    },
    [addBook],
  );

  const shelveManual = useCallback(
    async (book: { title: string; author: string; pages: number | null; genre: Genre }) => {
      const hit: SearchHit = {
        olWorkKey: manualKey(),
        title: book.title,
        author: book.author,
        pages: book.pages,
        coverId: null,
        subjects: [],
        genre: book.genre,
      };
      await shelve(hit);
    },
    [shelve],
  );

  const showResultsList = query.trim().length >= 2 && !manualOpen;

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

      {searching && !manualOpen && <ActivityIndicator style={styles.spinner} color={palette.lamp} />}

      <FlatList
        data={showResultsList ? hits : []}
        keyExtractor={(item) => item.olWorkKey}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => void shelve(item)}
            disabled={shelvingId !== null}
          >
            <Cover coverId={item.coverId} title={item.title} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowAuthor} numberOfLines={1}>
                {item.author}
              </Text>
            </View>
            {shelvingId === item.olWorkKey && (
              <ActivityIndicator style={styles.rowSpinner} color={palette.lamp} />
            )}
          </Pressable>
        )}
        ListHeaderComponent={
          showResultsList && !searching && !manualOpen ? (
            <View style={styles.quietLinkWrap}>
              <Text style={styles.quietLinkText}>
                {hits.length === 0 ? 'Nothing found. ' : 'Not the book you meant? '}
                <Text style={styles.quietLink} onPress={openManual}>
                  Add it by hand
                </Text>
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          showResultsList && !searching && hits.length === 0 ? (
            <Text style={styles.empty}>Nothing found.</Text>
          ) : null
        }
        ListFooterComponent={
          manualOpen ? (
            <ManualForm query={query} onShelve={shelveManual} onClose={closeManual} busy={shelvingId !== null} />
          ) : null
        }
      />
      {shelvingError && <Text style={styles.error}>{shelvingError}</Text>}
    </View>
  );
}

function ManualForm({
  query,
  onShelve,
  onClose,
  busy,
}: {
  query: string;
  onShelve: (book: { title: string; author: string; pages: number | null; genre: Genre }) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState(query.trim());
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [genre, setGenre] = useState<Genre>('fiction');

  const save = () => {
    if (!title.trim()) return;
    onShelve({
      title: title.trim(),
      author: author.trim(),
      pages: pages === '' ? null : Number(pages),
      genre,
    });
  };

  return (
    <View style={styles.manualForm}>
      <Text style={styles.manualHeading}>Add it by hand</Text>
      <TextInput
        style={shared.input}
        value={title}
        onChangeText={setTitle}
        placeholder="title"
        placeholderTextColor={palette.dust}
        editable={!busy}
      />
      <TextInput
        style={shared.input}
        value={author}
        onChangeText={setAuthor}
        placeholder="author"
        placeholderTextColor={palette.dust}
        editable={!busy}
      />
      <TextInput
        style={shared.input}
        value={pages}
        onChangeText={setPages}
        placeholder="pages (optional)"
        placeholderTextColor={palette.dust}
        keyboardType="number-pad"
        editable={!busy}
      />
      <Text style={styles.manualLabel}>room</Text>
      <View style={styles.genreRow}>
        {GENRES.map((g) => (
          <Pressable
            key={g}
            onPress={() => setGenre(g)}
            style={[
              styles.genreChip,
              genre === g && styles.genreChipActive,
            ]}
          >
            <Text style={[styles.genreLabel, genre === g && styles.genreLabelActive]}>{g}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.manualButtons}>
        <Pressable
          style={({ pressed }) => [shared.primaryBtn, styles.manualButton, pressed && styles.pressed]}
          onPress={save}
          disabled={busy || !title.trim()}
        >
          <Text style={shared.primaryBtnText}>{busy ? 'shelving…' : 'shelve it'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [shared.secondaryBtn, styles.manualButton, pressed && styles.pressed]}
          onPress={onClose}
        >
          <Text style={shared.secondaryBtnText}>cancel</Text>
        </Pressable>
      </View>
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowPressed: {
    backgroundColor: palette.ink,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: palette.paper,
    flexShrink: 1,
    fontFamily: font.family.serif,
    fontSize: font.size.lg,
    fontWeight: '600',
  },
  rowAuthor: {
    color: palette.dust,
    flexShrink: 1,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
    marginTop: spacing.xs,
  },
  rowSpinner: { marginLeft: spacing.sm },
  empty: {
    color: palette.dust,
    fontFamily: font.family.mono,
    padding: spacing.lg,
    textAlign: 'center',
  },
  quietLinkWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  quietLinkText: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  quietLink: {
    color: palette.lamp,
    textDecorationLine: 'underline',
  },
  manualForm: {
    borderColor: palette.oak,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    padding: spacing.lg,
  },
  manualHeading: {
    color: palette.paper,
    fontFamily: font.family.serif,
    fontSize: font.size.lg,
    fontWeight: '600',
  },
  manualLabel: {
    ...shared.label,
    textTransform: 'uppercase',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genreChip: {
    borderColor: palette.oak,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  genreChipActive: {
    borderColor: palette.lamp,
  },
  genreLabel: {
    color: palette.dust,
    fontFamily: font.family.mono,
    fontSize: font.size.sm,
  },
  genreLabelActive: {
    color: palette.lamp,
  },
  manualButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  manualButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});