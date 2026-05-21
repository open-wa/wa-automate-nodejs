import type { ReactNode } from 'react';
import { Banner } from 'fumadocs-ui/components/banner';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { type SerializedPageTree, useFumadocsLoader } from 'fumadocs-core/source/client';
import { MessageCircleIcon } from 'lucide-react';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { baseOptions } from '@/lib/layout.shared';
import { cn } from '@/lib/cn';
import { DOCS_PATHS, GENERIC_LICENSE_URL, REPO_URL } from '@/lib/site';

type DocsShellData = {
  pageTree: SerializedPageTree;
};

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
    title: 'API Explorer',
    description: 'Try Easy API methods against a running instance.',
    url: DOCS_PATHS.apiExplorer,
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

export function DocsShell({
  loaderData,
  children,
}: {
  loaderData: DocsShellData;
  children: ReactNode;
}) {
  const { pageTree } = useFumadocsLoader(loaderData);
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
        tabMode="navbar"
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

        {children}
      </DocsLayout>
    </>
  );
}
