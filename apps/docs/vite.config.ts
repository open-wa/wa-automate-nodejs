import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import mdx from 'fumadocs-mdx/vite';

export default defineConfig({
    server: {
        port: 3022,
    },
    resolve: {
        alias: {
            'node:path': 'node:path',
            'node:fs/promises': 'node:fs/promises',
        },
    },
    build: {
        rolldownOptions: {
            external: ['node:path', 'node:fs/promises'],
        },
    },
    plugins: [
        mdx(await import('./source.config')),
        tailwindcss(),
        tsConfigPaths({
            projects: ['./tsconfig.json'],
        }),
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
