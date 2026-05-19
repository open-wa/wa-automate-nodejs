import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import browserCollections from 'fumadocs-mdx:collections/browser';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { baseOptions } from '@/lib/layout.shared';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { docsMdxComponents } from '@/components/docs-mdx';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { MessageCircleIcon } from 'lucide-react';
import { MarkdownCopyButton, ViewOptionsPopover } from '@/components/ai/page-actions';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { cn } from '@/lib/cn';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';

const loader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  // @ts-expect-error Types mismatch due to TanStack versions
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slugs }) => {
    try {
      const page = source.getPage(slugs);
      if (!page) throw notFound();

      return {
        path: page.path,
        pageTree: await source.serializePageTree(source.pageTree),
      };
    } catch (err: any) {
      console.error("Docs serverFn Error for slugs", slugs, ":", err);
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
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <PageActions pagePath={pagePath} />
        <DocsBody className="pb-20 sm:pb-0">
          <MDX
            components={{
              ...defaultMdxComponents,
              ...docsMdxComponents,
            }}
          />
        </DocsBody>
      </DocsPage>
    );
  },
});

function PageActions({ pagePath }: { pagePath: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-3xl border border-fd-border bg-fd-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-primary">
          Page actions
        </p>
        <p className="mt-1 text-sm text-fd-muted-foreground">
          Copy source or open this page in your preferred AI workspace.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <MarkdownCopyButton markdownUrl={`${pagePath}.mdx`} />
        <ViewOptionsPopover
          markdownUrl={`${pagePath}.mdx`}
          githubUrl={`https://github.com/open-wa/v5-shh/blob/main/apps/docs/content/docs/${pagePath}`}
        />
      </div>
    </div>
  );
}

function Page() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(data.path);
  const { pageTree } = useFumadocsLoader(data);

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <AISearch>
        <AISearchPanel />
        <AISearchTrigger
          position="float"
          className={cn(
            buttonVariants({
              variant: 'secondary',
              className:
                'min-h-11 rounded-2xl border-fd-border bg-fd-card text-fd-foreground shadow-lg hover:bg-fd-accent',
            }),
          )}
        >
          <MessageCircleIcon className="size-4.5" />
          Ask AI
        </AISearchTrigger>
      </AISearch>

      <Content pagePath={data.path} />
    </DocsLayout>
  );
}
