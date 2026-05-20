import { createFileRoute, notFound } from '@tanstack/react-router';
import { Banner } from 'fumadocs-ui/components/banner';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
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
import { DocsHomepage } from '@/components/docs-homepage';
import { FeedbackCard } from '@/components/feedback-card';
import { MascotCallout } from '@/components/mascot-callout';
import { DOCS_PATHS, GENERIC_LICENSE_URL, REPO_URL } from '@/lib/site';

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
        <MascotCallout onlyMapped className="mb-8" />
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

const docsTabs: LayoutTab[] = [
  {
    title: 'Quick Start',
    description: 'Run the Easy API and send the first message.',
    url: DOCS_PATHS.quickstart,
  },
  {
    title: 'Node.js',
    description: 'Embed the runtime with createClient.',
    url: DOCS_PATHS.customCode,
  },
  {
    title: 'Docker',
    description: 'Run the API in a container.',
    url: '/docs/getting-started/docker',
  },
  {
    title: 'Client API',
    description: 'Look up generated client methods.',
    url: DOCS_PATHS.referenceClient,
  },
  {
    title: 'Licensing',
    description: 'Check gated features and purchase paths.',
    url: DOCS_PATHS.licensedFeatures,
  },
  {
    title: 'Get a License',
    description: 'Open the license purchase flow.',
    url: GENERIC_LICENSE_URL,
    props: {
      target: '_blank',
      rel: 'noreferrer',
    },
  },
  {
    title: 'GitHub',
    description: 'View the source repository.',
    url: REPO_URL,
    props: {
      target: '_blank',
      rel: 'noreferrer',
    },
  },
  {
    title: 'Discord',
    description: 'Join the community server.',
    url: 'https://discord.gg/dpan7EYE3t',
    props: {
      target: '_blank',
      rel: 'noreferrer',
    },
  },
  {
    title: 'Twitter',
    description: 'Follow open-wa updates.',
    url: 'https://twitter.com/openwadev',
    props: {
      target: '_blank',
      rel: 'noreferrer',
    },
  },
];

function PageActions({ pagePath }: { pagePath: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border-backstitch bg-card p-4 shadow-stipple sm:flex-row sm:items-center sm:justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-dither opacity-[0.08] pointer-events-none" />
      <div className="min-w-0 z-10">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Page actions
        </p>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Copy source or open this page in your preferred AI workspace.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end z-10">
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
  const layoutOptions = baseOptions();

  return (
    <>
      <Banner id="open-wa-v5-alpha">
        open-wa v5 is alpha. Use v4.76.0 for mature production systems unless you are validating v5.
      </Banner>
      <DocsLayout
        {...layoutOptions}
        tree={pageTree}
        tabs={docsTabs}
        tabMode="top"
      >
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

      {data.path === 'index' ? (
        <DocsHomepage />
      ) : (
        <Content pagePath={data.path} />
      )}
      </DocsLayout>
    </>
  );
}
