import { DuckDBInstance } from '@duckdb/node-api';
import {
  initializeSearchDatabase,
  queryContext,
  type ContextQuery,
  type ContextQueryResult,
  type R2Config,
} from './context-index.js';

export interface ContextRuntime {
  runQuery(query: ContextQuery): Promise<ContextQueryResult>;
}

type RuntimeFactory = (config: R2Config) => Promise<ContextRuntime>;

export async function createContextRuntime(config: R2Config): Promise<ContextRuntime> {
  const instance = await DuckDBInstance.create(':memory:');
  const bootstrap = await instance.connect();
  try {
    await initializeSearchDatabase(bootstrap, config);
  } finally {
    bootstrap.closeSync();
  }

  return {
    async runQuery(query) {
      const connection = await instance.connect();
      try {
        await connection.run('USE context_index');
        return await queryContext(connection, config, query);
      } finally {
        connection.closeSync();
      }
    },
  };
}

let cachedRuntime: { key: string; promise: Promise<ContextRuntime> } | undefined;

function runtimeKey(config: R2Config): string {
  return [config.accountId, config.accessKeyId, config.bucket, config.prefix, config.endpoint].join('\0');
}

export function getContextRuntime(
  config: R2Config,
  createRuntime: RuntimeFactory = createContextRuntime,
): Promise<ContextRuntime> {
  const key = runtimeKey(config);
  if (cachedRuntime?.key === key) return cachedRuntime.promise;

  const promise = createRuntime(config).catch((error) => {
    if (cachedRuntime?.promise === promise) cachedRuntime = undefined;
    throw error;
  });
  cachedRuntime = { key, promise };
  return promise;
}

export function resetContextRuntimeForTests(): void {
  cachedRuntime = undefined;
}
