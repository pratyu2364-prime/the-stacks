import { afterEach, describe, expect, it, vi } from 'vitest';
import { coverUrl, searchBooks } from './openLibrary';

/** A trimmed but real search.json payload. */
const PAYLOAD = {
  docs: [
    {
      key: '/works/OL27448W',
      title: 'The Brothers Karamazov',
      author_name: ['Fyodor Dostoevsky'],
      number_of_pages_median: 824,
      cover_i: 8231856,
      subject: ['Russian literature', 'Fiction', 'Brothers'],
    },
    { key: '/works/OL2W', title: 'Untitled Pages', author_name: ['Anon'], subject: ['Philosophy'] },
    { title: 'No key at all', author_name: ['Ghost'] },
  ],
};

const respond = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({ ok, status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('searchBooks', () => {
  it('maps a real payload into hits with a bucketed genre', async () => {
    vi.stubGlobal('fetch', respond(PAYLOAD));
    const hits = await searchBooks('karamazov');
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({
      olWorkKey: '/works/OL27448W',
      title: 'The Brothers Karamazov',
      author: 'Fyodor Dostoevsky',
      pages: 824,
      genre: 'fiction',
    });
  });

  it('survives a document with no page count or cover', async () => {
    vi.stubGlobal('fetch', respond(PAYLOAD));
    const hits = await searchBooks('anything');
    expect(hits[1]).toMatchObject({ pages: null, coverId: null, genre: 'philosophy' });
  });

  it('drops documents with no work key, rather than shelving a ghost', async () => {
    vi.stubGlobal('fetch', respond(PAYLOAD));
    const hits = await searchBooks('anything');
    expect(hits.some((h) => h.title === 'No key at all')).toBe(false);
  });

  it('throws on a 500 so the caller can offer manual entry', async () => {
    vi.stubGlobal('fetch', respond({}, false, 500));
    await expect(searchBooks('down')).rejects.toThrow('500');
  });

  it('handles an empty result set', async () => {
    vi.stubGlobal('fetch', respond({ docs: [] }));
    expect(await searchBooks('asdfghjkl')).toEqual([]);
  });

  it('does not call the network for a one-character query', async () => {
    const fetchMock = respond(PAYLOAD);
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchBooks('a')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes the abort signal through', async () => {
    const fetchMock = respond(PAYLOAD);
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    await searchBooks('karamazov', controller.signal);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: controller.signal });
  });
});

describe('coverUrl', () => {
  it('is null when there is no cover', () => expect(coverUrl(null)).toBeNull());
  it('builds the medium cover by default', () =>
    expect(coverUrl(123)).toBe('https://covers.openlibrary.org/b/id/123-M.jpg'));
});
