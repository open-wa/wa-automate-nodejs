import { createFileRoute } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { SITE_ORIGIN } from '@/lib/site';
import { getChangelog } from '@/lib/changelog.server';
import { getEditorialSource } from '@/lib/editorial.server';
const escapeXml = (value:string) => value.replace(/[<>&"']/g, char => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));
export const Route = createFileRoute('/sitemap.xml')({server:{handlers:{async GET() {
  const [releases,blog] = await Promise.all([getChangelog(),getEditorialSource('posts')]);
  const urls = ['/', '/blog', '/changelog', ...releases.map(entry=>entry.url), ...blog.getPages().filter(page=>!page.data.seo.robots?.includes('noindex')).map(page=>page.url), ...source.getPages().filter(page=>!page.data.release).map(page=>page.url)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(urls)].map(url=>`<url><loc>${escapeXml(SITE_ORIGIN+url)}</loc></url>`).join('')}</urlset>`, {headers:{'Content-Type':'application/xml'}});
}}}});
