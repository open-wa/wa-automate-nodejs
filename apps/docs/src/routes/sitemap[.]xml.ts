import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { SITE_ORIGIN } from '@/lib/site';
import { getChangelog } from '@/lib/changelog.server';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET() {
        const pages = source.getPages();
        const baseUrl = SITE_ORIGIN;
        
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>
  <url><loc>${baseUrl}/changelog</loc></url>
${getChangelog().map(entry => `  <url><loc>${baseUrl}${entry.url}</loc></url>`).join('\n')}
${pages.filter(page => !page.data.release).map(page => `  <url>
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
