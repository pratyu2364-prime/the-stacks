import type { Genre } from './types';

/**
 * Open Library subjects to one of the six rooms. Ordered: the first rule that
 * matches wins, a fiction marker beats everything, `practical` catches the rest.
 * The table only has to be right often enough not to annoy — the user can
 * override the genre on any book.
 */
const RULES: Array<{ genre: Genre; keywords: string[] }> = [
  { genre: 'fiction', keywords: ['fiction', 'novel', 'short stories', 'literature', 'poetry', 'drama', 'fantasy', 'science fiction'] },
  { genre: 'philosophy', keywords: ['philosophy', 'ethics', 'metaphysics', 'stoicism', 'logic', 'religion', 'theology', 'consciousness'] },
  { genre: 'science', keywords: ['science', 'physics', 'biology', 'mathematics', 'psychology', 'neuroscience', 'medicine', 'astronomy', 'evolution', 'cosmology', 'computer'] },
  { genre: 'history', keywords: ['history', 'historical', 'biography', 'war', 'civilization', 'archaeology', 'politics', 'anthropology'] },
  { genre: 'arts', keywords: ['art', 'music', 'film', 'photography', 'architecture', 'design', 'criticism', 'essays'] },
  { genre: 'practical', keywords: ['business', 'management', 'self-help', 'cooking', 'health', 'finance', 'travel', 'programming', 'productivity'] },
];

export function bucketGenre(subjects: string[]): Genre {
  const haystack = subjects.map((s) => s.toLowerCase());
  for (const { genre, keywords } of RULES) {
    if (haystack.some((s) => keywords.some((k) => s.includes(k)))) return genre;
  }
  return 'practical';
}
