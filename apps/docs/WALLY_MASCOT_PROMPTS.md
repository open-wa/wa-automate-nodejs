# Wally Mascot Prompt Manifest

Use this as the generation checklist for replacing and extending the Wally Walrus mascot set in the docs app.

---

## Visual Reference

The canonical Wally look is established across four reference assets — study **all four** before generating anything:

| Asset | Path | Key traits to absorb |
|---|---|---|
| `wally.png` | `apps/docs/public/wally.png` | Warm brown fur, round spectacles, cream muzzle, soft smile, kawaii coffee mug companion with a face and purple steam, seated-at-desk posture, smooth cartoon rendering |
| `wally-typing.png` | `apps/docs/public/wally-typing.png` | Same character at a retro chunky keyboard, halftone dot shading on fur and chest, coiled cable mouse, more visible retro-computing props, slightly muted earthy palette |
| `source-1.png` (cursor sheet) | `apps/docs/public/cursors/source-1.png` | **Pixel-art** renditions of Wally's flippers as cursor icons — chunky staircase pixel edges, limited warm-brown palette, the kawaii purple steaming mug re-used as a wait/spinner cursor, I-beam text cursor rendered in tusk-ivory pixel lines |
| `source-2.png` (cursor sheet) | `apps/docs/public/cursors/source-2.png` | Pixel-art Wally head as "help" cursor with question mark, Wally's fist as "no" cursor with red X, round spectacles floating solo as "working" cursor with hourglass, flipper paw as "drag" cursor, whiskers stretched with arrows as "resize" cursors, flipper typing on keyboard as "busy", magnifying glass held by flipper as "zoom in" |

### Merged Aesthetic — the "Retro Wally" Style

Every new mascot image must blend the **character identity** from the illustration assets with the **rendering technique** from the cursor sheets:

1. **Pixel-art rendering** — Visible, deliberate pixel grid (roughly 64–96 px sprite scale, then upscaled to 1024×1024 with nearest-neighbor / no anti-aliasing). Hard staircase edges on outlines. No smooth gradients — use flat colour fills and halftone dot patterns for shading, exactly like the fur texture in `wally-typing.png` and the cursor sprites.
2. **Limited warm palette** — Warm brown (`#8B6344`-ish), dark brown outline (`#3A2A1A`), cream/tan muzzle and belly (`#D4B896`), muted purple for the kawaii mug (`#8B7CB8`), ivory tusks, off-white parchment background tone (`#F5F0E8`), highlight green for "go/success" indicators. No neon, no saturated primaries.
3. **Chunky black pixel outlines** — Every shape gets a 2–3 px dark outline rendered as pixel staircases, giving that retro sprite-sheet feel.
4. **Halftone / dither shading** — Instead of gradients, use checkerboard dithering or ordered-dot halftone to add depth to Wally's fur and props, matching the `wally-typing.png` chest shading.
5. **Wally's signature props** — Round spectacles (thick pixel frames), cream muzzle dot pattern, visible whiskers (pixel lines), small rounded tusks. These must appear on every full-body or head shot.
6. **Kawaii coffee mug companion** — The small purple/lavender mug with a cute face and curling steam is Wally's sidekick. Include it whenever the scene naturally allows a desk or resting surface. Steam rendered as pixel wisps.
7. **Retro-computing atmosphere** — Chunky keyboards, coiled cables, CRT-shaped monitors, floppy-disk-era props. Tech elements lean 80s/90s retro, not modern sleek.
8. **Composition** — Centered character, square canvas, clean silhouette that reads at small sizes (48–64px thumbnails in docs cards). **Flat beige parchment background (`#F5F0E8`)** matching `wally.png` — do NOT use a transparent background (AI generators render ugly checkerboard artifacts).

---

## Output Rules

- Generate each image as a square 1024×1024 image in the **pixel-art style** described above with a **flat solid beige parchment background (`#F5F0E8`)**. Do NOT use a transparent background.
- Export as PNG. **Upscale with nearest-neighbor** (no bilinear/bicubic) to preserve pixel crispness.
- Keep the character consistent across the entire set — same palette, same pixel density, same outline weight, same background color.
- Keep every scene simple enough to read at small sizes inside docs cards and callouts.
- Do not include readable UI text, WhatsApp/Meta logos, brand marks, screenshots, QR data, or real phone numbers.
- Put generated files in `apps/docs/public/mascots/` using the filenames below.
- Public URL pattern after placement: `/mascots/<filename>.png`.

---

## Base Style Prompt Prefix

Use this prefix before every scene prompt:

> Create a retro pixel-art mascot sprite of Wally the Walrus, the open-wa docs mascot, on a flat solid beige parchment background (hex #F5F0E8). Wally is a friendly rounded walrus with warm brown pixelated fur, cream muzzle, small rounded pixel tusks, round thick-framed spectacles, expressive kind eyes, visible whisker pixel-lines, chunky dark-brown pixel outlines (2–3 px), halftone dot-pattern shading on fur, retro 8-bit/16-bit sprite proportions, limited warm earthy color palette. Include his kawaii purple steaming coffee mug companion with a cute face whenever a surface is present. Retro-computing props (chunky keyboards, coiled cables, CRT monitors) for tech scenes. No smooth gradients — use flat fills and dither shading only. Centered character, crisp silhouette, no text, no logos, no watermark. Flat beige background, NOT transparent. Upscale with nearest-neighbor interpolation.

---

## Prompts

| # | Docs page | Intended placement | Output file | Prompt |
|---:|---|---|---|---|
| 0 | `/` homepage hero | Replace current `/wally-typing.png` hero image | `apps/docs/public/mascots/wally-homepage-session-console.png` | Wally sits at a retro developer desk typing on a chunky mechanical keyboard with a coiled cable. A small CRT-shaped monitor shows abstract pixel terminal panels with blinking cursor dots. A green pixel LED glows on a tiny server box beside the desk. His kawaii purple mug sits steaming on the desk corner. Wally looks focused and helpful, flippers on the keys. Halftone-shaded fur, pixel outlines. |
| 1 | `/docs` docs index | Docs landing callout | `apps/docs/public/mascots/wally-docs-map.png` | Wally holds an unfolded pixel-art map with stitched edges, showing simple path markers as colored pixel dots for start, build, integrate, and operate. Tiny pixel tabs and arrow glyphs as abstract shapes only. Friendly explorer mood. Mug tucked under one flipper. |
| 2 | `/docs/getting-started/quickstart` | Top of quickstart / first-success section | `apps/docs/public/mascots/wally-quickstart-rocket.png` | Wally launches a tiny pixel toy rocket from a retro desk beside a chunky keyboard and CRT terminal. The rocket is small and playful with pixel exhaust puffs rendered as dithered dots. Mug on desk steaming. |
| 3 | `/docs/getting-started/link-code` | Login method section | `apps/docs/public/mascots/wally-link-code-phone.png` | Wally holds a pixel-art phone in one flipper and a large key-shaped pixel charm in the other, pairing a device with a secure login code. Use abstract pixel dots instead of actual digits. Calm authentication mood. |
| 4 | `/docs/getting-started/easy-api` | Easy API intro | `apps/docs/public/mascots/wally-easy-api-counter.png` | Wally runs a cheerful pixel-art API service counter, handing a small pixel envelope to a glowing retro server box with a green LED. Floating pixel endpoint cards without readable text. Mug on the counter. |
| 5 | `/docs/getting-started/custom-code` | Embedded runtime intro | `apps/docs/public/mascots/wally-custom-code-workbench.png` | Wally works at a pixel-art code workbench assembling small runtime modules like colored pixel building blocks — each a different warm earthy color. Blocks snap together like retro game items. |
| 6 | `/docs/getting-started/docker` | Docker first-run section | `apps/docs/public/mascots/wally-docker-container.png` | Wally loads a neatly packed pixel-art shipping container with abstract icon shapes on its side, with a tiny CRT browser window and pixel session token tucked safely inside. No Docker whale logo. |
| 7 | `/docs/getting-started/v5-alpha` | Alpha warning / testing section | `apps/docs/public/mascots/wally-alpha-lab.png` | Wally wears pixel safety goggles in a small retro testing lab, carefully inspecting a glowing alpha crystal (dithered glow) inside a pixel glass case. Playful but clearly experimental. |
| 8 | `/docs/concepts/how-it-works` | Architecture overview diagram callout | `apps/docs/public/mascots/wally-runtime-diagram.png` | Wally points with a flipper at a simple pixel flow diagram made of connected rounded pixel blocks: app → runtime → browser → session → API. Blocks have tiny pixel icons only, no text. |
| 9 | `/docs/concepts/data-models` | Data model explanation | `apps/docs/public/mascots/wally-data-models.png` | Wally sorts pixel-art message bubbles, contact cards, and event cards into organized pixel trays. Emphasize structured data and tidy organization. Halftone-shaded cards. |
| 10 | `/docs/concepts/packages` | Monorepo/packages overview | `apps/docs/public/mascots/wally-package-shelves.png` | Wally organizes small pixel package boxes on retro wooden shelves, each with a different abstract pixel icon for core, drivers, integrations, plugins, and docs. No readable text. |
| 11 | `/docs/concepts/glossary` | Glossary intro | `apps/docs/public/mascots/wally-glossary-book.png` | Wally reads a chunky pixel-art glossary book with sticky note tabs and simple pixel symbol markers, looking like a helpful pixelated librarian. Mug beside the book. |
| 12 | `/docs/guides/integrations-overview` | Integration overview | `apps/docs/public/mascots/wally-integration-hub.png` | Wally stands at the center of a pixel hub with pixel cables branching to abstract app tiles, webhook pixel arrows, a pixel cloud, pixel chat inbox, and automation nodes. |
| 13 | `/docs/guides/chatid-primer` | Chat ID primer | `apps/docs/public/mascots/wally-chatid-name-tags.png` | Wally pins tidy pixel name tags onto different pixel chat bubbles: one person bubble, one group bubble, one broadcast-like bubble. Use pixel icon marks only, no readable IDs. |
| 14 | `/docs/guides/authentication-flow` | Authentication flow | `apps/docs/public/mascots/wally-auth-checkpoint.png` | Wally guides a pixel phone through a friendly security checkpoint with a QR-shaped abstract pixel tile, a pixel key, and a green connected LED light. No scannable QR code. |
| 15 | `/docs/guides/messages` | Messages guide | `apps/docs/public/mascots/wally-message-bubbles.png` | Wally carries a pixel basket of colorful pixel message bubbles, with one bubble being delivered along a dotted pixel path to a phone-shaped pixel icon. |
| 16 | `/docs/guides/media` | Media guide | `apps/docs/public/mascots/wally-media-camera.png` | Wally manages pixel photos, voice note waveforms, and file cards on a small retro media desk, with a pixel camera, speaker wave glyph, and paperclip icon. No actual media thumbnails. |
| 17 | `/docs/guides/groups` | Groups guide | `apps/docs/public/mascots/wally-group-circle.png` | Wally hosts a small circle of friendly abstract pixel chat avatars around a pixel table, showing group coordination without real people or brand marks. |
| 18 | `/docs/guides/group-filtering` | Group vs DM handling | `apps/docs/public/mascots/wally-filter-sieve.png` | Wally uses a playful pixel sieve or sorting funnel to separate group chat bubbles from direct message bubbles into two tidy pixel baskets. |
| 19 | `/docs/guides/message-deletion` | Deleting messages | `apps/docs/public/mascots/wally-message-eraser.png` | Wally gently erases a pixel message bubble with a soft oversized pixel eraser while keeping the surrounding chat bubbles intact. Careful, not destructive. |
| 20 | `/docs/guides/session-events` | Session events | `apps/docs/public/mascots/wally-event-bell.png` | Wally listens to a tiny pixel notification bell connected to pixel event cards flying from a pixel session orb, representing lifecycle events and updates. |
| 21 | `/docs/guides/multiple-sessions` | Multiple sessions | `apps/docs/public/mascots/wally-session-switchboard.png` | Wally operates a vintage pixel switchboard with several colored pixel session lights, each connected to a different tiny pixel phone icon. Retro telephone operator feel. |
| 22 | `/docs/guides/webhooks-for-business` | Webhooks setup | `apps/docs/public/mascots/wally-webhook-fishing.png` | Wally uses a pixel fishing rod with a hook-shaped connector to catch pixel event bubbles and send them into a small pixel inbox tray. Keep the webhook metaphor clear and friendly. |
| 23 | `/docs/guides/node-red` | Node-RED integration | `apps/docs/public/mascots/wally-node-flow.png` | Wally arranges connected pixel flow nodes on a board, with red-toned rounded pixel nodes connected by pixel noodle-like wires. No Node-RED logo or readable labels. |
| 24 | `/docs/guides/s3-media` | S3 media storage | `apps/docs/public/mascots/wally-cloud-storage.png` | Wally uploads pixel media cards into a soft pixel cloud-shaped storage vault with a little pixel lock and bucket icon. No AWS logos. |
| 25 | `/docs/guides/mcp` | MCP integration | `apps/docs/public/mascots/wally-mcp-tools.png` | Wally offers a pixel tray of tiny tool cards to a friendly pixel robot arm, representing AI agents discovering and calling API tools safely. No specific AI company logos. |
| 26 | `/docs/guides/ai-agent-patterns` | AI agent patterns | `apps/docs/public/mascots/wally-agent-orchestrator.png` | Wally conducts a small pixel orchestra of friendly pixel bot helpers, each holding an abstract pixel tool card, with Wally keeping them inside a safe pixel boundary circle. |
| 27 | `/docs/guides/configuration-and-cli` | Configuration / CLI guide | `apps/docs/public/mascots/wally-cli-control-panel.png` | Wally adjusts pixel toggles and knobs on a retro CLI control panel with CRT-shaped terminal cards, pixel env var blocks, and a pixel port dial. No readable command text. |
| 28 | `/docs/guides/config-schema` | Config schema guide | `apps/docs/public/mascots/wally-schema-blueprint.png` | Wally reviews a pixel blueprint covered in nested pixel boxes, checkmarks, and type-shape symbols, representing a configuration schema. Dithered blue-tint blueprint. |
| 29 | `/docs/guides/config-secrets` | Secrets management | `apps/docs/public/mascots/wally-secrets-vault.png` | Wally places pixel API keys represented by golden pixel key icons into a small pixel vault, with pixel env file cards tucked safely away. No readable secrets. |
| 30 | `/docs/guides/rate-limits` | Rate limits and ban risk | `apps/docs/public/mascots/wally-rate-limit-traffic.png` | Wally acts as a pixel traffic controller for message bubbles, holding a small pixel stop sign and spacing pixel bubbles along a safe lane. Safety-first tone. |

---

## Extra Candidate Pages For Later

If you want more than 30, continue with these pages using the same pixel-art style and filename pattern:

- `/docs/guides/logging-and-audit` → `wally-audit-ledger.png`
- `/docs/client-and-integrations/socket-client` → `wally-socket-cable.png`
- `/docs/client-and-integrations/webhook-payloads` → `wally-payload-envelope.png`
- `/docs/client-and-integrations/proxying-a-session` → `wally-session-tunnel.png`
- `/docs/client-and-integrations/cf-proxy` → `wally-cloudflare-tunnel.png`
- `/docs/client-and-integrations/chatwoot` → `wally-support-inbox.png`
- `/docs/plugins/getting-started` → `wally-plugin-starter-kit.png`
- `/docs/plugins/security-model` → `wally-plugin-sandbox.png`
- `/docs/plugins/reference-plugin-walkthrough` → `wally-plugin-cutaway.png`
- `/docs/operations/security-and-deployment` → `wally-security-shield.png`
- `/docs/licensing/pricing` → `wally-license-ticket.png`

---

## Current Asset Notes

Existing mascot assets live in `apps/docs/public/` and are currently referenced as root public URLs:

- `/wally-typing.png`
- `/wally-robot.png`
- `/wally-woodworker.png`
- `/wally-electrician.png`
- `/wally.png`

The new generated images should live under `apps/docs/public/mascots/` to avoid mixing the larger prompt set with the original root-level mascot files.

### Cursor Assets

The retro pixel-art style was originally established through the custom cursor set. These live in `apps/docs/public/cursors/` and serve as the **canonical style reference** for all new mascot generation:

- `source-1.png` — Pointer (flipper), Wait (kawaii mug), New Hand/Link (flipper), Text (I-beam tusks)
- `source-2.png` — Help (Wally head + ?), No (fist + ✕), Working (spectacles + ⏳), Drag (paw), Resize V/H (whiskers + arrows), Busy (flipper typing), Zoom In (magnifying glass)
