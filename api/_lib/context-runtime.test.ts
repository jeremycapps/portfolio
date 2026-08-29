import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getContextRuntime,
  resetContextRuntimeForTests,
  type ContextRuntime,
} from './context-runtime';
import type { R2Config } from './context-index';

const config: R2Config = {
  accountId: 'account',
  accessKeyId: 'access',
  secretAccessKey: 'secret',
  bucket: 'bucket',
  prefix: 'context-index',
  endpoint: 'endpoint',
};

describe('getContextRuntime', () => {
  beforeEach(() => resetContextRuntimeForTests());

  it('initializes once and reuses the runtime for a warm process', async () => {
    const runtime = { runQuery: vi.fn() } as ContextRuntime;
    const create = vi.fn(async () => runtime);

    const [first, second] = await Promise.all([
      getContextRuntime(config, create),
      getContextRuntime(config, create),
    ]);

    expect(first).toBe(runtime);
    expect(second).toBe(runtime);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('reinitializes if the storage identity changes', async () => {
    const create = vi.fn(async () => ({ runQuery: vi.fn() }) as ContextRuntime);
    await getContextRuntime(config, create);
    await getContextRuntime({ ...config, prefix: 'next-index' }, create);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('clears a failed initialization so the next request can retry', async () => {
    const runtime = { runQuery: vi.fn() } as ContextRuntime;
    const create = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(runtime);

    await expect(getContextRuntime(config, create)).rejects.toThrow('temporary failure');
    await expect(getContextRuntime(config, create)).resolves.toBe(runtime);
    expect(create).toHaveBeenCalledTimes(2);
  });
});
