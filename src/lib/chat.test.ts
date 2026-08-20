import { describe, it, expect } from 'vitest';
import { readTextStream } from './chat';

function textStream(parts: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder();
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe('readTextStream', () => {
  it('invokes onDelta for each chunk and accumulates full text', async () => {
    const got: string[] = [];
    await readTextStream(textStream(['Hel', 'lo!']), (t) => got.push(t));
    expect(got.join('')).toBe('Hello!');
  });
});
