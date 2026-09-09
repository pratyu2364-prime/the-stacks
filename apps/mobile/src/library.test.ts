import { renderHook, waitFor } from '@testing-library/react-native';
import { useLibrary } from './library';

jest.mock('@stacks/data', () => ({
  loadLibrary: jest.fn(async () => ({
    books: [{ id: 'b1', olWorkKey: '/works/OL1W', title: 'Dune', author: 'Herbert', pages: 600, coverId: null, subjects: [] }],
    userBooks: [{ id: 'ub1', bookId: 'b1', status: 'reading', genre: 'fiction', rating: null, addedAt: '2026-09-01', finishedAt: null }],
    sessions: [{ id: 's1', userBookId: 'ub1', readOn: '2026-09-09', pageStart: 1, pageEnd: 20, minutes: 30, mood: null, note: null }],
  })),
}));
jest.mock('./supabase', () => ({ supabase: {} }));

it('exposes the shelf and the streak from the shared domain', async () => {
  const { result } = renderHook(() => useLibrary());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.userBooks).toHaveLength(1);
  expect(result.current.streak).toBe(1);
});
