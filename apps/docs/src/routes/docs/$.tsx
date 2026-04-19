import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import * as React from 'react';
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

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
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

function Page() {
  const data = Route.useLoaderData();
  const Content = clientLoader.getComponent(
    data.path,
  ) as unknown as React.ComponentType;
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
              className: 'text-fd-muted-foreground rounded-2xl',
            }),
          )}
        >
          <MessageCircleIcon className="size-4.5" />
          Ask AI
        </AISearchTrigger>
      </AISearch>
      
      <div className="flex gap-2 items-center border-b pb-6 mb-6">
        <MarkdownCopyButton markdownUrl={`${data.path}.mdx`} />
        <ViewOptionsPopover
          markdownUrl={`${data.path}.mdx`}
          githubUrl={`https://github.com/open-wa/v5-shh/blob/main/apps/docs/content/docs/${data.path}`}
        />
      </div>

      <Content />
    </DocsLayout>
  );
}
