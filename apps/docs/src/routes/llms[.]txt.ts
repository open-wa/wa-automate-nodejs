import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { llms } from 'fumadocs-core/source';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      async GET() {
        return new Response(await llms(source).index(), {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
