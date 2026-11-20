import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import mdx from 'fumadocs-mdx/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docsDir = path.dirname(fileURLToPath(import.meta.url));

type DocsGitDates = Record<string, { published: string; modified: string }>;

/**
 * First and last commit dates for each docs page, keyed by its path under
 * content/docs. Dates come only from real history: a shallow clone, a missing
 * git binary or an uncommitted file yields no entry, never a guess.
 */
function readDocsGitDates(): DocsGitDates {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: docsDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
  try {
    if (git('rev-parse', '--is-shallow-repository') !== 'false') return {};
    const prefix = `${git('rev-parse', '--show-prefix')}content/docs/`;
    const log = git('log', '--format=%x00%cI', '--name-only', '--no-renames', '--', 'content/docs');
    const dates: DocsGitDates = {};
    // Newest commit first: the first sighting is the last change, the final one the first.
    for (const commit of log.split('\0').filter(Boolean)) {
      const [date, ...files] = commit.trim().split('\n');
      for (const file of files) {
        if (!file.startsWith(prefix)) continue;
        const key = file.slice(prefix.length);
        dates[key] = { published: date, modified: dates[key]?.modified ?? date };
      }
    }
    return dates;
  } catch {
    return {};
  }
}

function docsGitDates(): Plugin {
  const id = 'virtual:docs-git-dates';
  let dates: DocsGitDates | undefined;
  return {
    name: 'docs-git-dates',
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load(resolved) {
      if (resolved !== `\0${id}`) return;
      dates ??= readDocsGitDates();
      return `export default ${JSON.stringify(dates)};`;
    },
  };
}

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
        docsGitDates(),
        cloudflare({
            viteEnvironment: {
                name: 'ssr',
            },
        }),
        mdx(await import('./source.config.ts')),
        tailwindcss(),
        tanstackStart({
            // Editorial routes read live published content through a Worker binding.
            prerender: {
                filter: (page) => !/^\/(blog|changelog|sitemap\.xml)(\/|$)/.test(page.path),
            },
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
