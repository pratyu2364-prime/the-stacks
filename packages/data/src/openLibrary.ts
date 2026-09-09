import type { Genre } from '@stacks/domain';
import { bucketGenre } from '@stacks/domain';

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

async function fetchDocs(params: string, signal?: AbortSignal): Promise<RawDoc[]> {
  const response = await fetch(`${ENDPOINT}?${params}&fields=${FIELDS}`, { signal });
  if (!response.ok) throw new Error(`Open Library answered ${response.status}`);
  const body = (await response.json()) as { docs?: RawDoc[] };
  return body.docs ?? [];
}

/**
 * Search Open Library. No key, no quota, CORS-open, so the browser asks directly.
 *
 * Two searches, not one. A plain `q=` is a loose relevance match: searching an
 * exact title returns dozens of unrelated books ahead of the right one, or
 * instead of it. So ask the title index first and put those hits at the top,
 * then append the loose results for the times someone is searching a half-
 * remembered phrase or an author. Deduplicated by work key, order preserved.
 *
 * Either request may fail on its own; only both failing is an error worth
 * showing, because one good list still answers the question.
 */
export async function searchBooks(query: string, signal?: AbortSignal, limit = 20): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const encoded = encodeURIComponent(trimmed);

  const [byTitle, loose] = await Promise.allSettled([
    fetchDocs(`title=${encoded}&limit=${limit}`, signal),
    fetchDocs(`q=${encoded}&limit=${limit}`, signal),
  ]);

  if (byTitle.status === 'rejected' && loose.status === 'rejected') throw byTitle.reason;

  const ordered = [
    ...(byTitle.status === 'fulfilled' ? byTitle.value : []),
    ...(loose.status === 'fulfilled' ? loose.value : []),
  ];

  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const doc of ordered) {
    const hit = toHit(doc);
    if (!hit || seen.has(hit.olWorkKey)) continue;
    seen.add(hit.olWorkKey);
    hits.push(hit);
    if (hits.length >= limit) break;
  }
  return hits;
}
