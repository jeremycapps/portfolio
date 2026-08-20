import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendContactMessage } from './contact';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendContactMessage', () => {
  it('posts message and email to /api/contact', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));

    await sendContactMessage({ message: 'Hi Jeremy', email: 'a@b.com' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/contact');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      message: 'Hi Jeremy',
      email: 'a@b.com',
    });
  });

  it('throws a friendly message on non-ok responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 500 }),
    );

    await expect(
      sendContactMessage({ message: 'Hi', email: 'a@b.com' }),
    ).rejects.toThrow(/could not be sent/i);
  });

  it('surfaces a server-provided error message when present', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Email looks invalid.' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(
      sendContactMessage({ message: 'Hi', email: 'bad' }),
    ).rejects.toThrow('Email looks invalid.');
  });
});
