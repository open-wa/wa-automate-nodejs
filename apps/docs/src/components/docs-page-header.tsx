import { DocsDescription, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import {
  MarkdownCopyButton,
  ViewOptionsPopover,
} from '@/components/ai/page-actions';

type DocsPageHeaderProps = Readonly<{
  title: string;
  description?: string;
  pagePath: string;
}>;

export function DocsPageHeader({
  title,
  description,
  pagePath,
}: DocsPageHeaderProps) {
  const docsUrlPath = getDocsUrlPath(pagePath);
  const reference = docsUrlPath.startsWith('/docs/reference');
  return (
    <header className="docs-page-header">
      <div className="docs-page-meta">
        <span><a href="/docs">Docs</a><span aria-hidden="true"> / </span>{reference ? 'API reference' : title}</span>
        <PageActions pagePath={pagePath} />
      </div>
      <div className="docs-page-heading">
        <DocsTitle>{title}</DocsTitle>
        {description ? <DocsDescription>{description}</DocsDescription> : null}
      </div>
    </header>
  );
}

function PageActions({ pagePath }: Readonly<{ pagePath: string }>) {
  const docsUrlPath = getDocsUrlPath(pagePath);
  const markdownUrl =
    docsUrlPath === '/docs' ? '/llms.mdx/docs/' : `/llms.mdx${docsUrlPath}`;

  return (
    <div className="docs-page-header-actions flex flex-wrap items-center gap-2">
      <MarkdownCopyButton
        markdownUrl={markdownUrl}
        className="min-h-9 w-auto px-2.5 text-xs sm:min-h-10 sm:px-3 sm:text-sm"
      />
      <ViewOptionsPopover
        markdownUrl={markdownUrl}
        githubUrl={`https://github.com/open-wa/wa-automate-nodejs/edit/master/${getSourcePath(pagePath)}`}
        className="min-h-9 w-auto px-2.5 text-xs sm:min-h-10 sm:px-3 sm:text-sm"
      >
        Page options
      </ViewOptionsPopover>
    </div>
  );
}

function getSourcePath(pagePath: string) {
  const normalized = pagePath.replace(/^\/+/, '').replace(/\.mdx$/, '');
  const workspacePage = normalized.match(
    /^reference\/workspaces\/(apps|packages|integrations)\/([^/]+)$/,
  );

  if (workspacePage && workspacePage[2] !== 'index') {
    return `${workspacePage[1]}/${workspacePage[2]}/README.md`;
  }

  if (
    normalized === 'reference/workspaces' ||
    normalized.startsWith('reference/workspaces/apps') ||
    normalized.startsWith('reference/workspaces/packages') ||
    normalized.startsWith('reference/workspaces/integrations')
  ) {
    return 'apps/docs/scripts/gen-workspace-readme-docs.js';
  }

  if (normalized.startsWith('reference/client')) {
    return 'packages/schema/scripts/gen-client-reference-docs.ts';
  }

  return `apps/docs/content/docs/${normalized || 'index'}.mdx`;
}

function getDocsUrlPath(pagePath: string) {
  const routePath = pagePath
    .replace(/\/$/, '')
    .replace(/\.mdx$/, '')
    .replace(/\/index$/, '');

  return routePath === 'index' || routePath.length === 0
    ? '/docs'
    : `/docs/${routePath}`;
}
