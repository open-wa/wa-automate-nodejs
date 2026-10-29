# Jev and Voxtral marketing films

Editable Remotion source and two complete feature tours in the approved OpenWA visual style.

- Voxtral: 71 seconds, voice notes, live calls, chat actions, corrections, controls and setup.
- Jev: 65 seconds, standalone text, action decisions, native replies, scope and optional voice.
- MP4: 1080 × 1350, 30 fps, H.264/AAC, CRF 16.
- GIF: 648 × 810, 15 fps, silent and looping.
- Poster: 1080 × 1350 settled closing card.

Default exports say **Release preview** and explicitly state that npm publication is pending. The aggregate release is prepared as 5.10.0, including the initial Jev package at 5.7.0. Source, native-call observations and focused provider checks are distinguished in [release-manifest.json](./release-manifest.json). These films are not live UI recordings or a guarantee of ASR/audio quality.

## Render

From `marketing/`, use Node.js 22.21.1+:

```sh
npm ci --workspaces=false
npm run render
```

The existing local dependency installation can be reused through an ignored symlink. A fresh checkout installs the pinned standalone dependencies without touching the product workspace lockfile.

`node render.js voxtral` or `node render.js jev` renders one film, its poster and GIF. `node render.js all --posters` produces just the closing-card posters. The default renderer is the installed macOS Chrome; set `REMOTION_CHROME` to another installed supported executable when needed. FFmpeg must be on PATH for GIF production.

After npm manifests/tarballs and the release are verified, `node render.js all --released` produces separate `*-launch.*` exports with released copy. Do not use that flag to imply publication before it actually happens. `npm run studio` opens the editable project.

## Files

- `marketing/src/chapters.json` is the shared visual/audio timing source.
- `marketing/src/films.tsx` contains the scenes and illustrated workflows.
- `marketing/src/theme.tsx` preserves the approved background, header and typography.
- `marketing/sound-design.js` generates original procedural soundtracks.
- `marketing/render.js` renders MP4, GIF and poster outputs.
- `release-manifest.json` records sources, evidence and qualifications.
- `storyboard.md` records the scene timing and content.

Large generated exports, soundtracks, caches and dependencies are intentionally ignored. Keep rendered files from the delivery folder alongside the editable source when sharing. The bundled Inter font retains its OFL license.
