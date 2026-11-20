import { createFileRoute } from '@tanstack/react-router';
import { getMascotForPath } from '@/components/mascot-callout';
import { getSlugsFromImagePath, TOOL_PAGES, type ToolPageKey } from '@/lib/og';
import { renderOgCard } from '@/lib/og-card';

/** Social cards for the tools outside the docs tree, such as /new/ and /api-explorer/. */
export const Route = createFileRoute('/og/tools/$')({
  server: {
    handlers: {
      async GET({ params }: { params: { _splat?: string }; request: Request }) {
        const [key, ...rest] = getSlugsFromImagePath(params._splat ?? '');
        if (!key || rest.length > 0 || !Object.hasOwn(TOOL_PAGES, key)) {
          return new Response(undefined, { status: 404 });
        }
        const tool = TOOL_PAGES[key as ToolPageKey];

        return renderOgCard({
          title: tool.title,
          description: tool.description,
          badgeLabel: getMascotForPath('/docs')?.title,
        });
      },
    },
  },
});
