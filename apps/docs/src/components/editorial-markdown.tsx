import { useMemo } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { DocsBody } from 'fumadocs-ui/layouts/notebook/page';
import { parseEditorialMarkdown } from '@/lib/editorial-markdown';

// CMS content is Markdown data, never executable MDX. Raw HTML is discarded.
export function EditorialMarkdown({body}: {body: string}) {
  const content = useMemo(() => toJsxRuntime(parseEditorialMarkdown(body), {Fragment, jsx, jsxs}), [body]);
  return <DocsBody className="release-prose">{content}</DocsBody>;
}
