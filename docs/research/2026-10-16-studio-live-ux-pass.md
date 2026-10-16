# Neo studios: running UX walkthrough

Issue: [#3555](https://github.com/open-wa/wa-automate-nodejs/issues/3555). Reviewed on 16 October 2026 against the running main checkout at `http://127.0.0.1:3004/dashboard/`, using isolated Chrome contexts at 1440 × 1000 and 390 × 664. This is an agent-led walkthrough of the application, not human usability acceptance or recipient-device verification.

## Findings and fixes

| Observed problem | Resulting change |
| --- | --- |
| The phone's Edit tab showed the chat before the editor, pushing the fields below the first screen. | Edit, Try message and Code now show their respective panels on narrower screens. The message-type picker and reset action share one row. |
| Three sticker header buttons clipped the Download sticker label on a phone. | Code and Send share a row; Download sticker gets a full-width row. The phone chat canvas is shorter. |
| Effect selection was a list of names, including unexplained names such as Magik and Woke. | All 62 implemented effects have a visual tile, a plain description and a meaningful label. Search matches both displayed names and recipe names. |
| The previous source was static, so timing effects could not be understood. | The sample is an original animated cat WebP with a gentle nod and blink. The entry action says Try the animated sample. All gallery tiles use this same source. |
| Motion was invisible before adding an effect. | Tiles contain real WebPs rendered by the browser sticker engine. Motion effects are marked, including Slow motion. Freeze correctly produces a single frame. |
| Searching for one effect left the next visit restricted to that search. | Adding an effect clears the search and filter. No-results recovery offers Show all effects. The eight-effect limit explains how to add another. |
| A drag handle had no useful touch action. | The handle opens Move up and Move down with unavailable boundary moves disabled. Dragging and Alt + arrow shortcuts remain available. Delete buttons identify their specific row. |
| An immediate reload could beat the 300 ms autosave and lose the last change. | Drafts also save on pagehide and route unmount. Immediate reload preserved both an edited message and reordered effects in the recheck. |
| Colour-based effects and backgrounds failed with Maximum call stack size exceeded. | The recipe engine now calls the browser's global CSS colour validator rather than its own local adapter recursively. Actual Tint rendering completed after the fix; all 62 gallery renders completed. |
| An unreadable photo offered Try again and listed unsupported studio formats. | The error names the studio's accepted formats and offers Choose another photo, which opens the file picker. Cancellation retains Try again. |
| Supporting copy was faint in dark mode. | Studio notes and gallery descriptions have stronger contrast; gallery descriptions are larger. The compact phone sample banner leaves room to see effect labels. |

## Product artwork

`apps/dashboard-neo/tools/generate-effect-previews.mjs` generates the source illustration and animation, then uses `@open-wa/stickers/browser` through the running dev server to render each effect with its default options. It resizes the actual output to 192 × 192 for gallery delivery and writes animation and still WebPs under `public/studio/effects/`. The source remains 512 × 512. The manifest records source SHA-256, output bytes, frame counts and durations.

There are 62 effect previews: 61 animated outputs and one static Freeze output. Animation totals about 4.25 MB across the whole catalogue. Tiles load lazily, and only visible tiles decode animation. Pause previews switches to still WebPs; reduced-motion preferences start paused. The sample artwork is original SVG drawing code in the generator, with no externally sourced photo.

Regenerate with the dashboard dev server running:

```sh
node apps/dashboard-neo/tools/generate-effect-previews.mjs
```

## Scenarios exercised in the running application

- Message editing, empty-button validation, recovery, and invalid native JSON suppressing stale code/preview.
- Reply-button simulation, menu selection, single-choice and multiple-choice answers, carousel selection, booking details, and URL/call/copy explanations without performing those external actions.
- Actual clipboard contents for JavaScript, HTTP and JSON, plus the reply handler. Downloaded message ZIP contained message.json, send.mjs, .env.example and README.txt.
- Phone editing through the message-type select and Edit/Try message tabs, with a visible simulated reply and no horizontal page overflow.
- Sticker sample loading, real rendering, effect search/filter/no-results recovery, duplicate-capable application, option controls, shape and animation settings, pack labels, keyboard reordering, touch-menu reordering and removal.
- Original comparison, animated/still preview, reduced-motion gallery defaults, motion filtering including Slow motion, light/dark gallery layouts, and immediate reload persistence.
- An unreadable PNG and replacement through the new recovery button; cancellation and successful retry; actual colour-effect output after the renderer correction.
- Downloaded sticker.webp and the source/settings/code archive. The sticker ZIP contained the original source-sample-cat.webp, sticker-job.json, send.mjs, .env.example and README.txt.
- Actual gallery Shake WebP decoded to 13 frames; two decoded frames had different pixel hashes, confirming rendered motion rather than a CSS approximation. The product artwork generation rendered all 62 effects successfully.
- Send to chat opened a separate recipient sheet; demo mode stated that sending was unavailable and disabled Send message.

No real WhatsApp messages were sent, no recipient devices were inspected, and the exported sending scripts were not executed against a backend. No unit-test files, typechecks, lint checks, builds or CI workflows were added or run. Only the requested running-app walkthrough and product-asset generation were performed.

During an initial attempt to generate artwork with the standalone Node backend, Low quality failed because its JPEG intermediate could not be encoded. Artwork generation uses the actual browser renderer, where all effects completed. That separate standalone-backend limitation remains open; browser output does not establish server/CLI parity.
