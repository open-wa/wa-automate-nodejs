# open-wa landing-page concepts

Seven deliberately different concepts for openwa.dev's marketing site, all for
the same audience and job (BRIEF.md): Node.js developers who want WhatsApp in
their app, primary action "copy and run the first command". Each one is a
small static Astro site served behind the password gate at
https://concepts.openwa.dev (any username, password `concepts`, noindex).

## Round 2 (08 to 13): jobs, not architecture

Round 1 (01 to 07, below) was rejected: "boring and irrelevant", built around
"four ways in". Round 2 sells the jobs developers build on their own
WhatsApp number, shown working, after one Easy API command.

| Slug | Benchmark | Fit (plan → built) | Angle | Composition | Signature moment | Brand (logo · palette · type) | World and imagery | Narrative | Wow anchors | Port |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `08-business-line` | Twilio | Fit → Launchable 16/16 | Your business's own WhatsApp number, sending bookings, codes and call replies from your code | Full-bleed scene: a large phone over a generated collage of small businesses (salon chair, hotel key, shop counter, switchboard); command floats beside | Jobs arrive on the phone one after another (booking poll, OTP, map pin, sticker, answered call); tap any message and the exact call that sent it slides out | Speech bubble whose tail is a coiled phone cord · plum #2A0E2E, tangerine #FF7A1A, cream #FFF4E6 · Unbounded + Hanken Grotesk + JetBrains Mono | Warm, photographic; generated scene photography | Jobs first | R1, R2, R3 | 4408 |
| `09-recipes` | Vercel Templates | Fit → Launchable 15/16 | Pick your job, copy the recipe | Catalogue: command bar on top, then a wall of recipe cards, each a tiny phone looping its job; filter by business type | Cards play their conversation on hover or when scrolled into view; opening one expands into steps, code and the phone side by side | Folded recipe-card corner that becomes a speech bubble · off-white #F7F7F2, charcoal #1C1C1C, job swatches tomato #E8553B, saffron #F2A93B, sky #3A8DDE, lilac #9B7BE0 · Instrument Serif + Instrument Sans + Commit Mono | Bright catalogue; UI as image | Recipes first | R4, R5, R6 | 4409 |
| `10-salon-story` | Cal.com | Fit → Launchable 15/16 | Build a salon's WhatsApp bookings in an afternoon | Story with a sticky action: five scroll scenes following Rosa's salon (customer asks, poll of times, event card, reminder, "running late"), command pinned | Each scene's phone message and the code that sent it animate together as you scroll; ends on "the same works for hotels, clinics and shops" | Bubble with a clock hand · blush #F6D9D3, espresso #2B1B17, brass #B88A44 · Fraunces + Karla + IBM Plex Mono | Editorial warm; generated salon photography | Story | R7, R8, R9 | 4410 |
| `11-sticker-studio` | Cloudinary | Fit → Launchable 14/16 | Turn photos into stickers and send media from code | Interactive tool: drop a photo (or pick a sample), stack effects, watch the sticker render and land in a chat | Real local sticker rendering with @open-wa/stickers if it runs in the page, else pre-rendered with its CLI; voice-note, PDF and view-once strip below | A sticker bubble whose corner peels on hover · lilac #C9B8FF, black #111111, hot yellow #FFE600 · Bagel Fat One + DM Sans + Azeret Mono | Playful, bright; real rendered stickers | Product first | R10, R11, R12 | 4411 |
| `12-any-language` | Postman | Fit → Launchable 16/16 | One HTTP call from PHP, Python, Node or your PBX | Request builder: pick a job and a language, get the exact request and the phone's result; PBX call flow below | Switching job or language rewrites the request in place and replays the result on the phone; the PBX section draws a call flowing from WhatsApp to a phone system | Telephone-jack plug inside a bubble · navy #0B1020, signal red #FF4D3D, paper #F5F2EB · Sora + Manrope + Fira Code | Technical dark; UI and diagrams | Show the call | R13, R14, R15 | 4412 |
| `13-front-desk` | Front | Fit → Launchable 15/16 | Run a hotel's front desk on its own WhatsApp number | App on the page: a small hotel's front-desk inbox with automation switches beside it | Flip a switch (send check-in details, reply with the map pin, answer calls with a greeting, code for the guest wifi) and the guest's phone shows it while the code appears | Reception bell inside a bubble · sand #EFE7DA, ocean #0F3B57, terracotta #C8553D · Young Serif + Work Sans + Ubuntu Mono | Hospitality calm; generated hotel imagery | Product first | R16, R17, R18 | 4413 |

## Round 1 (01 to 07): rejected, kept for reference

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
