import { createFileRoute } from '@tanstack/react-router';
import gitDates from 'virtual:docs-git-dates';
import { source } from '@/lib/source';
import { SITE_ORIGIN } from '@/lib/site';
import { TOOL_PAGES } from '@/lib/og';
import { getEditorialSource } from '@/lib/editorial.server';

type SitemapEntry = { path: string; lastmod?: string | null };

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);

/** Published, indexable articles whose canonical is their own URL. */
async function blogEntries(): Promise<SitemapEntry[]> {
  try {
    const blog = await getEditorialSource('posts');
    return blog
      .getPages()
      .filter(({ url, data }) => {
        if (data.seo.robots?.includes('noindex')) return false;
        const canonical = data.seo.canonical ? new URL(data.seo.canonical, SITE_ORIGIN) : undefined;
        return !canonical || canonical.href === new URL(url, SITE_ORIGIN).href;
      })
      .map(({ url, data }) => ({ path: url, lastmod: data.updatedAt ?? data.publishedAt }));
  } catch (error) {
    // The docs entries stay useful while the editorial service is unavailable.
    console.error('Sitemap could not read the blog:', error);
    return [];
  }
}

// Only preferred URLs that answer 200: the tools use their trailing-slash
// paths, and every docs page is its own canonical. Dates come from git history
// at build time or the CMS, and are left out when neither has one.
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      async GET() {
        const entries: SitemapEntry[] = [
          { path: '/' },
          ...Object.values(TOOL_PAGES).map((tool) => ({ path: tool.path })),
          { path: '/blog' },
          ...(await blogEntries()),
          ...source.getPages().map((page) => ({ path: page.url, lastmod: gitDates[page.path]?.modified })),
        ];
        const seen = new Set<string>();
        const urls = entries
          .filter((entry) => !seen.has(entry.path) && seen.add(entry.path))
          .map(({ path, lastmod }) => {
            const loc = `<loc>${escapeXml(SITE_ORIGIN + path)}</loc>`;
            return `<url>${loc}${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`;
          });
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
          { headers: { 'Content-Type': 'application/xml' } },
        );
      },
    },
  },
});
