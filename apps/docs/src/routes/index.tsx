import { createFileRoute } from '@tanstack/react-router';
import { DocsHomepage } from '@/components/homepage';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';
import { SITE_NAME } from '@/lib/site';

export const Route = createFileRoute('/')({
  head: () => ({
    // Default social card for the homepage (a non-docs route with no per-page
    // metadata). Reuses the docs-root OG image so shares of "/" unfurl with the
    // brand card instead of nothing.
    meta: getDocsSocialMeta({
      title: SITE_NAME,
      description:
        'Self-hosted WhatsApp automation. Send messages, receive events, and connect your application through HTTP or Node.js.',
      imageUrl: getAbsoluteDocsUrl(getPageImage([]).url),
    }),
  }),
  component: Home,
});

function Home() {
  return <DocsHomepage />;
}
