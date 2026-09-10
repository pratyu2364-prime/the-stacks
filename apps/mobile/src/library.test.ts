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

beforeEach(() => {
  mockAddBook.mockClear();
  mockLoadLibrary.mockClear();
  mockRemoveBook.mockClear();
  mockUpdateSession.mockClear();
  mockRemoveSession.mockClear();
  mockLoadLibrary.mockResolvedValue(initialLoad);
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
