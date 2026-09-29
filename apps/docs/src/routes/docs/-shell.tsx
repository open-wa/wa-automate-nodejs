import type { ReactNode } from 'react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { type SerializedPageTree, useFumadocsLoader } from 'fumadocs-core/source/client';
import { MessageCircleIcon } from 'lucide-react';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { DocsTopBar } from '@/components/docs-top-bar';
import { baseOptions } from '@/lib/layout.shared';
import { cn } from '@/lib/cn';

type DocsShellData = {
  pageTree: SerializedPageTree;
};

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
      <DocsLayout
        {...layoutOptions}
        nav={{ ...layoutOptions.nav, mode: 'top', component: <DocsTopBar /> }}
        sidebar={{ defaultOpenLevel: 0 }}
        tree={pageTree}
      >
        <AISearch>
          <AISearchPanel />
          <AISearchTrigger
            position="float"
            className={cn(
              buttonVariants({
                variant: 'secondary',
                className:
                  'min-h-11 rounded-2xl border-backstitch bg-card text-foreground shadow-stipple hover:bg-accent',
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
