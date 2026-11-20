import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { type SerializedPageTree, useFumadocsLoader } from 'fumadocs-core/source/client';
import { AISearch, AISearchPanel } from '@/components/ai/search';
import { DocsTopBar } from '@/components/docs-top-bar';
import { baseOptions } from '@/lib/layout.shared';

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
    <AISearch>
      <DocsLayout
        {...layoutOptions}
        containerProps={{ className: 'docs-site' }}
        nav={{ ...layoutOptions.nav, mode: 'top', component: <DocsTopBar /> }}
        sidebar={{ defaultOpenLevel: 0 }}
        tree={pageTree}
      >
        <AISearchPanel />
        {children}
      </DocsLayout>
    </AISearch>
  );
}
