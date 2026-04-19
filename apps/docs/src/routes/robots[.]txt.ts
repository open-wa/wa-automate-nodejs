import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/robots.txt')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET() {
        const content = `User-agent: *
Allow: /
Content-Signal: ai-train=no, search=yes, ai-input=no
Sitemap: https://openwa.dev/sitemap.xml`;
        return new Response(content, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      },
    },
  },
});
