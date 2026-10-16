import { createFileRoute } from '@tanstack/react-router';
import { DocsHomepage } from '@/components/homepage';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';
import { HOMEPAGE_DESCRIPTION, HOMEPAGE_SCHEMA, HOMEPAGE_TITLE } from '@/lib/homepage';

export const Route = createFileRoute('/')({
  head: () => ({
    links: [{ rel: 'canonical', href: getAbsoluteDocsUrl('/') }],
    // Default social card for the homepage (a non-docs route with no per-page
    // metadata). Reuses the docs-root OG image so shares of "/" unfurl with the
    // brand card instead of nothing.
    meta: [...getDocsSocialMeta({
      title: HOMEPAGE_TITLE,
      description: HOMEPAGE_DESCRIPTION,
      imageUrl: getAbsoluteDocsUrl(getPageImage([]).url),
    }), { 'script:ld+json': HOMEPAGE_SCHEMA }],
  }),
  component: Home,
});

function Home() {
  return <DocsHomepage />;
}
