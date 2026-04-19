import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';

export const Route = createFileRoute('/sitemap.xml')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET() {
        const pages = source.getPages();
        const baseUrl = 'https://openwa.dev';
        
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
  </url>`).join('\n')}
</urlset>`;
        
        return new Response(sitemap, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
      },
    },
  },
});
