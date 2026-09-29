import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import methodsRecords from '../../generated/client-methods.json';
import { CURRENT_VERSION } from '@/lib/site';
import { createCanonicalMethods, searchCanonical } from '@/lib/search';

const server = createFromSource(source, {
  language: 'english',
});

const canonicalMethods = createCanonicalMethods(methodsRecords, CURRENT_VERSION);
const SEARCH_TIMEOUT_MS = 8_000;

async function withSearchTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Search timed out')), SEARCH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('query')?.trim() ?? '';

        if (!query) return Response.json([]);

        try {
          const [results, methods] = await Promise.all([
            /\balias(?:es)?\b/i.test(query)
              ? Promise.resolve([])
              : withSearchTimeout(
                  server.search(query, {
                    locale: url.searchParams.get('locale'),
                    limit: 60,
                  }),
                ),
            canonicalMethods,
          ]);

          return Response.json(searchCanonical(query, methods, results), {
            headers: {
              'Cache-Control': 'public, max-age=60, s-maxage=300',
            },
          });
        } catch (error) {
          console.error('SEARCH_ERROR', error);
          return Response.json(
            { error: 'Search is temporarily unavailable. Try again or browse the docs navigation.' },
            { status: 503 },
          );
        }
      },
    },
  },
});
