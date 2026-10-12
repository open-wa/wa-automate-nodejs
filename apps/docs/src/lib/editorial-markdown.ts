import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import { visit } from 'unist-util-visit';
import { remarkCodeTab } from 'fumadocs-core/mdx-plugins/remark-code-tab';
import { parseCodeBlockAttributes } from 'fumadocs-core/mdx-plugins/codeblock-utils';
import type { Element } from 'hast';

const tabElements: Record<string, string> = {
  CodeBlockTabs: 'editorial-code-tabs',
  CodeBlockTabsList: 'editorial-code-tabs-list',
  CodeBlockTabsTrigger: 'editorial-code-tabs-trigger',
  CodeBlockTab: 'editorial-code-tab',
};

const markdown = remark().use(remarkGfm).use(remarkCodeTab).use(remarkRehype, {
  handlers: {
    // Only remarkCodeTab creates these nodes. CMS HTML and MDX are never parsed.
    mdxJsxFlowElement(state, node) {
      const tab = node as typeof node & {
        name: string;
        attributes: { type: string; name: string; value: unknown }[];
      };
      const tagName = tabElements[tab.name];
      if (!tagName) return undefined;
      const properties: Element['properties'] = {};
      for (const attribute of tab.attributes) {
        if (attribute.type !== 'mdxJsxAttribute') continue;
        if (['defaultValue', 'groupId', 'value'].includes(attribute.name) && typeof attribute.value === 'string') {
          properties[attribute.name] = attribute.value;
        } else if (attribute.name === 'persist' && attribute.value === null) {
          properties.persist = true;
        }
      }
      return { type: 'element', tagName, properties, children: state.all(node) };
    },
    code(_state, node) {
      const { attributes } = parseCodeBlockAttributes(node.meta ?? '', ['title']);
      return {
        type: 'element', tagName: 'pre',
        properties: typeof attributes.title === 'string' ? { 'data-title': attributes.title } : {},
        children: [{
          type: 'element', tagName: 'code',
          properties: node.lang ? { className: [`language-${node.lang}`] } : {},
          children: [{ type: 'text', value: node.value }],
        }],
      };
    },
  },
});
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
