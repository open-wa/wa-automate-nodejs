# open-wa: shared brief for every concept

Every concept reads this. When something changes, it changes here and running
agents get a message. Facts come from `_shared/content/openwa.json` (the fact
pack). Never invent content.

## 0. What open-wa actually is (research, 12 Oct 2026)

open-wa (`@open-wa/wa-automate`) is an open-source Node.js toolkit, maintained
by Mohammed Shah since 2019, that drives WhatsApp Web in a browser it controls
and gives your code the account's chats, messages and events. One `npx`
command turns a phone's WhatsApp account into a local HTTP API with
interactive docs. From there developers build support inboxes, order and
delivery notifications, bots, webhook bridges into CRMs and helpdesks, and
(since v5) AI-agent tools through a built-in MCP server.

Who comes: Node.js developers. Indie developers and small agencies building
WhatsApp bots for their own or clients' businesses, in-house engineers wiring
WhatsApp into a shop, CRM or helpdesk, and, increasingly, people giving an AI
agent a WhatsApp number. Much of the audience is outside the UK and US (India,
Brazil, Indonesia, the Gulf, Africa), on fast laptops at work and mid-range
Android phones otherwise. English is their working language for code.

Real usage signals (dated, quote with the date): 3,666 GitHub stars, 723
forks, about 105k npm downloads of `@open-wa/wa-automate` in the last 12
months (16.5k in the last 30 days), 43.5k Docker pulls, about 1,050 Discord
members, 648 published versions.

What goes wrong for them: the official WhatsApp Business Platform needs a Meta
business account, approved templates and per-message pricing, which is a
lot for "my shop's own number should answer customers". Unofficial libraries
are quicker but carry account-ban risk, and documentation across the category
is thin, out of date, or split between versions (open-wa's own v4 → v5 split
is part of this). People arrive asking: will this work with my number, how
fast can I send a message, will I get banned, what's free and what costs money.

Revenue: licence keys sold through Gumroad, per WhatsApp number (Insiders and
Restricted tiers, prices in the fact pack), plus paid support and consulting.
Most methods need no key.

## 1. Audiences, ranked by the value their action creates

**Round 2 correction (Mohammed, 12 Oct 2026):** round 1 was built around "four
ways in" (Easy API, SocketClient, embedded runtime, MCP). That's docs detail.
People run the Easy API command, then want to see **what they can do with
it**. The page sells the jobs, shown working.

| Rank | Audience | Situation when they land | Their goal, in their words | Already want it? | Needs to trust us |
|---|---|---|---|---|---|
| 1 | Developers building a WhatsApp job for a business: salon and clinic bookings, hotel and appointment notifications, OTP codes, hooking WhatsApp calls to a PBX, order updates, a support inbox, bots that send stickers and media, an AI agent. Any language: the Easy API is HTTP, so PHP, Python, Go, n8n and PBX scripts work as well as Node.js | Laptop, mid-task, comparing with Meta's official API and other libraries; or on a phone from a search or a GitHub link | "Get my client's salon bookings / OTP codes / call line working on WhatsApp, with their own number, today" | Yes, comparing options | Their job shown working, one command, the one HTTP call, which jobs need a paid key and what it costs, honest ban-risk note, active maintenance |
| 2 | Existing users who hit a licence-gated method | From docs, an error or the dashboard | "Get a key so OTP to new numbers / createGroup / buttons works" | Yes, ready to pay | Which job needs which tier, price, key is per number |
| 3 | v4 users moving to v5 | Have a running v4 bot | "Upgrade without breaking my bot" | Yes | Migration guide, how to pin v4 |
| 4 | Businesses that want it built for them | Not developers | "Someone to set this up for us" | Partly | A contact route, what consulting covers |
| 5 | Contributors and plugin authors | GitHub | "Build or share a plugin" | Yes | Plugin SDK, repo, Discord |

## 2. Value model

- **Where value is created:** developer #1 runs the first command and gets a
  session up. Adoption is what later turns into licence sales and support work.
- **Who pays:** users who need Insiders or Restricted methods (licence per
  WhatsApp number, via Gumroad), and businesses buying support or consulting.
- **Primary conversion (home page):** copy and run the first command (or
  start the quick start). The command and a Copy button are on the first phone
  screen.
- **Secondary conversions:** configure a licence (tier, GitHub username,
  WhatsApp number, use case → prefilled Gumroad checkout), join Discord, star
  on GitHub, request consulting.

## 3. Page map and floor (every concept builds all of these)

- `/`: audience #1. First screen: what you can do with your own WhatsApp
  number, in plain job words, plus the Easy API command with a Copy button
  and Quick start. Then the jobs **shown working** (the signature moment
  lives here), how it works (run, scan, call the API from any language: one
  real curl), the job gallery linking to recipes, what's free and what needs
  a key **framed by job**, honest risk and maintenance, the command again.
  **No "four ways in" / paths section on the home page.**
- `/recipes/`: the job gallery. One page per job in the fact pack's `jobs`:
  `/recipes/salon-bookings/`, `/recipes/hotel-notifications/`,
  `/recipes/otp/`, `/recipes/pbx-calls/`, `/recipes/stickers/`,
  `/recipes/media/`, `/recipes/order-updates/`, `/recipes/support-inbox/`,
  `/recipes/ai-agent/`. Each: what you'll build, the flow as a phone
  conversation, the code, the methods, the licence needed with price, and a
  link to the docs. These replace round 1's `/use-cases/` and `/ai-agents/`.
- `/quickstart/`: run, scan or link code, open `/api-docs/`, send with curl.
  The other ways to connect (SocketClient, embedded, MCP) go here as a short
  "other ways to connect" block, and nowhere more prominent.
- `/features/`: everything it can send, receive and do (messages, media,
  stickers, polls, events, calls, groups, multi-session, session keys, live
  refresh, generated API docs).
- `/integrations/`: webhooks, Chatwoot, Node-RED, S3, Cloudflare Session
  Proxy, MCP, Plugin SDK.
- `/pricing/`: free vs Insiders vs Restricted, **framed by job** ("OTP to new
  numbers: Restricted"), prices with the check date, method names, per-number
  keys, billing periods, calling-licence note, FAQ, and the licence form
  (tier, GitHub username, WhatsApp number, use case → demo confirmation →
  prefilled Gumroad checkout) through `submitLead()`.
- `/compare/`, `/migrate/`, `/support/` (with the consulting form),
  `/community/`, `/changelog/`, `/legal/`, `404`: as in round 1.
- **Docs** in the header links out to `https://openwa.dev/docs`. GitHub link
  shows the star count (dated).

## 4. Archetype

**Developer tool.** First screen: what it does, the command, docs and
start. Copy medium and precise. Motion can go big, but the command and Copy
button work on first paint.

## 4a. Stakes and the fit-for-purpose rule

**Expressive** (developer tool), with one serious edge: account-ban risk and
the unofficial status must be stated plainly. Novelty is welcome, every
concept must be launchable as openwa.dev's real marketing site, and the
category floor below applies to all of them.

## 4b. Category floor (from the leaders)

Benchmark set: category sites developers compare (WAHA, Whapi.Cloud,
whatsapp-web.js, Twilio's WhatsApp pages, Meta's WhatsApp Business Platform
docs) and best-in-class developer-tool sites (Stripe, Resend, Trigger.dev,
Bun, Deno, Vercel's AI SDK). Studied for structure.

- **Header:** logo, Docs (external), Features or Product, Integrations,
  Pricing, a GitHub link with stars, Discord, and a primary button (Get
  started / Quick start). Phone: a menu sheet with the same items plus the
  primary button.
- **Hero:** one line on what it is, the install or run command with a Copy
  button, a primary CTA (quick start) and a secondary (docs or GitHub). Leaders
  show code or a product view in the first screen, never a slogan alone.
- **Home sections the leaders all have:** how it works in three steps, real
  code (send and receive), capability grid, integrations, pricing or
  "free vs paid", open-source signals (stars, licence, Discord), latest
  release, closing CTA repeating the command.
- **Page set:** section 3.
- **Task flow (pricing):** tier choice, GitHub username, WhatsApp number,
  use case, then prefilled checkout. Show prices before the form.
- **Trust and compliance lines:** "Unofficial. Not affiliated with WhatsApp or
  Meta." in the footer of every page; a ban-risk note next to the quick start
  and on pricing; Terms of Service; software licence; maintainer name;
  copyright.
- **Footer:** Product (Features, Recipes, Integrations, Pricing, Compare), Developers (Quick start, Docs, API explorer, Changelog, Migrate
  from v4, GitHub, npm, Docker Hub), Community (Discord, Contributing, Plugin
  SDK, Support), Legal (Terms, Licence, Unofficial notice), plus the
  disclaimer line.
- **Tone and register:** developer to developer: precise, dry, honest,
  confident about what works and plain about what doesn't.
- **What everyone gets wrong (where we win):** WAHA's hero has no code and
  promises "No blocking"; whatsapp-web.js has no install command, no footer,
  and claims reduced ban risk; Whapi.Cloud buries the API under 15 sections of
  marketing and invented-looking stats; most sites hide what's free vs paid
  and say nothing honest about bans. open-wa wins with: the working command
  first, honest risk, free-vs-licensed by method name, prices up front, and
  the jobs people build shown working.

## 5. Narrative order (after the persona passes)

1. **First screen:** what you can do with your own WhatsApp number, in job
   words (bookings, notifications, codes, calls, stickers), the Easy API
   command with Copy, Quick start. Something visual that shows a job, never
   a slogan alone.
2. **The jobs working (the signature moment):** a salon booking poll and its
   event card, an OTP arriving, a hotel's map pin and PDF, a call answered,
   a sticker made from a photo, each tied to the one call that sent it.
3. **How it works:** run the command, scan the QR code, call the API from
   any language (the real curl). Three steps, short.
4. **Recipes:** the job gallery, each card linking to its recipe page.
5. **Free vs licensed, by job:** replying to people who message you is free;
   OTP and first messages to new numbers need Restricted; buttons and lists
   need Insiders; calls need a calling-enabled key. Prices and the date.
6. **Honest risk and status:** unofficial, ban risk, maintenance signals.
7. **Closing:** the command again, Discord, GitHub.

**Demo data:** illustrative businesses (a salon, a hotel, a shop) with
invented names clearly marked "Example", numbers in +44 7700 900xxx.
Never present them as customers.

## 6. Complexity budget

- Fields before value on `/`: zero. The command is the value.
- Steps from landing to a running session: copy the command, run it, scan.
- Words on the first phone screen: about 60–80.
- Pricing form: four fields, no account, one step to checkout.

## 7. Persona passes on the plan (round 2)

| Pass | Persona and context | Where they hesitated or gave up | Cut or change |
|---|---|---|---|
| 1 | **Diego, freelance PHP dev in São Paulo,** building appointment reminders for a chain of salons | Round 1 talked about Node paths and SocketClient; he writes PHP. Leaves if he can't see a salon-shaped flow and an HTTP call | Show the salon job working on screen one or two; the curl call; say "any language" |
| 2 | **Aisha, backend dev at a fintech in Lagos,** needs OTP over WhatsApp | Wants to know if OTP to new numbers works and what it costs | OTP job on the home page with "needs Restricted, £15 a month"; pricing framed by job |
| 3 | **Marco, telecoms integrator,** wants WhatsApp calls on an Asterisk PBX | Needs to know if calls exist, the audio format, and the catch | PBX recipe with the stream format, "licensed preview", "most PBXs need a small adapter" |
| 4 | **Tom, the sceptic** (from round 1) | Ban risk hidden, no maintenance signals | Risk note and dated signals stay |
| 5 | **Ana, the licence buyer** (from round 1) | Which tier for her method | Job-framed pricing plus method names |

## 8. Market notes and assumptions

- **How people do this today:** WAHA (Docker-first, "Get Started" hero with
  no code, sections of snippets, $5/mo community support), whatsapp-web.js
  (library, Guide/Docs CTAs, three feature blurbs, no footer), Whapi.Cloud
  (hosted API, free sandbox, $29/mo per number, 15-section page with
  testimonials and usage stats), Meta's official Cloud API (verification,
  templates, per-message pricing).
- **Conventions to keep:** command with Copy in the hero, code blocks with
  syntax colour and copy, Docs and GitHub in the header, pricing table, dark
  or light code panels, a three-step "how it works".
- **Deliberate differences:** method-level free vs paid, prices up front,
  honest ban risk, real jobs shown working, the first run shown with the real
  commands.
- **Fulfilment:** instant: the command runs locally, licences go straight to
  Gumroad checkout.
- **Assumptions (riskiest first):** (1) the main page should lead with the
  free first run rather than licence sales; licences are a header link and a
  home section. (2) Prices on Gumroad are current and in GBP (checked 12 Oct
  2026). (3) A Premium tier exists on Gumroad but isn't in the docs; leave it
  out.

## 9. Product truth

All facts are in `_shared/content/openwa.json`. Import only the fields you
render. Primary CTA: copy `npx @open-wa/wa-automate@latest --port 8080`, then
"Quick start" → `/quickstart/`. Docs: `https://openwa.dev/docs`.

## 10. Copy notes

- **Who reads it:** developer #1 with a job to build. Write every line about
  their job working, never about the product's architecture.
- **Their words:** WhatsApp API, my own number, booking reminders,
  appointment notifications, OTP, verification code, PBX, call, IVR,
  stickers, voice notes, PDF, send a message, receive messages, webhook, QR
  code, session, self-hosted, free, ban, PHP, Python, Node.js, n8n.
- **Words to avoid:** four ways in, paths, surfaces, runtime, embedded,
  SocketClient (outside the quick start and docs), primitives,
  orchestration, engine, seamless, effortless, powerful, blazing.
- **Spelling and register:** British English (licence as a noun; code stays
  as written), proper capitalisation. "open-wa" in prose.
- **Standard:** `~/projects/ALFRED/standards/WRITING.md` §2, §4, §6 and the
  skill's `references/copy.md`. No em-dashes, ever.

## 11. Never claim

- Only `POST /api/messages/sendText` has a documented HTTP route in the fact
  pack. Show other methods in JavaScript, or say every method is listed at
  `/api-docs/`. Never invent other routes.
- Calls: a licensed preview needing a calling-enabled key; audio only. Never
  say it plugs straight into any PBX: most need an adapter.
- Stickers: never call sendSticker free of conditions in big type; its fine
  print says it relies on the current sticker patch.

- No "most reliable", "best", "#1", "fastest", "enterprise-grade" or any
  superlative. The repo description's "most reliable" has no receipt.
- Never claim it avoids bans, is safe, is approved by WhatsApp, or is
  "official". Never imply partnership with WhatsApp or Meta.
- No WhatsApp logo, glyph or WhatsApp green (#25D366 and near shades) as a
  brand colour. Chat bubbles in demos must not copy WhatsApp's UI exactly;
  draw your own.
- No invented customers, company logos, testimonials, ratings, uptime or
  message-volume figures. Stats only from the fact pack, with the date.
- Third-party names allowed: WhatsApp, Meta, WhatsApp Business Platform /
  Cloud API (for the comparison), Node.js, npm, Docker, Puppeteer,
  Playwright, Lightpanda, Chatwoot, Node-RED, Cloudflare, Amazon S3, Claude,
  Cursor, Windsurf, GitHub, Discord, Gumroad. No claims about other
  WhatsApp libraries by name.
- Don't describe `client.sendSticker` as available to everyone: it needs a
  private finalizer. Local sticker rendering (the CLI) is available.
- Calling audio is a licensed preview; Lightpanda is experimental. Say so if
  mentioned.
- Prices always carry "checked 12 Oct 2026, checkout shows the current
  price" (or equivalent) and are in GBP.

## 12. Prior art and branding to keep

- **openwa.dev, the docs site, the Wally mascot, the existing logo
  (`resources/hotfix-logo.png`) and its colours:** ignored as design input.
- **Branding to keep:** the name "open-wa" only. Every concept proposes its
  own mark, palette, type and voice.

## 13. Taste and the wow bar

- **Round 1 (01 to 07) is prior art.** Mohammed: "boring and irrelevant ...
  generic slop". Don't reuse its fonts (Departure Mono, Atkinson Hyperlegible
  Next, Schibsted Grotesk, Fragment Mono, Newsreader, Public Sans, Martian
  Mono, Chakra Petch, Red Hat, Gloock, Onest, Spline Sans Mono, Big Shoulders,
  Literata, Victor Mono, Figtree, Source Code Pro), palettes, marks or
  compositions (terminal hero, code/chat split, path diagram, event log,
  agent transcript, riso poster, baseline split).
- **Not boring:** each concept should feel like a real business's WhatsApp
  coming alive. Show salons, hotels, shops and phone lines (illustrated or
  generated imagery, labelled), not abstract dev-tool chrome.

- Mohammed's developer-tool references set the craft bar: Better Auth (the
  mark's hover animation), sim.ai, c15t, the Fumadocs showcase.
- Every concept should make a design-literate developer say "oh, that's
  nice", look crafted rather than templated or AI-made, and be recognisably
  different from its siblings at thumbnail size.
- Purple-to-blue gradients, glassmorphism, Inter everywhere, emoji as icons
  and generic line-icon grids are out.
- Fonts: each concept picks its own from open licences, as assigned in the
  README lineup. No two concepts share a typeface.
