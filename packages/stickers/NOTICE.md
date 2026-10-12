# Notices and provenance

The recipes in this package are versioned OpenWA-authored transformations. Names
from the historical catalogue are an inventory, not copied Jeyy source or a claim
of visual parity. No WhatsApp module implementation or commercial donor policy
is distributed in this package.

The included Rust SIMD kernel was produced during the local rendering research
and is retained with its source and Cargo lockfile. Its SHA-256 is
`0309a56beff0be49dac60f6486ba4f861d716b38a95a76cfdcac6921bd3f254f`.
To regenerate it deliberately, use Rust's `wasm32-unknown-unknown` target and
`RUSTFLAGS='-C target-feature=+simd128' cargo build --release --locked` from
`wasm/`, then copy the resulting module to `wasm/kernels.wasm`. There is no
installation-time Rust compilation. `fast_image_resize` 6.1.0 is MIT OR Apache-2.0.

On-demand third-party resources:

- CanvasKit 0.42.0, copyright Google/Skia contributors, BSD-3-Clause; see
  `licenses/skia-license.txt` and Skia's distribution for its dependency notices.
- jSquash WebP 1.5.0 and Squoosh options, copyright Google and Jamie Sinclair,
  Apache-2.0. Its libwebp codec is BSD-3-Clause. Both licenses are in `licenses/`.
- ABeeZee, Lora and IBM Plex Mono font resources from Google Fonts commit
  `5e8a3ba899557829a76cfdac30fa512bda91d7ca`, SIL Open Font License 1.1. Their
  copyright/license texts are retained in `licenses/`. The runtime family aliases
  identify resources; no modified font binaries are distributed.

Every remotely fetched executable/font resource has an exact URL, version,
byte length and SHA-256 in `src/resources.mjs`. Browser rendering does not load
the standalone resources. Original licenses govern the corresponding resources;
OpenWA's own code is governed by `LICENSE.md`.
