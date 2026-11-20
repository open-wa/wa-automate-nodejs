import { createFileRoute } from '@tanstack/react-router';
import { getMascotForPath } from '@/components/mascot-callout';
import { getOgDescription, getSlugsFromImagePath } from '@/lib/og';
import { renderOgCard } from '@/lib/og-card';

export const Route = createFileRoute('/og/docs/$')({
  server: {
    handlers: {
      async GET({
        params,
      }: {
        params: { _splat?: string };
        request: Request;
      }) {
        const { source } = await import('@/lib/source');
        const slugs = getSlugsFromImagePath(params._splat ?? '');
        const page = source.getPage(slugs);

        if (!page) return new Response(undefined, { status: 404 });

        const mascot = getMascotForPath(page.url) ?? getMascotForPath('/docs');

        return renderOgCard({
          title: page.data.title,
          description: getOgDescription(page.data),
          badgeLabel: mascot?.title,
        });
      },
    },
  },
});
