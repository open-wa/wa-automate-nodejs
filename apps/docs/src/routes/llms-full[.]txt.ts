import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

export const Route = createFileRoute('/llms-full.txt')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET: async () => {
        const scan = source.getPages().map(getLLMText);
        const scanned = await Promise.all(scan);
        return new Response(scanned.join('\n\n'), {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
