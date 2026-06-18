import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api/bnfix': {
          target: 'https://api.bnfix.com.br',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/bnfix/, ''),
          // Repassa o header Cookie manualmente definido pelo cliente
          // e preserva o Set-Cookie da resposta do backend
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Log de todas as requests proxeadas para debug
              console.log(`[PROXY →] ${proxyReq.method} ${proxyReq.path}`);
              // Remove o header 'origin' para evitar rejeição CORS no backend
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              // Log da resposta para debug
              console.log(`[PROXY ←] ${proxyRes.statusCode} ${(req as any).url}`);
              // Garante que o Set-Cookie seja repassado sem restrição de domínio
              const setCookie = proxyRes.headers['set-cookie'];
              if (setCookie) {
                console.log('[PROXY] Set-Cookie recebido:', setCookie);
                proxyRes.headers['set-cookie'] = setCookie.map((c: string) =>
                  c
                    .replace(/;\s*domain=[^;]*/gi, '')
                    .replace(/;\s*secure/gi, '')
                    .replace(/;\s*samesite=[^;]*/gi, '')
                );
              }
            });
            proxy.on('error', (err, req) => {
              console.error(`[PROXY ERROR] ${(req as any).url}`, err.message);
            });
          },
        },
      },
      // HMR is disabled in this workspace to avoid websocket conflicts.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
