import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { DocsBody } from 'fumadocs-ui/layouts/notebook/page';
import { EditorialMarkdown } from '@/components/editorial-markdown';
import { docsMdxComponents } from '@/components/docs-mdx';
import { ChangelogLayout, ReleaseArticle } from '@/components/changelog';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';

const loadRelease = createServerFn({ method: 'GET' })
  .validator((version: string) => version)
  .handler(async ({ data: version }) => {
    const { getChangelog } = await import('@/lib/changelog.server');
    const entry = (await getChangelog()).find(entry => entry.version === version);
    if (!entry) throw notFound();
    return entry;
  });

const articleLoader = browserCollections.docs.createClientLoader({
  component({ default: MDX }) {
    return <DocsBody className="release-prose"><MDX components={docsMdxComponents} /></DocsBody>;
  },
});

export const Route = createFileRoute('/changelog/$version')({
  loader: async ({ params }) => {
    const entry = await loadRelease({ data: params.version });
    if (entry.bodyMarkdown === undefined) await articleLoader.preload(entry.path);
    return entry;
  },
  head: ({ loaderData: entry }) => entry ? ({
    meta: [
      ...getDocsSocialMeta({
        title: `${entry.headline} — open-wa ${entry.version}`,
        description: entry.description,
        imageUrl: getAbsoluteDocsUrl(entry.image ?? getPageImage(['releases', `v${entry.version.split('.').slice(0, 2).join('.')}`]).url),
      }),
      { property: 'og:type', content: 'article' },
      { property: 'article:published_time', content: entry.date },
    ],
    links: [{ rel: 'canonical', href: getAbsoluteDocsUrl(entry.url) }],
  }) : {},
  component: Release,
  notFoundComponent: () => <ChangelogLayout><h1>Release not found</h1><a href="/changelog">Browse the changelog →</a></ChangelogLayout>,
});

function Release() {
  const entry = Route.useLoaderData();
  if (entry.bodyMarkdown !== undefined) return <ChangelogLayout><ReleaseArticle entry={entry}><EditorialMarkdown body={entry.bodyMarkdown} /></ReleaseArticle></ChangelogLayout>;
  const Content = articleLoader.getComponent(entry.path);
  return <ChangelogLayout><ReleaseArticle entry={entry}><Content /></ReleaseArticle></ChangelogLayout>;
}
