import { renderHook, waitFor } from '@testing-library/react-native';
import { useLibrary } from './library';

const initialLoad = {
  books: [{ id: 'b1', olWorkKey: '/works/OL1W', title: 'Dune', author: 'Herbert', pages: 600, coverId: null, subjects: [] }],
  userBooks: [{ id: 'ub1', bookId: 'b1', status: 'reading', genre: 'fiction', rating: null, addedAt: '2026-09-01', finishedAt: null }],
  sessions: [{ id: 's1', userBookId: 'ub1', readOn: '2026-09-09', pageStart: 1, pageEnd: 20, minutes: 30, mood: null, note: null }],
};

const afterAdd = {
  books: [
    ...initialLoad.books,
    { id: 'b2', olWorkKey: '/works/OL2W', title: 'Neuromancer', author: 'Gibson', pages: 271, coverId: null, subjects: [] },
  ],
  userBooks: [
    ...initialLoad.userBooks,
    { id: 'ub2', bookId: 'b2', status: 'reading', genre: 'fiction', rating: null, addedAt: '2026-09-09', finishedAt: null },
  ],
  sessions: initialLoad.sessions,
};

const afterRemove = {
  books: initialLoad.books,
  userBooks: [],
  sessions: [],
};

const afterEdit = {
  ...initialLoad,
  sessions: [{ ...initialLoad.sessions[0], pageEnd: 25 }],
};

const afterDelete = {
  ...initialLoad,
  sessions: [],
};

const mockAddBook = jest.fn(async () => afterAdd);
const mockLoadLibrary = jest.fn(async () => initialLoad);
const mockRemoveBook = jest.fn(async () => undefined);
const mockUpdateSession = jest.fn(async () => undefined);
const mockRemoveSession = jest.fn(async () => undefined);

jest.mock('@stacks/data', () => ({
  get addBook() { return mockAddBook; },
  get loadLibrary() { return mockLoadLibrary; },
  get removeBook() { return mockRemoveBook; },
  get updateSession() { return mockUpdateSession; },
  get removeSession() { return mockRemoveSession; },
}));
jest.mock('./supabase', () => ({ supabase: {} }));

const mockPending = jest.fn(async () => [] as Array<{ id: string; userBookId: string; readOn: string; pageStart: number | null; pageEnd: number | null; minutes: number | null; mood: string | null; note: string | null }>);

jest.mock('./db', () => ({
  get outbox() { return { pending: mockPending }; },
}));

beforeEach(() => {
  mockAddBook.mockClear();
  mockLoadLibrary.mockClear();
  mockRemoveBook.mockClear();
  mockUpdateSession.mockClear();
  mockRemoveSession.mockClear();
  mockPending.mockClear();
  mockLoadLibrary.mockResolvedValue(initialLoad);
  mockPending.mockResolvedValue([]);
});

it('exposes the shelf and the streak from the shared domain', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.userBooks).toHaveLength(1);
  expect(result.current.streak).toBe(1);
});

it('addBook calls the data layer then reloads the shelf', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.userBooks).toHaveLength(1);

  mockLoadLibrary.mockResolvedValue(afterAdd);

  const hit = {
    olWorkKey: '/works/OL2W',
    title: 'Neuromancer',
    author: 'Gibson',
    pages: 271,
    coverId: null,
    subjects: [],
    genre: 'fiction' as const,
  };
  await result.current.addBook(hit);

  expect(mockAddBook).toHaveBeenCalledTimes(1);
  expect(mockAddBook).toHaveBeenCalledWith(
    expect.anything(),
    { olWorkKey: '/works/OL2W', title: 'Neuromancer', author: 'Gibson', pages: 271, coverId: null, subjects: [] },
    'fiction',
    'reading',
  );

  await waitFor(() => expect(result.current.userBooks).toHaveLength(2));
  expect(result.current.books[1].title).toBe('Neuromancer');
});

it('removeBook calls the data layer then reloads the shelf', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.userBooks).toHaveLength(1);

  mockLoadLibrary.mockResolvedValue(afterRemove);

  await result.current.removeBook('ub1');

  expect(mockRemoveBook).toHaveBeenCalledTimes(1);
  expect(mockRemoveBook).toHaveBeenCalledWith(expect.anything(), 'ub1');

  await waitFor(() => expect(result.current.userBooks).toHaveLength(0));
  expect(result.current.sessions).toHaveLength(0);
});

it('editSession calls the data layer then reloads', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));

  mockLoadLibrary.mockResolvedValue(afterEdit);

  await result.current.editSession('s1', { pageEnd: 25 });

  expect(mockUpdateSession).toHaveBeenCalledTimes(1);
  expect(mockUpdateSession).toHaveBeenCalledWith(expect.anything(), 's1', { pageEnd: 25 });

  await waitFor(() => expect(result.current.sessions[0].pageEnd).toBe(25));
});

it('deleteSession calls the data layer then reloads', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));

  mockLoadLibrary.mockResolvedValue(afterDelete);

  await result.current.deleteSession('s1');

  expect(mockRemoveSession).toHaveBeenCalledTimes(1);
  expect(mockRemoveSession).toHaveBeenCalledWith(expect.anything(), 's1');

  await waitFor(() => expect(result.current.sessions).toHaveLength(0));
});

it('merges pending outbox sessions into the merged sessions list', async () => {
  mockPending.mockResolvedValue([
    { id: 'p1', userBookId: 'ub1', readOn: '2026-09-10', pageStart: null, pageEnd: null, minutes: 15, mood: 'calm', note: null },
  ]);

  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.sessions).toHaveLength(2);
  expect(result.current.pendingIds.has('p1')).toBe(true);
  const pending = result.current.sessions.find((s) => s.id === 'p1');
  expect(pending).toBeDefined();
  expect(pending!.minutes).toBe(15);
});

it('a pending sitting keeps the streak alive', async () => {
  mockPending.mockResolvedValue([
    { id: 'p2', userBookId: 'ub1', readOn: '2026-09-10', pageStart: null, pageEnd: null, minutes: 10, mood: null, note: null },
  ]);

  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.streak).toBeGreaterThanOrEqual(2);
});

it('deduplicates: a row on both server and outbox appears exactly once, server wins', async () => {
  const serverSession = { id: 's1', userBookId: 'ub1', readOn: '2026-09-09', pageStart: 1, pageEnd: 20, minutes: 30, mood: null, note: null };
  mockPending.mockResolvedValue([
    { ...serverSession, pageEnd: 99 },
  ]);

  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));

  const matching = result.current.sessions.filter((s) => s.id === 's1');
  expect(matching).toHaveLength(1);
  expect(matching[0].pageEnd).toBe(20);
});

it('does not call a sitting pending once the server has it', async () => {
  // The outbox still holds s1 — it was sent but the row lingers. Calling it
  // unsynced would lie to the reader and hide the edit controls from a sitting
  // that can perfectly well be edited.
  mockPending.mockResolvedValue([
    { id: 's1', userBookId: 'ub1', readOn: '2026-09-09', pageStart: 1, pageEnd: 20, minutes: 30, mood: null, note: null },
    { id: 's2', userBookId: 'ub1', readOn: '2026-09-10', pageStart: 21, pageEnd: 44, minutes: 25, mood: null, note: null },
  ]);

  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.pendingIds.has('s1')).toBe(false);
  expect(result.current.pendingIds.has('s2')).toBe(true);
});
