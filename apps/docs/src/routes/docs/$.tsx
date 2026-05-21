import { createFileRoute, notFound } from '@tanstack/react-router';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/notebook/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { createServerFn } from '@tanstack/react-start';
import { docsMdxComponents } from '@/components/docs-mdx';
import { DocsHomepage } from '@/components/docs-homepage';
import { FeedbackCard } from '@/components/feedback-card';
import { DocsPageHeader } from '@/components/docs-page-header';
import { DocsShell } from './-shell';
import { source } from '@/lib/source';

const loader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    try {
      const page = source.getPage(slugs);
      if (!page) throw notFound();

      return {
        path: page.path,
        pageTree: await source.serializePageTree(source.pageTree),
      };
    } catch (err: unknown) {
      console.error('Docs serverFn Error for slugs', slugs, ':', err);
      throw err;
    }
  });

export const Route = createFileRoute('/docs/$')({
  component: Page,
  loader: async ({ params }) => {
    const _splat = params._splat;
    const slugs = _splat ? _splat.split('/') : [];
    const data = await loader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const clientLoader = browserCollections.docs.createClientLoader<{
  pagePath: string;
}>({
  component({ toc, frontmatter, default: MDX }, { pagePath }) {
    return (
      <DocsPage toc={toc} breadcrumb={{ enabled: false }}>
        <DocsPageHeader title={frontmatter.title} description={frontmatter.description} pagePath={pagePath} />
        <DocsBody className="pb-20 sm:pb-0">
          <MDX
            components={{
              ...defaultMdxComponents,
              ...docsMdxComponents,
            }}
          />
          <FeedbackCard />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(data.path);

  return (
    <DocsShell loaderData={data}>
      {data.path === 'index' ? (
        <DocsHomepage />
      ) : (
        <Content pagePath={data.path} />
      )}
    </DocsShell>
  );
}
