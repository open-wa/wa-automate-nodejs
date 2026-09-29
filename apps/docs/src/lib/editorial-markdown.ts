import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';

const markdown = remark().use(remarkGfm).use(remarkRehype);
const mediaPrefix = '/_emdash/api/media/file/';
const publicMediaPrefix = '/api/editorial-media/';

function safeUrl(value: unknown, image: boolean): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value, 'https://openwa.dev');
    if (image && url.pathname.startsWith(mediaPrefix) && ['https://openwa.dev', 'https://cms.openwa.dev'].includes(url.origin)) {
      return `${publicMediaPrefix}${url.pathname.slice(mediaPrefix.length)}`;
    }
    return ['http:', 'https:', ...(!image ? ['mailto:', 'tel:'] : [])].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
}

export function publicEditorialImageUrl(value: unknown) {
  return safeUrl(value, true);
}

// Both rendering and media access use resolved Markdown, including reference images.
export function parseEditorialMarkdown(body: string) {
  const tree = markdown.runSync(markdown.parse(body));
  visit(tree, 'element', node => {
    if (node.properties.href) node.properties.href = safeUrl(node.properties.href, false);
    if (node.properties.src) node.properties.src = publicEditorialImageUrl(node.properties.src);
  });
  return tree;
}

export function referencedEditorialMedia(body: string, cover: string | null) {
  const paths = new Set<string>();
  function collect(value: unknown) {
    const src = publicEditorialImageUrl(value);
    if (src?.startsWith(publicMediaPrefix)) paths.add(`${mediaPrefix}${src.slice(publicMediaPrefix.length)}`);
  }
  collect(cover);
  visit(parseEditorialMarkdown(body), 'element', node => {
    if (node.tagName === 'img') collect(node.properties.src);
  });
  return paths;
}
