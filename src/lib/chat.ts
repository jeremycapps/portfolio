export interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function readTextStream(
  res: Response,
  onDelta: (t: string) => void,
): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
}

export async function sendChat(
  messages: ClientMessage[],
  opts: { onDelta: (t: string) => void; signal?: AbortSignal },
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg = 'The assistant is unavailable right now.';
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* non-JSON */ }
    throw new Error(msg);
  }
  await readTextStream(res, opts.onDelta);
}
