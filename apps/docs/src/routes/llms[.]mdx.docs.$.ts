import { createFileRoute, notFound } from '@tanstack/react-router';
import { source } from '@/lib/source';
import { getLLMText } from '@/lib/get-llm-text';

function getPageSlugs(splat: string | undefined) {
  const slugs = splat?.split('/').filter(Boolean) ?? [];
  const last = slugs.at(-1);

  if (last) {
    slugs[slugs.length - 1] = last.replace(/\.mdx$/, '');
  }

  if (slugs.at(-1) === 'index') {
    slugs.pop();
  }

  return slugs;
}

export const Route = createFileRoute('/llms.mdx/docs/$')({
  server: {
    handlers: {
      GET: async ({ params }: { params: { _splat?: string } }) => {
        const slugs = getPageSlugs(params._splat);
        const page = source.getPage(slugs);
        if (!page) throw notFound();

        return new Response(await getLLMText(page), {
          headers: {
            'Content-Type': 'text/markdown',
          },
        });
      },
    },
  },
});
