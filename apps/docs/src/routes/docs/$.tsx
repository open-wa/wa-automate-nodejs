import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import browserCollections from 'fumadocs-mdx:collections/browser';
import { DocsBody, DocsPage } from 'fumadocs-ui/layouts/notebook/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { createServerFn } from '@tanstack/react-start';
import type { SerializedPageTree } from 'fumadocs-core/source/client';
import { docsMdxComponents } from '@/components/docs-mdx';
import { DocsHomepage } from '@/components/docs-homepage';
import { FeedbackCard } from '@/components/feedback-card';
import { DocsPageHeader } from '@/components/docs-page-header';
import {
  getAbsoluteDocsUrl,
  getDocsDocumentTitle,
  getDocsPageSchema,
  getDocsSocialMeta,
  getOgDescription,
  getPageImage,
} from '@/lib/og';
import { firstPageUnder, folderCrumbs, type Crumb } from '@/lib/page-tree';
import { NOT_FOUND_TITLE } from '@/lib/site';
import { DocsShell } from './-shell';

const loader = createServerFn({
  method: 'GET',
})
  .validator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const { source } = await import('@/lib/source');

    try {
      const page = source.getPage(slugs);
      if (!page) {
        // A section URL such as /docs/guides with no index page opens its first page.
        const sectionStart = slugs.length > 0 ? firstPageUnder(source.pageTree, `/docs/${slugs.join('/')}`) : undefined;        if (sectionStart) return { redirectTo: sectionStart };
        throw notFound();
      }

      const image = getPageImage(slugs);
      const imageUrl = getAbsoluteDocsUrl(image.url);
      const description = getOgDescription(page.data);
      const canonical = getAbsoluteDocsUrl(page.data.release ? `/changelog/${page.data.release.version}` : page.url);
      const crumbs: Crumb[] = folderCrumbs(source.pageTree, page.url);
      const breadcrumbs = [
        { name: 'Docs', url: getAbsoluteDocsUrl('/docs') },
        ...crumbs.flatMap((crumb) => (crumb.url ? [{ name: crumb.name, url: getAbsoluteDocsUrl(crumb.url) }] : [])),
      ];
      if (slugs.length > 0) breadcrumbs.push({ name: page.data.title, url: canonical });

      return {
        path: page.path,
        canonical,
        crumbs,
        meta: getDocsSocialMeta({
          title: getDocsDocumentTitle(page.data),
          description,
          imageUrl,
        }),
        schema: JSON.stringify(
          getDocsPageSchema({
            title: page.data.title,
            description,
            url: canonical,
            imageUrl,
            breadcrumbs,
          }),
        ),
        pageTree: await source.serializePageTree(source.pageTree),
      };
    } catch (err: unknown) {
      console.error('Docs serverFn Error for slugs', slugs, ':', err);
      throw err;
    }
  });

export const Route = createFileRoute('/docs/$')({
  loader: async ({ params }) => {
    const _splat = params._splat;
    const slugs = _splat ? _splat.split('/').filter(Boolean) : [];
    const data = await loader({ data: slugs });
    if ('redirectTo' in data) throw redirect({ href: data.redirectTo, statusCode: 302 });
    await clientLoader.preload(data.path);
    return data;
  },
  head: ({ loaderData }) => {
    const data = loaderData && 'meta' in loaderData ? loaderData : undefined;
    return {
      meta: data?.meta ?? [{ title: NOT_FOUND_TITLE }],
      links: data?.canonical ? [{ rel: 'canonical', href: data.canonical }] : [],
      scripts: data?.schema ? [{ type: 'application/ld+json', children: data.schema }] : [],
    };
  },
  component: Page,
});

const clientLoader = browserCollections.docs.createClientLoader<{
  pagePath: string;
  crumbs: Crumb[];
}>({
  component({ toc, frontmatter, default: MDX }, { pagePath, crumbs }) {
    const normalizedPagePath = pagePath.replace(/^\/+/, '').replace(/\.mdx$/, '');
    const isCompactClientReference = normalizedPagePath === 'reference/client/client';
    const pageClass = isCompactClientReference ? 'docs-reference-page' : 'docs-guide-page';

    return (
      <DocsPage
        full={isCompactClientReference}
        className={frontmatter.numberedSections ? `${pageClass} docs-numbered-sections` : pageClass}
        toc={isCompactClientReference ? [] : toc.filter((item) => item.depth > 1)}
        tableOfContent={{ enabled: !isCompactClientReference }}
        breadcrumb={{ enabled: false }}
      >
        <DocsPageHeader
          title={frontmatter.title}
          description={frontmatter.description}
          pagePath={pagePath}
          crumbs={crumbs}
        />
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

type DocsLoaderData = {
  path: string;
  crumbs: Crumb[];
  meta: ReturnType<typeof getDocsSocialMeta>;
  pageTree: SerializedPageTree;
};

function Page() {
  const data = Route.useLoaderData() as DocsLoaderData;
  const Content = clientLoader.getComponent(data.path);

  return (
    <DocsShell loaderData={data}>
      {data.path.replace(/\.mdx$/, '') === 'index' ? (
        <DocsPage
          full
          tableOfContent={{ enabled: false }}
          breadcrumb={{ enabled: false }}
          footer={{ enabled: false }}
          className="docs-hub-page"
        >
          <DocsHomepage />
        </DocsPage>
      ) : (
        <Content pagePath={data.path} crumbs={data.crumbs} />
      )}
    </DocsShell>
  );
}
