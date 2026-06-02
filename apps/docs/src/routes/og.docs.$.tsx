import { extractResourceUrls, fetchResources } from '@takumi-rs/helpers';
import { fromJsx } from '@takumi-rs/helpers/jsx';
import initWasm, { Renderer } from '@takumi-rs/wasm';
import wasmModule from '@takumi-rs/wasm/auto';
import { createFileRoute } from '@tanstack/react-router';
import { getMascotForPath } from '@/components/mascot-callout';
import { getOgDescription, getSlugsFromImagePath } from '@/lib/og';
import { SITE_NAME } from '@/lib/site';

let rendererPromise: Promise<Renderer> | undefined;

async function getRenderer() {
  rendererPromise ??= initWasm({ module_or_path: wasmModule }).then(
    () => new Renderer(),
  );
  return rendererPromise;
}

export const Route = createFileRoute('/og/docs/$')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      async GET({
        params,
        request,
      }: {
        params: { _splat?: string };
        request: Request;
      }) {
        const { source } = await import('@/lib/source');
        const slugs = getSlugsFromImagePath(params._splat ?? '');
        const page = source.getPage(slugs);

        if (!page) return new Response(undefined, { status: 404 });

        const mascot = getMascotForPath(page.url) ?? getMascotForPath('/docs');
        const mascotUrl = mascot
          ? new URL(mascot.src, request.url).toString()
          : undefined;
        const description = getOgDescription(page.data);

        const { node, stylesheets } = await fromJsx(
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f7f1df',
              padding: 56,
              fontFamily: 'Geist',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                gap: 44,
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '4px solid #211a14',
                borderRadius: 44,
                background: '#fffaf0',
                boxShadow: '14px 14px 0 #211a14',
                padding: 56,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 26,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignSelf: 'flex-start',
                    border: '3px solid #211a14',
                    borderRadius: 999,
                    background: '#f2d06b',
                    padding: '12px 22px',
                    color: '#211a14',
                    fontSize: 26,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                  }}
                >
                  {SITE_NAME}
                </div>
                <div
                  style={{
                    color: '#211a14',
                    fontSize: 72,
                    fontWeight: 900,
                    lineHeight: 0.95,
                    letterSpacing: -2.4,
                  }}
                >
                  {page.data.title}
                </div>
                {description ? (
                  <div
                    style={{
                      color: '#5f5044',
                      fontSize: 34,
                      fontWeight: 650,
                      lineHeight: 1.25,
                      maxWidth: 760,
                    }}
                  >
                    {description}
                  </div>
                ) : null}
              </div>
              {mascotUrl && mascot ? (
                <div
                  style={{
                    width: 270,
                    height: 270,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid #211a14',
                    borderRadius: 999,
                    background: '#f7f1df',
                    padding: 14,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={mascotUrl}
                    alt={mascot.title}
                    width={242}
                    height={242}
                    style={{
                      borderRadius: 999,
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>,
        );
        const renderer = await getRenderer();
        const fetchedResources = await fetchResources(extractResourceUrls(node));
        const image = await renderer.render(node, {
          width: 1200,
          height: 630,
          format: 'webp',
          fetchedResources,
          stylesheets,
        });
        const imageBody = new Uint8Array(image).buffer;

        return new Response(imageBody, {
          headers: {
            'Cache-Control': 'public, max-age=86400',
            'Content-Type': 'image/webp',
          },
        });
      },
    },
  },
});
