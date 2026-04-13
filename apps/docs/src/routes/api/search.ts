import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

const server = createFromSource(source, {
    // https://docs.orama.com/docs/orama-js/supported-languages
    language: 'english',
});

export const Route = createFileRoute('/api/search')({
    // @ts-expect-error TanStack types mismatch
    server: {
        handlers: {
            GET: async () => {
                try {
                    return await server.staticGET();
                } catch (e: any) {
                    console.error("SEARCH ERROR:", e);
                    return new Response(e.message || "Error", { status: 500 });
                }
            },
        },
    },
});
