import { describe, expect, it, vi } from 'vitest';
import { removeBook } from './library';

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
