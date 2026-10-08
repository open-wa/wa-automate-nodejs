# open-wa landing-page concepts

Eight competing landing-page directions for open-wa v5. Each concept is a
standalone Astro static site with its own `package.json`, lockfile and
`node_modules`. The whole set is served from one host, one folder per slug,
with a generated gallery at `/`.

None of this is part of the pnpm workspace or the published packages.

## Concepts

| Slug | Direction | World | Brand mono |
| --- | --- | --- | --- |
| `departures` | Metaphor | Split-flap departures board: every message is a departure to a destination | yes |
| `shader` | Serious dev tool | Precise dark product page with a live shader hero | yes |
| `terminal` | Interactive terminal | The page is a shell you can type into | yes |
| `editorial` | Editorial | A long-read magazine feature about seven years of open-source WhatsApp automation | no |
| `blueprint` | Technical drawing / 3D | Exploded isometric drawing of the runtime, drawn on scroll | yes |
| `explorer` | Product-marketing explorer | Bright, playful, hands-on explorer of what you can build, starring Wally | no |
| `scrollstory` | Cinematic scroll story | One message's journey from your server to a phone, told in pinned scenes | no |
| `transit` | Metaphor | Transit map: each way of using open-wa is a line, each package a station | no |

## Rules

- Each concept lives in `concepts/<slug>/` and touches nothing outside it.
- Install with `pnpm install --ignore-workspace`. Every concept carries
  `.npmrc` with `shamefully-hoist=true`. Without it, Astro's prerender step
  resolves transitive dependencies such as `cookie` from the monorepo's root
  `node_modules` and the build fails.
- Astro static output, `base: "/<slug>/"`. Reference public assets through
  `import.meta.env.BASE_URL`, never a hard-coded `/`.
- One page per concept: `src/pages/index.astro`.
- Each concept has a `concept.json` (see `_template/concept.json`).
- Pin dependency versions that are at least two weeks old. Same-day releases
  fail installs under `minimumReleaseAge` and have broken builds before
  (Astro 7.3.8 on its release day).
- Light JS budget: aim for under 200 KB gzipped of first-party plus library JS,
  excluding a WebGL library if the concept needs one.
- Phones are designed, not squeezed. Respect `prefers-reduced-motion`. Every
  interactive element is reachable and usable by keyboard.
- A favicon derived from the concept's own logo.
- Avoid file or folder names the root `.gitignore` swallows: anything
  containing `logs`, `session`, `_IGNORE_`, `.ignore`, or named `buttons.js`
  or `req.ts`. Check with `git check-ignore -v <path>`.

## Shared assets

- `_shared/fonts/AnalogMonoPlus.ttf`: the open-wa brand mono. See
  `_shared/fonts/LICENSE.md`.
- Wally mascot art lives in `apps/docs/public/mascots/`. Copy what a concept
  uses into its own `public/`.

## Build and publish

```bash
bash concepts/build-all.sh   # builds every committed concept into concepts/_site
bash concepts/deploy.sh      # build-all, then wrangler deploy to the concepts host
```

`build-all.sh` only builds concepts whose `concept.json` is committed, reuses
each concept's existing `node_modules`, and refuses to produce an empty site.
`deploy.sh` needs `CLOUDFLARE_API_TOKEN` and the account id filled in
`wrangler.toml`.

`node tools/relativize.mjs` turns `_site` into `_artifact`, a copy with every
absolute `/<slug>/` URL rewritten relative, for hosts that serve the set from
a sub-path.
