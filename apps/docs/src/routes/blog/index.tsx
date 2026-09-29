import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ChangelogLayout, ReleaseDate } from '@/components/changelog';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';

const loadArticles = createServerFn({method:'GET'}).handler(async () => {
  const {getEditorialSource} = await import('@/lib/editorial.server');
  const source = await getEditorialSource('posts');
  return source.getPages().map(({url,data}) => ({url,title:data.title,description:data.description,publishedAt:data.publishedAt}))
    .sort((a,b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
});
export const Route = createFileRoute('/blog/')({
  loader: () => loadArticles(),
  head: () => ({meta:getDocsSocialMeta({title:'Blog — open-wa',description:'Practical guides to building with open-wa. WhatsApp automation, maintained since 2019.',imageUrl:getAbsoluteDocsUrl(getPageImage([]).url)}),links:[{rel:'canonical',href:getAbsoluteDocsUrl('/blog')}]}),
  component: Blog,
});
function Blog() {
  const articles = Route.useLoaderData();
  return <ChangelogLayout><header className="changelog-intro"><p className="changelog-eyebrow">WhatsApp automation, maintained since 2019.</p><h1>Build with open-wa.</h1><p>Practical guides, useful examples, and the details that make an integration work.</p></header>
    {articles.length ? articles.map(article => <article className="release-row" key={article.url}><aside className="release-meta">{article.publishedAt && <ReleaseDate date={article.publishedAt} />}<span>open-wa</span></aside><div className="release-card"><h2><a href={article.url}>{article.title}</a></h2><p className="release-description">{article.description}</p><a className="release-read" href={article.url}>Read the guide →</a></div></article>) : <section className="release-card"><h2>New guides are on the way.</h2><p>Start building today with the <a href="/docs/getting-started/quickstart">quickstart</a>, or explore the <a href="/docs">documentation</a>.</p></section>}
  </ChangelogLayout>;
}
