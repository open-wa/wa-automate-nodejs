import { SITE_ORIGIN } from './site';

export type DocsOgInput = Readonly<{
  title: string;
  description?: string;
  ogDescription?: string;
  summary?: string;
}>;

export type PageImage = Readonly<{
  segments: string[];
  url: string;
}>;

const DEFAULT_DOCS_ORIGIN = SITE_ORIGIN;

export function getPageImage(slugs: readonly string[]): PageImage {
  const segments = [...slugs.filter(Boolean), 'image.webp'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export function getOgDescription(data: DocsOgInput): string | undefined {
  return data.ogDescription ?? data.summary ?? data.description;
}

export function getAbsoluteDocsUrl(path: string, origin = DEFAULT_DOCS_ORIGIN): string {
  return new URL(path, origin).toString();
}

export function getDocsSocialMeta({
  title,
  description,
  imageUrl,
}: Readonly<{
  title: string;
  description?: string;
  imageUrl: string;
}>) {
  return [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    { property: 'og:image', content: imageUrl },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    ...(description ? [{ name: 'twitter:description', content: description }] : []),
    { name: 'twitter:image', content: imageUrl },
  ];
}

/** The `<title>` for a docs page: an explicit SEO title, or the page title with the brand. */
export function getDocsDocumentTitle(data: Readonly<{ title: string; seoTitle?: string }>): string {
  if (data.seoTitle) return data.seoTitle;
  return /open-?wa/i.test(data.title) ? data.title : `${data.title} | open-wa`;
}

/** TechArticle and breadcrumb structured data for a docs page. */
export function getDocsPageSchema({
  title,
  description,
  url,
  imageUrl,
  breadcrumbs,
}: Readonly<{
  title: string;
  description?: string;
  url: string;
  imageUrl: string;
  breadcrumbs: readonly { name: string; url: string }[];
}>) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline: title,
        ...(description ? { description } : {}),
        url,
        image: imageUrl,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        about: { '@id': `${SITE_ORIGIN}/#software` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumbs`,
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    ],
  };
}

export function getSlugsFromImagePath(path: string): string[] {
  const parts = path.split('/').filter(Boolean);

  if (parts.at(-1) !== 'image.webp') return [];

  return parts.slice(0, -1);
}
