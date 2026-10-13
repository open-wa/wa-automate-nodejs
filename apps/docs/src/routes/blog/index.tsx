import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { BlogIndex, BlogLayout } from '@/components/blog';
import { publicEditorialImageUrl } from '@/lib/editorial-markdown';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';

const loadArticles = createServerFn({method:'GET'}).handler(async () => {
  const {getEditorialSource} = await import('@/lib/editorial.server');
  const source = await getEditorialSource('posts');
  return source.getPages().map(({url,data}) => ({url,title:data.title,description:data.description,publishedAt:data.publishedAt,image:publicEditorialImageUrl(data.image) ?? null}))
    .sort((a,b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
});
export const Route = createFileRoute('/blog/')({
  loader: () => loadArticles(),
  head: () => ({meta:getDocsSocialMeta({title:'Blog — open-wa',description:'Practical guides to building with open-wa. WhatsApp automation, maintained since 2019.',imageUrl:getAbsoluteDocsUrl(getPageImage([]).url)}),links:[{rel:'canonical',href:getAbsoluteDocsUrl('/blog')}]}),
  component: Blog,
});
function Blog() {
  const articles = Route.useLoaderData();
  return <BlogLayout><BlogIndex articles={articles} /></BlogLayout>;
}
