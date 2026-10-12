# open-wa landing-page concepts

Seven deliberately different concepts for openwa.dev's marketing site, all for
the same audience and job (BRIEF.md): Node.js developers who want WhatsApp in
their app, primary action "copy and run the first command". Each one is a
small static Astro site served behind the password gate at
https://concepts.openwa.dev (any username, password `concepts`, noindex).

| Slug | Benchmark | Fit (plan → built) | Angle and headline idea | Composition | Signature moment | Brand (logo · palette · type) | World and imagery | Narrative | Wow anchors | Port |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `01-first-run` | Bun (bun.sh) | Fit → | One command turns your WhatsApp number into an API | App on the page: a terminal is the hero, command typed and copyable | The terminal plays the first run: npx, an ASCII QR assembles, a drawn phone scans it, session ready, `curl sendText`, a reply prints; step or replay | Cursor blinking inside a speech-bubble outline · ink #0E0F0C, phosphor amber #FFB000, bone #EDE8DC · Departure Mono + Atkinson Hyperlegible Next | Dev-tool dark; UI and type as the image | Show it working | W1, W2, W3 | 4401 |
| `02-live-reply` | Resend | Fit → | Reply to WhatsApp messages from Node.js | Split product demo: editable code left, a drawn phone chat right | Edit the reply string in the code and the phone's bubble changes; tap "Hi" on the phone and the handler line lights | Brackets that close into a chat tail · paper #FAFAF7, black #0A0A0A, ultramarine #2B3BFF · Schibsted Grotesk + Fragment Mono | Crisp light; UI as the image | Show it working, then paths | W4, W5, W6 | 4402 |
| `03-four-ways` | Stripe | Fit → | Pick how WhatsApp plugs into your app | Editorial grid hero with a four-way path selector over a system diagram | The diagram re-routes animated flow lines per path (Easy API, SocketClient, embedded, MCP) and swaps the matching snippet | A junction node where three lines meet · warm white #F4F1EA, navy #14213D, coral #FF6B4A · Newsreader + Public Sans + Martian Mono | Editorial light; diagrams (SVG) | Pick a path | W7, W8, W9 | 4403 |
| `04-event-stream` | Trigger.dev | Fit → | Every WhatsApp event in your code as it happens | Live board: a streaming event log is the hero, command in the board's header bar | Open an event row: it unfolds into the handler code and payload, and a route switch sends it to Webhook, Chatwoot, Node-RED or S3 | A pulse tick on a baseline · graphite #121417, cyan #3FE0F0, warm white #F1EFEA · Chakra Petch + Red Hat Text + Red Hat Mono | Instrument dark; data as the image | Show it working (events first) | W10, W11, W12 | 4404 |
| `05-agent-number` | Vercel AI SDK | Fit with changes → | Give your AI agent a WhatsApp number (and the API behind it) | Conversation: the page opens as a developer and agent transcript; the copyable Easy API command and MCP config are the pinned composer | Tool-call cards (sendText, getAllChats) unfold into the real MCP request and response | Continuous-stroke "ow" monogram that redraws on hover · bone #EDE6DA, oxblood #6E1423, ink #1B1A17 · Gloock + Onest + Spline Sans Mono | Warm light; UI as the image | Problem → answer, then paths | W13, W14, W15 | 4405 |
| `06-poster` | Deno | Fit with changes → | WhatsApp, from your terminal | Poster type: giant condensed headline with the command set inside it as a copyable strip; riso illustrations | Copying reprints the poster with misregistered ink and stamps "copied"; letters press like keys under the pointer | Rubber-stamp bubble with offset ink on hover · newsprint #F2EEE3, riso pink #FF48B0, riso blue #0078BF · Big Shoulders Display + Literata + Victor Mono | Expressive light; generated riso illustration | Show it working, playful | W16, W17, W18 | 4406 |
| `07-standard` | Whapi.Cloud + WAHA | Fit (baseline) → | The WhatsApp API that runs on your own number | Baseline split: headline left, quick-start card with npx / Docker / npm tabs right | Quick-start card that walks the three steps in place; pricing toggle by billing period | Rounded square with a plug notch and "wa" · slate #1E2A38, sun yellow #FFD23F, white · Figtree + Source Code Pro | Category standard; UI screenshots as image | Category standard order | W19, W20, W21 | 4407 |

Plan verdicts: 05 must keep the Easy API command and the four paths on `/`
(the MCP angle can't narrow the audience); 06 keeps a standard header,
footer and the full floor under the poster.

Divergence rules: no shared colourway, typeface, logo idea, composition,
benchmark, headline or wow anchor; one baseline split (07). See
[INSPIRATION.md](./INSPIRATION.md).

```bash
bash concepts/build-all.sh [slug …]
bash concepts/build-all.sh --gallery
bash concepts/deploy.sh [slug …]
bash concepts/deploy.sh --no-build
```
