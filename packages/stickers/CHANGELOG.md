# Changelog






## 5.6.3
<sub>2026-10-16</sub>

-  *(patch)*
  - 🐛 Make `createSticker()` manage warm renderers and idle cleanup automatically, queue bursts before loading inputs, and recover individual failed workers without stalling later jobs.
  - ⚡️ Process standalone jobs with a small CPU-aware worker pool and yield during browser effects to keep the page responsive.

## 5.6.2
<sub>2026-10-15</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.6.2, `@open-wa/client` v5.6.2, `@open-wa/core` v5.6.2, `@open-wa/logger` v5.6.2, `@open-wa/session-sync` v5.6.2, `@open-wa/wa-automate` v5.6.2

## 5.6.1
<sub>2026-10-14</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.6.1

## 5.6.0
<sub>2026-10-14</sub>

- *(minor)* Version bump from group with `@open-wa/api` v5.6.0, `@open-wa/config` v5.6.0, `@open-wa/core` v5.6.0, `@open-wa/hyperemitter` v5.6.0, `@open-wa/mcp` v5.6.0, `@open-wa/schema` v5.6.0, `@open-wa/socket-client` v5.6.0

## 5.5.1
<sub>2026-10-12</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.5.1

## 5.5.0
<sub>2026-10-12</sub>

- [#3520](https://github.com/open-wa/wa-automate-nodejs/pull/3520)  *(minor)*
  Add a lazy local sticker package and CLI with automatic whole-job backend selection,
  ordered shared recipes, bounded executors and typed sticker sending through the
  private donor finalizer.
