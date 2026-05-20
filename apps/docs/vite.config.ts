import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
    server: {
        port: 3022,
    },
    build: {
        chunkSizeWarningLimit: 1000,
    },
    resolve: {
        tsconfigPaths: true,
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
                    path: '/llms.txt',
                },
                {
                    path: '/llms-full.txt',
                },
            ],
        }),
        react(),
    ],
});

