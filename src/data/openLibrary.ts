import type { Genre } from '../domain';
import { bucketGenre } from '../domain';

export type SearchHit = {
  olWorkKey: string;
  title: string;
  author: string;
  pages: number | null;
  coverId: number | null;
  subjects: string[];
  genre: Genre;
};

type RawDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
};

const ENDPOINT = 'https://openlibrary.org/search.json';
const FIELDS = 'key,title,author_name,number_of_pages_median,cover_i,subject';

export function coverUrl(coverId: number | null, size: 'S' | 'M' | 'L' = 'M'): string | null {
  return coverId === null ? null : `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

function toHit(doc: RawDoc): SearchHit | null {
  if (!doc.key || !doc.title) return null;
  const subjects = doc.subject ?? [];
  return {
    olWorkKey: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown',
    pages: doc.number_of_pages_median ?? null,
    coverId: doc.cover_i ?? null,
    subjects,
    genre: bucketGenre(subjects),
  };
}

/**
 * Search Open Library. No key, no quota, CORS-open, so the browser asks directly.
 * Results are transient — nothing is written until the reader adds a book, and
 * after that the cached row is what the app reads.
 */
export async function searchBooks(query: string, signal?: AbortSignal, limit = 12): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `${ENDPOINT}?q=${encodeURIComponent(trimmed)}&limit=${limit}&fields=${FIELDS}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Open Library answered ${response.status}`);

  const body = (await response.json()) as { docs?: RawDoc[] };
  return (body.docs ?? []).map(toHit).filter((hit): hit is SearchHit => hit !== null);
}
