// NOTE: OG images render with the Takumi WASM renderer (@takumi-rs/wasm), NOT
// the native @takumi-rs/core. The WASM path is the only one that runs on
// Cloudflare Workers (this docs app builds with @cloudflare/vite-plugin). Do
// not "upgrade" this to @takumi-rs/core — it will break the Cloudflare build.
// See issue #3343.
import { fromJsx } from '@takumi-rs/helpers/jsx';
import initWasm, { Renderer } from '@takumi-rs/wasm';
import wasmModule from '@takumi-rs/wasm/auto';
import { SITE_NAME } from '@/lib/site';

let rendererPromise: Promise<Renderer> | undefined;

async function getRenderer() {
  rendererPromise ??= initWasm({ module_or_path: wasmModule }).then(
    () => new Renderer(),
  );
  return rendererPromise;
}

/** A 1200×630 WebP social card with a title, an optional description and the WA badge. */
export async function renderOgCard({
  title,
  description,
  badgeLabel,
}: Readonly<{
  title: string;
  description?: string;
  /** Accessible name for the badge; no badge when omitted. */
  badgeLabel?: string;
}>): Promise<Response> {
  const showBadge = Boolean(badgeLabel);
  const { node, stylesheets } = await fromJsx(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef4fd',
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
          border: '4px solid #1839b9',
          borderRadius: 44,
          background: '#f9fcff',
          boxShadow: '14px 14px 0 #1839b9',
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
              border: '3px solid #1839b9',
              borderRadius: 999,
              background: '#dde6f3',
              padding: '12px 22px',
              color: '#162748',
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              color: '#162748',
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: -2.4,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                color: '#49617f',
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
        {showBadge ? (
          <div
            aria-label={badgeLabel}
            style={{
              width: 270,
              height: 270,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid #1839b9',
              borderRadius: 999,
              background: '#eef4fd',
              color: '#162748',
              fontSize: 96,
              fontWeight: 950,
              letterSpacing: -4,
              flexShrink: 0,
            }}
          >
            WA
          </div>
        ) : null}
      </div>
    </div>,
  );
  const renderer = await getRenderer();
  const image = await renderer.render(node, {
    width: 1200,
    height: 630,
    format: 'webp',
    stylesheets,
  });
  const imageBody = new Uint8Array(image).buffer;

  return new Response(imageBody, {
    headers: {
      // Long-lived, CDN-cacheable. Scrapers re-fetch OG images often, so
      // avoid re-rasterizing on every unfurl.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      'Content-Type': 'image/webp',
    },
  });
}
