import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';
import { editorialHeadings, parseEditorialMarkdown } from '@/lib/editorial-markdown';
import { EditorialMarkdown } from '@/components/editorial-markdown';
import { ReleaseDate } from '@/components/changelog';
import type { EditorialEntry } from '@/lib/editorial.server';

export function BlogLayout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions()} className="blog-site"><div className="blog-shell">{children}</div></HomeLayout>;
}

type BlogArticleData = Pick<EditorialEntry, 'slug' | 'title' | 'description' | 'publishedAt' | 'bodyMarkdown' | 'image'>;

export function BlogArticle({ article }: { article: BlogArticleData }) {
  const tree = useMemo(() => parseEditorialMarkdown(article.bodyMarkdown), [article.bodyMarkdown]);
  const headings = useMemo(() => editorialHeadings(tree), [tree]);
  const [active, setActive] = useState(headings[0]?.id ?? '');
  const [title, ...detail] = article.title.split(': ');
  const isCallsArticle = article.slug === 'whatsapp-audio-calls-openwa';
  const hasCover = Boolean(article.image) || isCallsArticle;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-90px 0px -65% 0px' });
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings]);

  return <>
    <a className="blog-back" href="/blog"><ArrowLeft size={14} /> All articles</a>
    <article className="blog-article">
      <header className={`blog-article-header ${hasCover ? 'blog-header-with-cover' : ''}`}>
        <div>
          <div className="blog-byline"><span>OpenWA team</span>{article.publishedAt && <><span aria-hidden="true">·</span><ReleaseDate date={article.publishedAt} /></>}</div>
          <h1>{title}{detail.length > 0 && <><span className="sr-only">: </span><span className="blog-title-detail">{detail.join(': ')}</span></>}</h1>
          <p className="blog-description">{article.description}</p>
        </div>
        {article.image ? <figure className="blog-cover"><img src={article.image} alt={article.title} /></figure> : isCallsArticle ? <AudioFlowFigure /> : null}
      </header>
      <div className="blog-article-body">
        <div className="blog-reading"><EditorialMarkdown body={article.bodyMarkdown} tree={tree} /></div>
        {headings.length > 0 && <nav className="blog-contents" aria-label="On this page"><h2>On this page</h2><ol>{headings.map(heading => <li key={heading.id} data-depth={heading.depth}><a href={`#${heading.id}`} aria-current={active === heading.id ? 'location' : undefined}>{heading.title}</a></li>)}</ol></nav>}
      </div>
      <footer className="blog-article-footer"><a href="/blog"><ArrowLeft size={15} /> All articles</a><a href="/docs">Continue in the docs <ArrowRight size={15} /></a></footer>
    </article>
  </>;
}

function AudioFlowFigure() {
  return <figure className="blog-audio-figure">
    <svg viewBox="0 0 400 278" role="img" aria-label="A file or audio stream feeds a WhatsApp audio call. Received audio can be recorded or streamed.">
      <defs><pattern id="blog-audio-grid" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".18" /></pattern></defs>
      <rect width="400" height="278" fill="url(#blog-audio-grid)" />
      <g className="audio-connections" fill="none" stroke="currentColor"><path d="M40 70H140L166 103M40 209H140L166 176M237 139H350" /><path d="M18 18h8m-4-4v8M374 18h8m-4-4v8M18 260h8m-4-4v8M374 260h8m-4-4v8" /></g>
      <g fill="currentColor"><circle cx="40" cy="70" r="3" /><circle cx="40" cy="209" r="3" /><circle cx="350" cy="139" r="3" /></g>
      <rect className="audio-call-node" x="142" y="99" width="118" height="80" rx="9" />
      <path className="audio-call-icon" d="M192 116c-5 0-11 5-11 11 0 10 10 22 20 28 8 5 15 1 16-4l-8-8c-2-2-5 2-7 2-4-2-10-8-12-13 0-2 4-5 3-7l-1-9Z" />
      <text x="39" y="53">FILE / URL</text><text x="39" y="235">AUDIO STREAM</text><text x="280" y="122">RECORD / STREAM</text><text x="201" y="197" textAnchor="middle" className="audio-call-label">WhatsApp audio</text>
      <g className="audio-waveform">{Array.from({ length: 41 }, (_, index) => {
        const height = 1 + Math.abs(Math.sin(index * .91) * Math.cos(index * .22)) * 11;
        return <line key={index} x1={98 + index * 5} x2={98 + index * 5} y1={250 - height} y2={250 + height} />;
      })}</g>
    </svg><figcaption><span>Fig. 01</span><span>Audio in, audio out.</span></figcaption>
  </figure>;
}

type BlogSummary = Pick<EditorialEntry, 'title' | 'description' | 'publishedAt' | 'image'> & { url: string };

export function BlogIndex({ articles }: { articles: BlogSummary[] }) {
  return <>
    <header className="blog-index-header"><p>WhatsApp automation, maintained since 2019.</p><h1>Build with open-wa.</h1><p>Practical guides, useful examples, and the details that make an integration work.</p></header>
    {articles.length ? <div className="blog-index-list">{articles.map(article => <article className={`blog-index-row ${article.image ? 'blog-row-with-cover' : ''}`} key={article.url}><div>{article.publishedAt && <div className="blog-byline"><ReleaseDate date={article.publishedAt} /><span aria-hidden="true">·</span><span>OpenWA team</span></div>}<h2><a href={article.url}>{article.title}</a></h2><p>{article.description}</p><a className="blog-read" href={article.url}>Read the article <ArrowRight size={15} /></a></div>{article.image && <a className="blog-index-cover" href={article.url} tabIndex={-1} aria-hidden="true"><img src={article.image} alt={article.title} loading="lazy" /></a>}</article>)}</div> : <section className="blog-empty"><h2>New guides are on the way.</h2><p>Start with the <a href="/docs/getting-started/quickstart">quickstart</a> or browse the <a href="/docs">documentation</a>.</p></section>}
  </>;
}
