# @open-wa/runtime-node










## 5.1.6
<sub>2026-10-16</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.4

## 5.1.5
<sub>2026-10-16</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.3

## 5.1.4
<sub>2026-10-15</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.2

## 5.1.3
<sub>2026-10-14</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.1

## 5.1.2
<sub>2026-10-14</sub>

- *(patch)* Updated dependency `@open-wa/schema` v5.6.0

## 5.1.1
<sub>2026-10-12</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.5.1

## 5.1.0
<sub>2026-10-12</sub>

- [#3503](https://github.com/open-wa/wa-automate-nodejs/pull/3503)  *(minor)*
  - ✨ Add the public licensed-calling audio preview: bound Call controls, file and stream audio, recordings, remote media helpers and the Calls dashboard.
  - 🔒️ Calling uses the existing licensed patch delivery; expected availability failures log an actionable reason without stopping messaging.
  - ♻️ Own call media in scoped resources and finalize recordings on observed call end, media failure, disconnect and browser recovery.
- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  Remove browser downloads during CLI installation, prefer installed Chrome, and prompt for Chrome, Chromium or Lightpanda when a browser is missing. Explicit browser flags provision on demand and reuse persistent per-user caches on subsequent runs.

  Use stable Effect v4 for provisioning locks, temporary files, download retries and browser preference validation, and update the Effect package family together.

## 5.0.2
<sub>2026-09-29</sub>

- [#3465](https://github.com/open-wa/wa-automate-nodejs/pull/3465)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Bundle the matched Effect Node platform adapters so a fresh install cannot resolve an incompatible prerelease shared adapter and fail before startup.

## 5.0.1
<sub>2026-09-29</sub>

- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.

## 5.0.0

### Patch Changes

- Updated dependencies []:
  - @open-wa/runtime-core@5.0.0
