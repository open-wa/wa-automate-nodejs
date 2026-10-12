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

| Rank | Audience | Situation when they land | Their goal, in their words | Already want it? | Needs to trust us |
|---|---|---|---|---|---|
| 1 | Node.js developers who want WhatsApp in their app (indie, agency, in-house, AI-agent builders) | Laptop, mid-task, two or three tabs open (this, the official Cloud API docs, another library's README); also from a Google search or a GitHub link on a phone | "Get WhatsApp sending and receiving from my code today, with my own number" | Mostly yes, comparing options | One command that works, real code, honest ban-risk note, what's free vs paid, active maintenance (recent release, stars, Discord) |
| 2 | Existing users who hit a licence-gated method | Coming from docs, an error message or the dashboard; know exactly which method they need | "Get a key so `createGroup` / buttons / messaging new numbers works" | Yes, ready to pay | Exact method list per tier, price, what to enter, that the key is per number |
| 3 | v4 users moving to v5 | Have a running v4 bot | "Upgrade without breaking my bot" | Yes | Migration guide, how to pin v4 |
| 4 | Businesses that want it built for them | Not developers; found it via a developer or search | "Someone to set this up for us" | Partly | A contact route, what consulting covers |
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

- `/`: audience #1. First screen: what it is in one line, the command with a
  Copy button, and a route to the quick start. Then proof it works (a
  first-run sequence, real code), the four ways to use it, what you can build,
  what's free vs licensed, honest risk note, community and maintenance
  signals.
- `/quickstart/`: the first run in three steps (run, scan or link-code,
  open `/api-docs/`), then the four paths with their real snippets, Docker,
  and links into the full docs.
- `/features/`: capabilities (messages, media, groups, polls, events,
  stickers, multi-session, sessions and keys, live refresh, drivers, generated
  API docs), each with a short snippet or method names.
- `/integrations/`: webhooks, Chatwoot, Node-RED, S3, Cloudflare Session
  Proxy, MCP, Plugin SDK, each with what it does and the package.
- `/ai-agents/`: the MCP server: config, start command, Claude Desktop config,
  which methods become tools, and that licence rules follow the method.
- `/use-cases/`: the six use cases from the fact pack, each with the path and
  methods it uses. Never invented customers.
- `/pricing/`: free (no key) vs Insiders vs Restricted, prices with the check
  date, what each unlocks by method name, per-number keys, billing periods,
  "before you buy" checks, FAQ, and **the licence form (the lead seam):** tier,
  GitHub username, WhatsApp number (with country code), use case → demo
  confirmation that names the tier and the next step (prefilled Gumroad
  checkout). Hand the details to `submitLead()`.
- `/compare/`: "Official API or open-wa?" Honest trade-offs only, no claims
  about named third-party libraries: Meta's WhatsApp Business Platform needs a
  Meta business account, approved templates for conversations you start, and
  per-message pricing, and is officially supported; open-wa uses your existing number through WhatsApp
  Web, is free for most methods, and is unofficial with account-ban risk.
- `/migrate/`: v4 to v5: what changed at a glance, how to pin v4, link to the
  full migration guide.
- `/support/`: Discord, GitHub issues, docs, paid support and consulting
  (email, per-minute consulting, book an hour), and a simple "tell us what you
  need" form for audience #4 (name, email, what you want built) through
  `submitLead()`.
- `/community/`: Discord, GitHub, contributing, the Plugin SDK, releases.
- `/changelog/`: the 5.5 and 5.4 notes from the fact pack, linking to GitHub
  releases and the docs changelog.
- `/legal/`: unofficial notice, ban-risk notice, Terms of Service link,
  software licence (Hippocratic + Do Not Harm 1.1), cryptography notice.
- `404`.
- **Docs** in the header links out to `https://openwa.dev/docs` (the docs site
  stays where it is). GitHub link shows the star count (dated).

Secondary audiences reach their pages from the header or footer (Pricing,
Support, Migrate from v4), never from the hero.

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
  code (send and receive), capability grid, integrations, AI/MCP, pricing or
  "free vs paid", open-source signals (stars, licence, Discord), latest
  release, closing CTA repeating the command.
- **Page set:** section 3.
- **Task flow (pricing):** tier choice, GitHub username, WhatsApp number,
  use case, then prefilled checkout. Show prices before the form.
- **Trust and compliance lines:** "Unofficial. Not affiliated with WhatsApp or
  Meta." in the footer of every page; a ban-risk note next to the quick start
  and on pricing; Terms of Service; software licence; maintainer name;
  copyright.
- **Footer:** Product (Features, Integrations, AI agents, Use cases, Pricing,
  Compare), Developers (Quick start, Docs, API explorer, Changelog, Migrate
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
  four clear paths.

## 5. Narrative order (after the persona passes)

1. **First screen:** what it is in one line (their words: WhatsApp, your
   number, an API, your Node.js app), the command with Copy, Quick start and
   Docs.
2. **Proof it works:** the first run (command → QR or link code → session
   ready → `/api-docs/` → a message sent and a reply received), shown with
   the real commands, in each concept's own way.
3. **Pick a path:** Easy API, SocketClient, embedded runtime, MCP, with the
   real snippet for each.
4. **What you can build and send:** use cases and capabilities, integrations.
5. **Free vs licensed:** most methods free; Insiders and Restricted with
   prices and method names; link to `/pricing/`.
6. **Honest risk and status:** unofficial, ban risk, the licence, maintenance
   signals (latest release date, stars, Discord), all dated.
7. **Closing:** the command again, Discord, GitHub.

**Demo data:** any terminal output, chat messages, phone numbers, event logs
or API responses shown in demos are illustrative. Use obviously fake numbers
(+44 7700 900xxx, the UK drama range) and label demo panels "Example output".

## 6. Complexity budget

- Fields before value on `/`: zero. The command is the value.
- Steps from landing to a running session: copy the command, run it, scan.
- Words on the first phone screen: about 60–80.
- Pricing form: four fields, no account, one step to checkout.

## 7. Persona passes on the plan

| Pass | Persona and context | Where they hesitated or gave up | Cut or change |
|---|---|---|---|
| 1 | **The comparer:** Priya, freelance Node dev in Pune, building order updates for a client's shop; tabs open for Meta's Cloud API docs and another library | Wants to know in five seconds whether this uses the shop's existing number and whether it's free. Gives up if the first screen is a slogan with no command | Say "your own WhatsApp number" and "free for most methods" near the top; command on screen one; link to `/compare/` |
| 2 | **The sceptic:** Tom, backend engineer at a UK e-commerce startup, burned by an unofficial library that broke after a WhatsApp update | Looks for maintenance signals and the ban-risk catch. Leaves if risk is hidden or "no ban" is claimed | Latest release date and changelog visible; ban-risk note stated plainly; never claim safety or reliability superlatives |
| 3 | **The licence buyer:** Ana, already running open-wa, `createGroup` errors with a licence message | Needs which tier unlocks `createGroup`, the price, and what "WhatsApp number" in the form means | Pricing lists methods by tier; field help "the number of the account you'll run"; prices before the form; Pricing in the header |
| 4 | **The agent builder:** Kenji, wiring Claude to WhatsApp via MCP | Wants the config and the endpoint, and whether licensed methods appear as tools | MCP path on the home page with real config; `/ai-agents/` page; "licence follows the method" line |
| 5 | **The business owner (secondary):** a bakery owner told by their nephew about open-wa | The home page is all code | `/support/` with consulting and a short "tell us what you need" form, linked from the footer and header menu |

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
  honest ban risk, four named paths, working first-run shown with the real
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

- **Who reads it:** developer #1, wanting a running session. Write every line
  for them.
- **Their words:** WhatsApp API, my own number, send a message, receive
  messages, bot, webhook, QR code, session, Node.js, self-hosted, free, ban,
  MCP, Claude, Chatwoot, n8n-style automation.
- **Words to avoid:** primitives, surfaces, orchestration, engine,
  platform-grade, "runtime substrate", seamless, effortless, powerful,
  blazing, and anything describing the design.
- **Spelling and register:** British English (licence as a noun, license as
  the CLI flag and API field names, which stay as written in code), proper
  capitalisation. The product name is "open-wa" in prose.
- **Standard:** `~/projects/ALFRED/standards/WRITING.md` §2, §4, §6 and the
  skill's `references/copy.md`. No em-dashes, ever.

## 11. Never claim

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

- Mohammed's developer-tool references set the craft bar: Better Auth (the
  mark's hover animation), sim.ai, c15t, the Fumadocs showcase.
- Every concept should make a design-literate developer say "oh, that's
  nice", look crafted rather than templated or AI-made, and be recognisably
  different from its siblings at thumbnail size.
- Purple-to-blue gradients, glassmorphism, Inter everywhere, emoji as icons
  and generic line-icon grids are out.
- Fonts: each concept picks its own from open licences, as assigned in the
  README lineup. No two concepts share a typeface.
