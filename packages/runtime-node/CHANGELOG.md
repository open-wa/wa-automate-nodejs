# @open-wa/runtime-node

## 5.10.0

- Align the public package version with the OpenWA 5.10.0 release.
























## 5.1.20
<sub>2026-10-28</sub>

-  *(patch)*
  Add a standalone Jev chat assistant and share its decision/action engine with Voxtral. Enforce booking correction masks, retain literal source spans and decision distributions, and resolve dates in the agreed timezone from a captured turn instant. Add Neo controls, shared conversation services, and matching terminal/docs builder options.

  Export the plugin SDK for both ESM and CommonJS consumers. Treat recorded conversation memory as valid reply evidence and remove submitted formats from the current turn’s action choices so completed requests finish without duplicate attempts. Classify each requested message format independently and retain unfinished formats across the turn, while keeping irrelevant fan-out facts out of conversational prompts. Retire superseded call responses before new playback and queue a bounded two-packet lead to absorb brief browser RPC stalls.

  Make decision routing aware of the response channel, retain explicit AM/PM punctuation from speech, give multi-format requests bounded repair capacity per format, and narrow correction fields again during proposal review. Preserve hydrated call method descriptors when applying chat-scope hooks.

  After an interruption or changed question, answer the latest request without resuming the interrupted explanation.
-  *(patch)*
  Keep live-call speech continuous with one playback clock, a bounded speech prebuffer and 80 ms browser packets. Prevent browser request latency from stretching audio into repeated gaps, flush final speech packets, and retain immediate interruption clearing.

  Use the same buffered packet clock for file microphones. Wait for the realtime transcription delay after a turn ends before acting on its final words, and retain redacted provider error details for diagnosis.

  Reconnect dropped transcription sessions on the existing call with bounded retries. Cancel idle microphone readers before joining their audio pumps so replacing call media cannot hang during recovery.

  Keep live transcription listening when an individual answer or speech request fails. Show the error without disconnecting the call; a new caller turn clears it and can respond without reconnecting or replaying actions.

## 5.1.19
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.7

## 5.1.18
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.6

## 5.1.17
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.5

## 5.1.16
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.4

## 5.1.15
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.3

## 5.1.14
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.2

## 5.1.13
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.1

## 5.1.12
<sub>2026-10-24</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.9.0

## 5.1.11
<sub>2026-10-23</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.8.0

## 5.1.10
<sub>2026-10-23</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.7.0

## 5.1.9
<sub>2026-10-22</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.7

## 5.1.8
<sub>2026-10-16</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.6

## 5.1.7
<sub>2026-10-16</sub>

- *(patch)* Updated dependency `@open-wa/core` v5.6.5

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
