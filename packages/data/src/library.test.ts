import { describe, expect, it, vi } from 'vitest';
import { removeBook, removeSession, updateSession } from './library';

function mockClient() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const delete_ = vi.fn().mockReturnValue({ eq });
  return { from: vi.fn().mockReturnValue({ delete: delete_ }), _eq: eq, _delete: delete_ };
}

describe('removeBook', () => {
  it('deletes the user_books row by id', async () => {
    const client = mockClient();
    await removeBook(client as never, 'ub-1');
    expect(client.from).toHaveBeenCalledWith('user_books');
    expect(client._delete).toHaveBeenCalled();
    expect(client._eq).toHaveBeenCalledWith('id', 'ub-1');
  });

  it('throws on supabase error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'denied' } });
    const delete_ = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ delete: delete_ }) };
    await expect(removeBook(client as never, 'ub-bad')).rejects.toThrow('denied');
  });
});

const sessionRow = {
  id: 's1' as string,
  user_book_id: 'ub1' as string,
  read_on: '2026-09-01' as string,
  page_start: 10 as number | null,
  page_end: 20 as number | null,
  minutes: 30 as number | null,
  mood: 'calm' as string | null,
  note: null as string | null,
};

describe('updateSession', () => {
  function mockUpdateClient(row = sessionRow) {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    return { from: vi.fn().mockReturnValue({ update }), _update: update, _eq: eq, _select: select, _single: single };
  }

  it('sends only the patched columns', async () => {
    const client = mockUpdateClient();
    await updateSession(client as never, 's1', { pageEnd: 25 });
    expect(client._update).toHaveBeenCalledWith({ page_end: 25 });
    expect(client._eq).toHaveBeenCalledWith('id', 's1');
  });

  it('sends multiple patched columns', async () => {
    const client = mockUpdateClient();
    await updateSession(client as never, 's1', { pageEnd: 30, minutes: 45, note: 'great' });
    expect(client._update).toHaveBeenCalledWith({ page_end: 30, minutes: 45, note: 'great' });
  });

  it('returns the mapped session', async () => {
    const client = mockUpdateClient({ ...sessionRow, note: 'hi' });
    const result = await updateSession(client as never, 's1', { note: 'hi' });
    expect(result.id).toBe('s1');
    expect(result.note).toBe('hi');
    expect(result.mood).toBe('calm');
  });

  it('throws on error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ update }) };
    await expect(updateSession(client as never, 'bad', { note: 'x' })).rejects.toThrow('not found');
  });
});

describe('removeSession', () => {
  function mockRemoveClient() {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const delete_ = vi.fn().mockReturnValue({ eq });
    return { from: vi.fn().mockReturnValue({ delete: delete_ }), _eq: eq, _delete: delete_ };
  }

  it('deletes the sessions row by id', async () => {
    const client = mockRemoveClient();
    await removeSession(client as never, 's1');
    expect(client.from).toHaveBeenCalledWith('sessions');
    expect(client._delete).toHaveBeenCalled();
    expect(client._eq).toHaveBeenCalledWith('id', 's1');
  });

  it('throws on supabase error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'denied' } });
    const delete_ = vi.fn().mockReturnValue({ eq });
    const client = { from: vi.fn().mockReturnValue({ delete: delete_ }) };
    await expect(removeSession(client as never, 's-bad')).rejects.toThrow('denied');
  });
});
