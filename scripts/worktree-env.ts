import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';

function linkedMainWorktreeRoot(worktreeRoot: string): string | undefined {
  const gitFile = join(worktreeRoot, '.git');
  if (!existsSync(gitFile)) return undefined;

  let contents: string;
  try {
    contents = readFileSync(gitFile, 'utf8');
  } catch {
    return undefined;
  }

  const match = /^gitdir:\s*(.+)$/m.exec(contents);
  if (!match) return undefined;

  const gitDir = isAbsolute(match[1]) ? match[1] : resolve(worktreeRoot, match[1]);
  const commonGitDir = dirname(dirname(gitDir));
  return dirname(commonGitDir);
}

export function resolveSharedEnvPath(worktreeRoot: string): string | undefined {
  const localPath = join(worktreeRoot, '.env');
  if (existsSync(localPath)) return localPath;

  const mainRoot = linkedMainWorktreeRoot(worktreeRoot);
  if (mainRoot === undefined) return undefined;
  const mainPath = join(mainRoot, '.env');
  return existsSync(mainPath) ? mainPath : undefined;
}

export function loadSharedEnv(worktreeRoot: string): string | undefined {
  const envPath = resolveSharedEnvPath(worktreeRoot);
  if (envPath === undefined) return undefined;

  const values = parseEnv(readFileSync(envPath, 'utf8'));
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return envPath;
}
