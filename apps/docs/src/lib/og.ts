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

const DEFAULT_DOCS_ORIGIN = 'https://docs.openwa.dev';

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

export function getSlugsFromImagePath(path: string): string[] {
  const parts = path.split('/').filter(Boolean);

  if (parts.at(-1) !== 'image.webp') return [];

  return parts.slice(0, -1);
}
