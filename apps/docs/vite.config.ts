import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import mdx from 'fumadocs-mdx/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig } from 'vite';

const config: UserConfig = {
    server: {
        port: 3022,
    },
    build: {
        chunkSizeWarningLimit: 1000,
    },
    resolve: {
      tsconfigPaths: true,
      // Keep React and the renderer on one physical module identity in the
      // monorepo. Without this, SSR can mix the root React package with a
      // Vite-optimized renderer and hooks fail before the route renders.
      dedupe: ['react', 'react-dom'],
    },
    ssr: {
      optimizeDeps: {
        // Keep React, the server renderer, and the React packages that render
        // HeadContent in one SSR optimization graph. If only React is
        // optimized, external TanStack imports resolve a second dispatcher.
        include: [
          'react',
          'react-dom',
          'react-dom/server',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          '@tanstack/react-router',
          '@tanstack/react-start',
        ],
      },
    },
    plugins: [
        cloudflare({
            viteEnvironment: {
                name: 'ssr',
            },
        }),
        mdx(await import('./source.config.ts')),
        tailwindcss(),
        tanstackStart({
            spa: {
                enabled: true,
                prerender: {
                    outputPath: 'index.html',
                    enabled: true,
                    crawlLinks: false,
                },
            },
            pages: [
                {
                    path: '/docs',
                },
                {
                    path: '/api/search',
                },
                {
                    path: '/api-explorer',
                },
                {
                    path: '/llms.txt',
                },
                {
                    path: '/llms-full.txt',
                },
            ],
        }),
        react(),
    ],
};

export default defineConfig(config);
