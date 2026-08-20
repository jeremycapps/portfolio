import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSharedEnv, resolveSharedEnvPath } from './worktree-env';

const tempDirs: string[] = [];

function tempDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-worktree-env-'));
  tempDirs.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('resolveSharedEnvPath', () => {
  it('prefers an env file in the current worktree', () => {
    const root = tempDirectory();
    const envPath = join(root, '.env');
    writeFileSync(envPath, 'LOCAL_ONLY=yes\n');
    expect(resolveSharedEnvPath(root)).toBe(envPath);
  });

  it('finds the primary worktree env through linked-worktree metadata', () => {
    const mainRoot = tempDirectory();
    const worktreeRoot = join(mainRoot, 'worktrees', 'branch');
    const gitDir = join(mainRoot, '.git', 'worktrees', 'branch');
    mkdirSync(worktreeRoot, { recursive: true });
    mkdirSync(gitDir, { recursive: true });
    writeFileSync(join(mainRoot, '.env'), 'SHARED_ONLY=yes\n');
    writeFileSync(join(worktreeRoot, '.git'), `gitdir: ${gitDir}\n`);

    expect(resolveSharedEnvPath(worktreeRoot)).toBe(join(mainRoot, '.env'));
  });
});

describe('loadSharedEnv', () => {
  it('does not replace values already supplied by the shell', () => {
    const root = tempDirectory();
    writeFileSync(join(root, '.env'), 'WORKTREE_ENV_TEST=from-file\n');
    const original = process.env.WORKTREE_ENV_TEST;
    process.env.WORKTREE_ENV_TEST = 'from-shell';

    try {
      loadSharedEnv(root);
      expect(process.env.WORKTREE_ENV_TEST).toBe('from-shell');
    } finally {
      if (original === undefined) delete process.env.WORKTREE_ENV_TEST;
      else process.env.WORKTREE_ENV_TEST = original;
    }
  });
});
