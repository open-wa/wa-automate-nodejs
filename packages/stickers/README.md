# @open-wa/stickers

Create WebP stickers locally, using an available browser for jobs it can execute
completely, or a portable standalone worker for the whole job. No Sharp, native
addon build, browser download or default model weights.

```js
import { createSticker } from '@open-wa/stickers';

const sticker = await createSticker('./photo.jpg', {
  effects: ['comic', { name: 'tint', options: { color: '#e056ae' } }, 'sparkle'],
});
await writeFile('./sticker.webp', sticker.bytes);

// The SDK supplies its existing browser context automatically.
await client.sendSticker(to, './photo.jpg', {
  effects: ['comic', 'sparkle'],
  author: 'My label',
  pack: 'My pack',
  quotedMsgId: messageId, // optional sticker reply
});
```

The SDK imports this package on the first sticker request. Rendering produces
pixels and optional author/pack labels. Sending requires the private sticker
patch: it owns donor app links and finalizes EXIF before native hashing,
encryption and upload. Rendering alone doesn't produce donor-branded output. Sticker payloads are rejected
by `sendRawMessage`; use `sendSticker` to reach the finalizer. Native sticker
forwarding is blocked until its local re-finalization path is ported.

## Routing and lifecycle

`createSticker(input, job)` defaults to `backend: 'auto'`. Before decoding, the
planner compares the input codec and every ordered effect with the available
browser capabilities. If all requirements fit, the job runs in that browser.
Otherwise the complete job runs standalone. An unsupported complete job fails
with `CAPABILITY_UNAVAILABLE`; it never transfers intermediate frames between
backends or calls a rendering server. Explicit `browser` and `standalone`
overrides are strict.

Outside a browser, standalone is the default. For an existing page/driver:

```js
import { createStickerRuntime } from '@open-wa/stickers';
import { createBrowserBackend } from '@open-wa/stickers/browser';

const stickers = createStickerRuntime({ browser: createBrowserBackend(page) });
try {
  const result = await stickers.createSticker(input, { effects: ['invert'] });
} finally {
  await stickers.dispose();
}
```

The page must provide `evaluate(fn, argument)`. Inside a browser page the default
runtime uses that page directly. Each backend serializes work, caps its queued
inputs at 64 MiB and four requests, and drops owned resources after 60 seconds
without work. Standalone cancellation terminates the active worker; queued jobs
continue in a new worker. Browser cancellation prevents submission and rejects
the result, with cancellation observed between frames; an active native codec operation
can finish before cleanup.
The CLI disposes its worker when the command ends.

## CLI

```sh
openwa-sticker photo.jpg --effects comic,tint,sparkle --output sticker.webp
openwa-sticker photo.jpg --job sticker-job.json --output sticker.webp
openwa-sticker effects
openwa-sticker effects --all
```

`--job` supplies the same JSON job fields as the library. `--offline` requires
previously cached resources; `--cache-dir` selects the resource cache. By default,
resources live under `$XDG_CACHE_HOME/openwa/stickers/v1`, or
`~/.cache/openwa/stickers/v1`. Resources are pinned by version, length and SHA-256.
They download on demand and are verified before execution. Proxies and custom
certificate authorities must be configured for Node's network client.

## Current coverage

This first implementation contains 62 shared recipes: 57 versioned OpenWA-authored
recipes and five additional numerical effects. Both backends use the same recipe
definitions; Skia supplies standalone Canvas operations, and libwebp supplies
standalone encoding. Invert, grayscale, stereo, dilation, erosion and Bayer
expansion use shared Rust SIMD WASM. The other effects currently use JavaScript
and their context's compositor. This is not a claim of historical Jeyy parity.

PNG, JPEG, GIF and WebP are implemented in both contexts, including animated
inputs. AVIF is available in browsers with an appropriate `ImageDecoder`.
Standalone AVIF and MP4 are not yet implemented. The historical catalogue is
included as an inventory; its unported entries fail explicitly. Use
`listEffects({ availableOnly: true })` to enumerate executable recipes.
Scene/simulation recipes, remaining historical ports, background removal and
statistics reporting remain separate epic work.

Custom colours use the portable sRGB subset: hex, named colours and
comma-separated RGB/HSL. Jobs accept up to eight ordered effects. `freeze` keeps the first frame at its
position in the stack; subsequent animated effects can introduce new motion.
`fps` samples the selected timeline without speeding it up. `slow` changes frame
durations. `trim` uses source milliseconds. `quality` is a maximum: the encoder
can lower it to meet the byte budget and fails if the output still cannot fit.
Text recipes lazily load pinned portable fonts in either context.

## Resource costs and limits

| Component | Extra download | Lifetime |
| --- | ---: | --- |
| Public source package and shared kernels | About 247 KB unpacked | Installed once per package copy |
| Shared Rust kernel binary | 66,478 bytes, included above | Instantiated in the selected renderer |
| Standalone CanvasKit loader + WASM | 7,438,222 bytes | Disk cache; worker lives while hot |
| Standalone libwebp loader + SIMD WASM | 384,230 bytes | Disk cache; worker lives while hot |
| Portable fonts | 46,016–212,196 bytes each | Download only for selected text recipes |

Browsers use their existing Canvas and codecs and download neither standalone
compositor nor encoder. A 512×512 RGBA surface consumes 1 MiB; recipes can own
several temporary surfaces during a frame. Frames are encoded sequentially.
WASM heaps, Skia allocations and browser/worker overhead add memory beyond those
surfaces. Peak RAM hasn't been measured for this implementation; the worker's
128 MiB JavaScript heap limit doesn't cap its native/WASM allocations.

The admission profile is 512×512, at most 120 frames / 10 seconds, 20 MiB input,
16 million source pixels, and 100,000 / 512,000 output bytes for static / animated
stickers. Rendering reserves 4,096 bytes for final metadata. The private patch
checks final bytes again. An unknown send outcome is never retried automatically.

WASM and client patches can be inspected and modified by a machine's owner.
Donor protection applies to the supported OpenWA send path, not to arbitrary
modified clients or externally generated files.
