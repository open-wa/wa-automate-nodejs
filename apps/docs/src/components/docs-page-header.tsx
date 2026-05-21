import {
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { MarkdownCopyButton, ViewOptionsPopover } from '@/components/ai/page-actions';
import { getMascotForPath } from '@/components/mascot-callout';
import { cn } from '@/lib/cn';

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
  const docsUrlPath = `/docs/${pagePath.replace(/\/$/, '')}`.replace(/\.mdx$/, '');
  const mascot = getMascotForPath(docsUrlPath);

  return (
    <header className="relative mb-8 overflow-hidden rounded-3xl border-backstitch bg-card p-6 shadow-stipple sm:p-8 lg:p-10">
      <div className="absolute inset-0 bg-dither opacity-[0.12] pointer-events-none" />
      <div
        className={cn(
          'relative z-10 grid gap-8',
          mascot ? 'lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:items-center' : undefined,
        )}
      >
        <div className="min-w-0 space-y-7">
          <div className="space-y-4 sm:space-y-5">
            <DocsTitle className="font-display text-balance text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </DocsTitle>
            {description ? (
              <DocsDescription className="!mb-0 max-w-3xl text-pretty text-base leading-7 text-muted-foreground font-medium sm:text-lg">
                {description}
              </DocsDescription>
            ) : null}
          </div>
          <PageActions pagePath={pagePath} />
        </div>

        {mascot ? (
          <div className="flex justify-center lg:justify-end">
            <figure className="relative size-44 overflow-hidden rounded-full border-backstitch bg-background p-2 shadow-stipple sm:size-52 lg:size-64">
              <div className="absolute inset-0 bg-dither opacity-[0.18] pointer-events-none" />
              <img
                src={mascot.src}
                alt={mascot.title}
                className="relative z-10 size-full rounded-full object-cover"
              />
            </figure>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function PageActions({ pagePath }: Readonly<{ pagePath: string }>) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <MarkdownCopyButton markdownUrl={`${pagePath}.mdx`} />
      <ViewOptionsPopover
        markdownUrl={`${pagePath}.mdx`}
        githubUrl={`https://github.com/open-wa/v5-shh/blob/main/apps/docs/content/docs/${pagePath}`}
      />
    </div>
  );
}
