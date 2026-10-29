import { Children, useMemo, type ComponentProps, type ReactElement } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { DocsBody } from 'fumadocs-ui/layouts/notebook/page';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import {
  CodeBlockTabs, CodeBlockTabsList, CodeBlockTabsTrigger, CodeBlockTab,
} from 'fumadocs-ui/components/codeblock';
import { parseEditorialMarkdown } from '@/lib/editorial-markdown';
import type { Root } from 'hast';

const languageNames: Record<string, string> = {
  ts: 'TypeScript', typescript: 'TypeScript', js: 'JavaScript', javascript: 'JavaScript',
  sh: 'Shell', bash: 'Shell', python: 'Python', json: 'JSON', text: 'Text',
};

function EditorialCodeBlock(props: ComponentProps<'pre'> & { 'data-title'?: string }) {
  const code = Children.only(props.children) as ReactElement<ComponentProps<'code'>>;
  if (typeof code.props.children !== 'string') return <pre {...props} />;
  const lang = code.props.className?.split(' ').find(value => value.startsWith('language-'))?.slice(9) ?? 'text';
  return <DynamicCodeBlock
    lang={lang === 'mdx' ? 'md' : lang}
    code={code.props.children}
    codeblock={{ title: props['data-title'] ?? languageNames[lang] ?? lang, className: 'editorial-code-block' }}
  />;
}

function EditorialLink({ href, children, ...props }: ComponentProps<'a'>) {
  // Release films are ordinary CMS links; CMS HTML remains non-executable.
  const releaseFilm = href && /^https:\/\/github\.com\/open-wa\/wa-automate-nodejs\/releases\/download\/[^/]+\/openwa-(?:voxtral|jev)-v2\.mp4$/.test(href);
  if (!releaseFilm) return <a href={href} {...props}>{children}</a>;
  return <span className="my-8 block">
    <video controls playsInline preload="metadata" poster={href!.replace(/\.mp4$/, '-poster.png')}
      aria-label="OpenWA product demonstration" className="aspect-video w-full rounded-xl bg-black">
      <source src={href} type="video/mp4" />
      <a href={href}>{children}</a>
    </video>
    <a href={href} className="mt-2 inline-block text-sm">{children}</a>
  </span>;
}

const components = {
  a: EditorialLink,
  pre: EditorialCodeBlock,
  'editorial-code-tabs': CodeBlockTabs,
  'editorial-code-tabs-list': CodeBlockTabsList,
  'editorial-code-tabs-trigger': CodeBlockTabsTrigger,
  'editorial-code-tab': CodeBlockTab,
};

// CMS content is Markdown data, never executable MDX. Raw HTML is discarded.
export function EditorialMarkdown({body, tree}: {body: string; tree?: Root}) {
  const content = useMemo(() => toJsxRuntime(tree ?? parseEditorialMarkdown(body), {Fragment, jsx, jsxs, components}), [body, tree]);
  return <DocsBody className="release-prose">{content}</DocsBody>;
}
