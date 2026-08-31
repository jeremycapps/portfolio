import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import { jsonError, withApiLogging, type ApiHandler } from './api/_lib/http';
import { resolveSharedEnvPath } from './scripts/worktree-env';

function devApis(envDir: string): Plugin {
  return {
    name: 'dev-apis',
    configureServer(server) {
      const env = loadEnv(server.config.mode, envDir, '');
      for (const k of [
        'OPENROUTER_API_KEY',
        'CHAT_MODEL',
        'CHAT_PROVIDER',
        'CHAT_MAX_OUTPUT_TOKENS',
        'UPSTASH_REDIS_REST_URL',
        'UPSTASH_REDIS_REST_TOKEN',
      ]) {
        if (env[k] && !process.env[k]) process.env[k] = env[k];
      }

      const registerDevApi = (
        route: string,
        modulePath: string,
        exportName: string,
      ) => {
        server.middlewares.use(route, async (req, res) => {
          try {
            const module = await server.ssrLoadModule(modulePath);
            const coreHandler = module[exportName] as ApiHandler;
            const handler = withApiLogging(route.slice(1), coreHandler);
            const method = req.method ?? 'GET';
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            const request = new Request(`http://localhost${route}`, {
              method,
              headers: req.headers as Record<string, string>,
              body:
                method === 'GET' || method === 'HEAD' || chunks.length === 0
                  ? undefined
                  : Buffer.concat(chunks),
            });
            const response = await handler(request);
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));

            if (response.body) {
              const reader = response.body.getReader();
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
              }
            }
            res.end();
          } catch (error) {
            console.error(`[${route.slice(1)}] development bridge failed`, error);
            const response = jsonError(
              'The local API bridge failed unexpectedly.',
              'DEV_API_FAILED',
              500,
            );
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(Buffer.from(await response.arrayBuffer()));
          }
        });
      };

      registerDevApi('/api/chat', '/api/_lib/chat-core.ts', 'handleChatRequest');
      registerDevApi('/api/answer', '/api/_lib/answer-core.ts', 'handleAnswerRequest');
      registerDevApi('/api/resume', '/api/_lib/resume-core.ts', 'handleResumeRequest');
    },
  };
}

export default defineConfig(({ mode }) => {
  const root = path.resolve(import.meta.dirname);
  const sharedEnvPath = resolveSharedEnvPath(root);
  const envDir = sharedEnvPath === undefined ? root : path.dirname(sharedEnvPath);
  const fileEnv = loadEnv(mode, envDir, '');

  return {
    base: process.env.BASE_PATH ?? fileEnv.BASE_PATH ?? '/',
    envDir,
    plugins: [react(), tailwindcss(), devApis(envDir)],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
      dedupe: ['react', 'react-dom'],
    },
    root,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(root, 'index.html'),
          stratosV2: path.resolve(root, 'stratos-v2/index.html'),
        },
      },
    },
    server: { port: Number(process.env.PORT ?? fileEnv.PORT) || 5173 },
  };
});
