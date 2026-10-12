# Concept agent brief (shared by all seven open-wa concepts)

You are designing and building ONE landing-page concept for open-wa
(openwa.dev, the open-source WhatsApp automation toolkit for Node.js). Six
other agents are building deliberately different concepts in sibling folders
right now, so stay inside your own folder. Your direction is in your prompt.

Paths: repo `/Users/Mohammed/projects/tools/wa`, concepts
`/Users/Mohammed/projects/tools/wa/concepts`, skill
`/Users/Mohammed/.claude/skills/landing-concepts` (call it `<skill>`).

## Speed rule (read this first)

**Commit a working first version within about 15 minutes of starting:** the
first screen with the command and Copy button, a basic signature moment, the
header and footer, and the `/pricing/` licence form through to its
confirmation. The coordinator deploys every commit, and Mohammed wants to see
concepts early. Then build the rest of the floor, polish, and commit again
(commit after each meaningful step). Don't research for half an hour first:
look at your benchmark and anchors for a few minutes, then build.

## The three things this concept must do

1. **Serve the right person.** The main page is for Node.js developers who
   want WhatsApp in their app (BRIEF.md §1). The run command with a Copy
   button and a Quick start link are on the first phone screen (390×664, the
   QA viewport). The narrative follows BRIEF.md §5.
2. **Be fit for purpose.** Mohammed could launch this as openwa.dev's real
   marketing site. It meets or beats your named benchmark and the category
   floor in BRIEF.md §3 and §4b: every page, header and footer convention, the
   unofficial and ban-risk lines. Read `<skill>/references/fit-for-purpose.md`.
3. **Wow, and be unmistakably yours.** Build your own angle, composition and
   signature moment. A design-literate developer should say "oh, that's nice".
   If it could pass for a template, or for a sibling in different colours, it
   isn't done.

## Read first (quickly)

- `concepts/BRIEF.md` in full, especially §3 page map, §4b floor, §5
  narrative, §10 copy notes and §11 never claim.
- `concepts/_shared/content/openwa.json`: the fact pack. Import only the
  fields you render. Every command, snippet, price and stat comes from here.
  Never invent content; stats always carry their date.
- `concepts/INSPIRATION.md` and `concepts/README.md` (your siblings' rows:
  don't repeat their palette, type, mark or composition).
- `<skill>/references/directions.md`, `toolbox.md`, `gotchas.md`, `copy.md`,
  and `~/projects/ALFRED/standards/WRITING.md` §2, §4, §6.
- Ignore openwa.dev, the docs site, the mascot and the current logo as design
  input.

## What the user wants

Lead generation (here: developers getting a session running, and licence
buyers) comes first. Wow them with something crafted and novel that doesn't
look AI-made, take inspiration from great developer-tool sites, make every
concept different, and make each one launchable as the real site.

## Build, in this order

1. **Scaffold:** `bash <skill>/scripts/new_concept.sh /Users/Mohammed/projects/tools/wa/concepts <NN-slug> "<Name>"`.
   The folder is its own pnpm root; add libraries with `pnpm add` inside it.
   Fill in `concept.json` (`"archetype": "developer"`, `audience`, `flow`,
   `tagline`, `fonts`, `libraries`, and `"floor"`: the paths in BRIEF §3).
2. **`/` first screen and the command:** copy button that works (with a
   copied state and a keyboard path), Quick start and Docs. Header (Docs links
   to `https://openwa.dev/docs`), phone menu, footer with the unofficial line.
3. **`/pricing/` with the licence form** (the lead seam): prices before the
   form, the four fields from the fact pack (tier, GitHub username, WhatsApp
   number with country code, use case), validation as people type and on
   submit (never on blur), `submitLead("licence", …)` from `src/lib/leads.ts`,
   then a confirmation that names the tier and says the next step is a
   prefilled Gumroad checkout where they review the price and pay (demo: a
   button to `https://openwa.dev/checkout?tier=<tier>`). Phone fields accept
   `+`, spaces and brackets and also Arabic-Indic and Persian digits
   (normalise U+0660–0669 and U+06F0–06F9 to 0–9).
4. **Your signature moment** on `/`, as its own component, with a designed
   reduced-motion still and `?still` support.
5. **The rest of the floor:** every page in BRIEF §3, generated from the fact
   pack, each reachable from the header or footer. `/support/` has its own
   short "tell us what you need" form through `submitLead("consulting", …)`.
   Code blocks everywhere have copy buttons and real syntax colour.
6. **Copy pass** (`references/copy.md`): every line for the developer and the
   action; British English (licence as a noun; `--license-key` and
   `licenseKey` stay as written in code); no em-dashes anywhere, including
   titles, alt text, code comments rendered on the page and JS strings; no
   superlatives; no "not X, it's Y"; no filler words.
7. **Polish:** the mark (`src/components/Mark.astro` plus a standalone SVG)
   with a hover and focus animation as crafted as Better Auth's; the favicon
   (`public/favicon.svg`); real `<title>` and description on every page.

Keep parts separable: all colours, fonts, radii and easings in
`src/styles/tokens.css`; the mark, the signature moment and the licence flow
each their own component.

Constraints: body text 16 px or more, WCAG AA contrast, 44 px tap targets,
keyboard accessible, JS under ~150 KB gzipped (lazy-load anything heavy),
fonts self-hosted in `src/fonts/` with their licence files. Demo output is
labelled "Example output"; demo phone numbers use +44 7700 900xxx. No
WhatsApp logo or WhatsApp green; draw your own chat bubbles. Use your own
scratch folder under `concepts/<NN-slug>/.scratch/` (gitignored by you).
Never pause or cut scope over machine load; if QA times out, rerun it.

Placeholder images (only if your direction calls for them): generate with
`codex exec --skip-git-repo-check --sandbox workspace-write "Use your image
generation tool to create one image, then copy the generated PNG into the
current directory as <name>.png. Image: <prompt>" < /dev/null`, run from your
scratch folder; convert to WebP under 200 KB in `src/assets/generated/` and
label it as illustration in alt text. Never generate people presented as
customers, company logos or WhatsApp branding.

## Verify

1. `pnpm build`, then `node <skill>/scripts/qa_concept.mjs --dist dist --base /<NN-slug>/ --out ../_qa/<NN-slug>`.
   Fix every FAIL; fix or justify every copy warning.
2. Three persona passes (`<skill>/references/persona-passes.md`) using BRIEF §7
   personas: the comparer, the sceptic and the licence buyer. Finish the
   pricing flow with believable data.
3. Score yourself on the eight fit-for-purpose dimensions (§4) and fix
   anything under 2 that you can.
4. Self-critique against your benchmark and anchors: as crafted? any tells
   from `directions.md`? would it blur with a sibling at thumbnail size?
5. Leave no servers running and no browser tabs open.

## Commit

Only your folder, with this repo's gitmoji convention and no AI attribution:
`git add concepts/<NN-slug> && git commit -m "✨ feat(concepts): <NN> <name>" -- concepts/<NN-slug>`
(later commits: `💄 style(concepts): …` or `🐛 fix(concepts): …`). Never
commit `node_modules`, `dist` or `.astro`. Don't push or deploy.

## Report back

Fit-for-purpose scores and verdict; angle, composition and signature moment
in two sentences; headline, subline and button labels as shipped with each
claim's receipt and what the copy pass cut; brand (mark idea, hex palette,
typefaces); generated images; what you took from each anchor; first-screen
words; persona findings and changes; tools and why; QA summary (FAIL and warn
counts, JS gz, dist size); placeholders left; what didn't work.
