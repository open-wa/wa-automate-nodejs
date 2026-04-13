import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const Route = createFileRoute('/llms.txt')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET() {
        return new Response(llms(source).index(), {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
