import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
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
      server.middlewares.use('/api/chat', async (req, res) => {
        const { handleChatRequest } = await server.ssrLoadModule('/api/_lib/chat-core.ts');
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const request = new Request('http://localhost/api/chat', {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        });
        const response: Response = await handleChatRequest(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        if (response.body) {
          const reader = response.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
        }
        res.end();
      });
      server.middlewares.use('/api/answer', async (req, res) => {
        const { handleAnswerRequest } = await server.ssrLoadModule('/api/_lib/answer-core.ts');
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const request = new Request('http://localhost/api/answer', {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        });
        const response: Response = await handleAnswerRequest(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
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
    build: { outDir: 'dist', emptyOutDir: true },
    server: { port: Number(process.env.PORT ?? fileEnv.PORT) || 5173 },
  };
});
