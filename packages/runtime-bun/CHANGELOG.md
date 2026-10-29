# @open-wa/runtime-bun

## 5.10.0

- Align the public package version with the OpenWA 5.10.0 release.



## 5.0.2
<sub>2026-10-12</sub>

- [#3521](https://github.com/open-wa/wa-automate-nodejs/pull/3521)  *(patch)*
  Remove browser downloads during CLI installation, prefer installed Chrome, and prompt for Chrome, Chromium or Lightpanda when a browser is missing. Explicit browser flags provision on demand and reuse persistent per-user caches on subsequent runs.

  Use stable Effect v4 for provisioning locks, temporary files, download retries and browser preference validation, and update the Effect package family together.

## 5.0.1
<sub>2026-09-29</sub>

- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.

## 5.0.0

### Patch Changes

- Updated dependencies []:
  - @open-wa/runtime-core@5.0.0
