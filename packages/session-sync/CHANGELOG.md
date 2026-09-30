# @open-wa/session-sync




## 5.3.0
<sub>2026-09-30</sub>

- [#3471](https://github.com/open-wa/wa-automate-nodejs/pull/3471)  *(minor)* Thanks [@smashah](https://github.com/smashah)!
  Make compact encrypted session files the default authentication method. The baked pre-init patch restores authentication and an acknowledged pending inbox from `{sessionId}.data.json`, without retaining a persistent browser profile. Existing file/path and seed settings remain available, and S3 persistence uses the existing PicoS3 transport with conditional ownership and writes.

  Set `legacyDataDirAuth: true` to keep the previous profile authentication behavior and an existing linked profile. First use of compact authentication requires pairing; obsolete token JSON and profile directories are not automatically converted. Unsupported WhatsApp builds and drivers must use the legacy fallback. There is no public `portableSession` option or caller-supplied encryption key.

  Incoming message handlers acknowledge pending messages after successful processing; retries remain at least once. This release has not received integrated browser/S3 acceptance, and abrupt-crash durability for all native operations is not established.

## 5.2.0
<sub>2026-09-29</sub>

- *(minor)* Version bump from group with `@open-wa/client` v5.2.0, `@open-wa/config` v5.2.0, `@open-wa/core` v5.2.0, `@open-wa/driver-interface` v5.2.0, `@open-wa/driver-puppeteer` v5.2.0, `@open-wa/schema` v5.2.0, `@open-wa/wa-automate` v5.2.0

## 5.1.0
<sub>2026-09-29</sub>

- [#3453](https://github.com/open-wa/wa-automate-nodejs/pull/3453)  *(patch)* Thanks [@smashah](https://github.com/smashah)!
  Keep local Bun development on TypeScript source while publishing entry points that resolve the distributed files. npm packages no longer inherit workspace-only source conditions.
- *(minor)* Version bump from group with `@open-wa/api` v5.1.0, `@open-wa/client` v5.1.0, `@open-wa/core` v5.1.0, `@open-wa/schema` v5.1.0, `@open-wa/wa-automate` v5.1.0

## 5.0.0

### Patch Changes

- Updated dependencies [[`6a55aef`](https://github.com/open-wa/wa-automate-nodejs/commit/6a55aef602b347bfffc8550e448585e7776baf18)]:
  - @open-wa/schema@5.0.0

## 5.0.0-alpha.7

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.7

## 5.0.0-alpha.6

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.6

## 5.0.0-alpha.5

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.5

## 5.0.0-alpha.4

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.4

## 5.0.0-alpha.3

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.3

## 5.0.0-alpha.2

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@5.0.0-alpha.2

## 6.0.0-alpha.2

### Minor Changes

- Dry run minor bump

### Patch Changes

- Updated dependencies []:
  - @open-wa/schema@6.0.0-alpha.2

## 5.0.1-alpha.2

### Patch Changes

- Dry run patch bump

- Updated dependencies []:
  - @open-wa/schema@5.0.1-alpha.2
