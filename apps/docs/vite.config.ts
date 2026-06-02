import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import mdx from 'fumadocs-mdx/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig } from 'vite';

type NitroConfig = Readonly<{
    nitro: {
        externals: {
            external: string[];
            traceInclude: string[];
        };
    };
}>;

const config: UserConfig & NitroConfig = {
    server: {
        port: 3022,
    },
    build: {
        chunkSizeWarningLimit: 1000,
    },
    nitro: {
        externals: {
            external: ['@takumi-rs/core'],
            traceInclude: [
                '@takumi-rs/wasm',
                '@takumi-rs/core-darwin-arm64',
                '@takumi-rs/core-darwin-x64',
                '@takumi-rs/core-linux-arm64-gnu',
                '@takumi-rs/core-linux-arm64-musl',
                '@takumi-rs/core-linux-x64-gnu',
                '@takumi-rs/core-linux-x64-musl',
                '@takumi-rs/core-win32-arm64-msvc',
                '@takumi-rs/core-win32-x64-msvc',
            ],
        },
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
