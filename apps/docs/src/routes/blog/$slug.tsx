import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ChangelogLayout, ReleaseDate } from '@/components/changelog';
import { EditorialMarkdown } from '@/components/editorial-markdown';
import { publicEditorialImageUrl } from '@/lib/editorial-markdown';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';

function articleCanonical(value: string | null | undefined, path: string) {
  try {
    const url = new URL(value || path, getAbsoluteDocsUrl('/'));
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch { /* Invalid canonical overrides fall back to the public article. */ }
  return getAbsoluteDocsUrl(path);
}

const loadArticle = createServerFn({method:'GET'}).validator((slug:string)=>slug).handler(async ({data:slug}) => {
  const {getEditorialSource} = await import('@/lib/editorial.server');
  const source = await getEditorialSource('posts');
  const page = source.getPage([slug]);
  if (!page) throw notFound();
  return {url:page.url,...page.data,image:publicEditorialImageUrl(page.data.image)};
});
export const Route = createFileRoute('/blog/$slug')({
  loader: ({params}) => loadArticle({data:params.slug}),
  head: ({loaderData:article}) => article ? ({
    meta:[...getDocsSocialMeta({title:article.seo.title || `${article.title} — open-wa`,description:article.seo.description || article.description,imageUrl:getAbsoluteDocsUrl(article.image || getPageImage([]).url)}),{property:'og:type',content:'article'},{name:'author',content:'open-wa'},...(article.publishedAt ? [{property:'article:published_time',content:article.publishedAt}] : []),...(article.seo.robots ? [{name:'robots',content:article.seo.robots}] : [])],
    links:[{rel:'canonical',href:articleCanonical(article.seo.canonical, article.url)}],
  }) : {},
  component: Article,
  notFoundComponent: () => <ChangelogLayout><h1>Article not found</h1><a href="/blog">Browse the blog →</a></ChangelogLayout>,
});
function Article() {
  const article = Route.useLoaderData();
  return <ChangelogLayout><a className="release-back" href="/blog">← All articles</a><article className="release-article"><header className="release-article-header"><div className="release-article-meta"><span>open-wa</span>{article.publishedAt && <ReleaseDate date={article.publishedAt} />}</div><h1>{article.title}</h1><p className="release-description">{article.description}</p>{article.image && <img src={article.image} alt="" className="release-cover" />}</header><EditorialMarkdown body={article.bodyMarkdown} /></article></ChangelogLayout>;
}
