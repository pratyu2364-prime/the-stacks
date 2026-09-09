import { describe, expect, it } from 'vitest';
import { bucketGenre } from './genre';

describe('bucketGenre', () => {
  const cases: Array<[string[], string]> = [
    [['Fiction', 'Russian literature', 'Brothers'], 'fiction'],
    [['English fiction', 'Dystopias'], 'fiction'],
    [['Fantasy fiction', 'Dragons'], 'fiction'],
    [['Poetry', 'American'], 'fiction'],
    [['Science fiction', 'Space flight'], 'fiction'],
    [['Philosophy', 'Ethics'], 'philosophy'],
    [['Stoicism', 'Conduct of life'], 'philosophy'],
    [['Theology', 'Christianity'], 'philosophy'],
    [['Consciousness', 'Mind and body'], 'philosophy'],
    [['Physics', 'Relativity'], 'science'],
    [['Evolution (Biology)', 'Genetics'], 'science'],
    [['Popular science', 'Cosmology'], 'science'],
    [['Psychology', 'Decision making'], 'science'],
    [['Computer science', 'Algorithms'], 'science'],
    [['History', 'Rome'], 'history'],
    [['World War, 1939-1945', 'War'], 'history'],
    [['Biography', 'Statesmen'], 'history'],
    [['Politics and government'], 'history'],
    [['Art', 'Renaissance'], 'arts'],
    [['Music', 'Jazz'], 'arts'],
    [['Architecture', 'Modernism'], 'arts'],
    [['Business', 'Leadership'], 'practical'],
    [['Cooking', 'Italian'], 'practical'],
    [['Personal finance'], 'practical'],
  ];

  for (const [subjects, expected] of cases) {
    it(`${subjects[0]} -> ${expected}`, () => {
      expect(bucketGenre(subjects)).toBe(expected);
    });
  }

  it('falls back to practical when nothing matches', () => {
    expect(bucketGenre(['Unclassifiable', 'Miscellany'])).toBe('practical');
  });

  it('falls back to practical on empty subjects', () => {
    expect(bucketGenre([])).toBe('practical');
  });

  it('lets a fiction marker win over a later-rule marker', () => {
    expect(bucketGenre(['Historical fiction', 'History'])).toBe('fiction');
  });
});
