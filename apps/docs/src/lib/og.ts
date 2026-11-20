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

/** Linked-data ids defined in full on the homepage and referenced from other pages. */
export const SCHEMA_IDS = {
  organization: `${SITE_ORIGIN}/#organization`,
  website: `${SITE_ORIGIN}/#website`,
  software: `${SITE_ORIGIN}/#software`,
} as const;

/** Public tools outside the docs tree. Each path is the URL that answers 200. */
export const TOOL_PAGES = {
  new: {
    path: '/new/',
    title: 'Create your open-wa project',
    documentTitle: 'Create a WhatsApp API project | open-wa',
    description:
      'Set up an open-wa Easy API or Node.js SDK project. Choose JavaScript or TypeScript, a browser and plugins, then copy one setup command.',
  },
  'api-explorer': {
    path: '/api-explorer/',
    title: 'API Explorer',
    documentTitle: 'WhatsApp HTTP API Explorer | open-wa',
    description:
      'Try every open-wa Easy API endpoint from your browser against your own running instance, with example requests and live responses.',
  },
} as const;

export type ToolPageKey = keyof typeof TOOL_PAGES;

export function getPageImage(slugs: readonly string[]): PageImage {
  const segments = [...slugs.filter(Boolean), 'image.webp'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export function getToolPageImageUrl(tool: ToolPageKey): string {
  return `/og/tools/${tool}/image.webp`;
}

export function getToolPageSocialMeta(tool: ToolPageKey) {
  const page = TOOL_PAGES[tool];
  return getDocsSocialMeta({
    title: page.documentTitle,
    description: page.description,
    url: getAbsoluteDocsUrl(page.path),
    imageUrl: getAbsoluteDocsUrl(getToolPageImageUrl(tool)),
  });
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
  url,
  imageUrl,
}: Readonly<{
  title: string;
  description?: string;
  /** The page's canonical URL. */
  url: string;
  imageUrl: string;
}>) {
  return [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    { property: 'og:url', content: url },
    { property: 'og:site_name', content: 'open-wa' },
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

export type SchemaCrumb = Readonly<{ name: string; url: string }>;

/**
 * Breadcrumb entries with each URL once. When a URL repeats, the later entry
 * wins, so the page itself always stays last.
 */
export function uniqueCrumbs(crumbs: readonly SchemaCrumb[]): SchemaCrumb[] {
  const seen = new Set<string>();
  const kept: SchemaCrumb[] = [];
  for (const crumb of [...crumbs].reverse()) {
    if (seen.has(crumb.url)) continue;
    seen.add(crumb.url);
    kept.unshift(crumb);
  }
  return kept;
}

/**
 * Structured data for a docs page. Guides, recipes and reference pages are
 * TechArticles by open-wa; section indexes are CollectionPages. Dates are
 * included only when they come from real history.
 */
export function getDocsPageSchema({
  title,
  description,
  url,
  imageUrl,
  breadcrumbs,
  kind,
  dates,
}: Readonly<{
  title: string;
  description?: string;
  url: string;
  imageUrl: string;
  breadcrumbs: readonly SchemaCrumb[];
  kind: 'article' | 'collection';
  dates?: Readonly<{ published: string; modified: string }>;
}>) {
  const crumbs = uniqueCrumbs(breadcrumbs);
  const hasBreadcrumbs = crumbs.length >= 2;
  const shared = {
    url,
    ...(description ? { description } : {}),
    image: imageUrl,
    inLanguage: 'en',
    isPartOf: { '@id': SCHEMA_IDS.website },
    publisher: { '@id': SCHEMA_IDS.organization },
    about: { '@id': SCHEMA_IDS.software },
    ...(dates ? { datePublished: dates.published, dateModified: dates.modified } : {}),
  };
  const page =
    kind === 'collection'
      ? {
          '@type': 'CollectionPage',
          '@id': url,
          name: title,
          ...shared,
          ...(hasBreadcrumbs ? { breadcrumb: { '@id': `${url}#breadcrumbs` } } : {}),
        }
      : {
          '@type': 'TechArticle',
          '@id': `${url}#article`,
          headline: title,
          ...shared,
          author: { '@id': SCHEMA_IDS.organization },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url,
            ...(hasBreadcrumbs ? { breadcrumb: { '@id': `${url}#breadcrumbs` } } : {}),
          },
        };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      page,
      {
        '@type': 'Organization',
        '@id': SCHEMA_IDS.organization,
        name: 'open-wa',
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/logo.png`,
      },
      ...(hasBreadcrumbs
        ? [
            {
              '@type': 'BreadcrumbList',
              '@id': `${url}#breadcrumbs`,
              itemListElement: crumbs.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
                item: crumb.url,
              })),
            },
          ]
        : []),
    ],
  };
}

export function getSlugsFromImagePath(path: string): string[] {
  const parts = path.split('/').filter(Boolean);

  if (parts.at(-1) !== 'image.webp') return [];

  return parts.slice(0, -1);
}
