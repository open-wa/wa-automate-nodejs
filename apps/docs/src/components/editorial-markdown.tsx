import { useMemo } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { visit } from 'unist-util-visit';
import { DocsBody } from 'fumadocs-ui/layouts/notebook/page';

const markdown = remark().use(remarkGfm).use(remarkRehype);
function safeUrl(value: unknown, image: boolean) {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value, 'https://openwa.dev');
    if (image && url.pathname.startsWith('/_emdash/api/media/file/') && ['https://openwa.dev','https://cms.openwa.dev'].includes(url.origin)) {
      return `/api/editorial-media/${url.pathname.slice('/_emdash/api/media/file/'.length)}`;
    }
    return ['http:', 'https:', ...(!image ? ['mailto:', 'tel:'] : [])].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
}

// CMS content is Markdown data, never executable MDX. Raw HTML is discarded.
export function EditorialMarkdown({body}: {body: string}) {
  const content = useMemo(() => {
    const tree = markdown.runSync(markdown.parse(body));
    visit(tree, 'element', node => {
      if (node.properties.href) node.properties.href = safeUrl(node.properties.href, false);
      if (node.properties.src) node.properties.src = safeUrl(node.properties.src, true);
    });
    return toJsxRuntime(tree, {Fragment, jsx, jsxs});
  }, [body]);
  return <DocsBody className="release-prose">{content}</DocsBody>;
}
