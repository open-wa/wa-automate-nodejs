# Changelog









## 5.10.0
<sub>2026-10-28</sub>

-  *(minor)*
  Add a standalone Jev chat assistant and share its decision/action engine with Voxtral. Enforce booking correction masks, retain literal source spans and decision distributions, and resolve dates in the agreed timezone from a captured turn instant. Add Neo controls, shared conversation services, and matching terminal/docs builder options.

  Export the plugin SDK for both ESM and CommonJS consumers. Treat recorded conversation memory as valid reply evidence and remove submitted formats from the current turn’s action choices so completed requests finish without duplicate attempts. Classify each requested message format independently and retain unfinished formats across the turn, while keeping irrelevant fan-out facts out of conversational prompts. Retire superseded call responses before new playback and queue a bounded two-packet lead to absorb brief browser RPC stalls.

  Make decision routing aware of the response channel, retain explicit AM/PM punctuation from speech, give multi-format requests bounded repair capacity per format, and narrow correction fields again during proposal review. Preserve hydrated call method descriptors when applying chat-scope hooks.

  After an interruption or changed question, answer the latest request without resuming the interrupted explanation.
-  *(minor)*
  Create Easy API and SDK projects through npm init @open-wa with shared JS/TS,
  browser, plugin and Voxtral options. Add the matching docs-site project builder
  with copyable commands, file previews and shareable settings.
-  *(patch)*
  Let Jev choose chat actions during Voxtral calls and voice notes, including text, confirmation templates, buttons, lists, forms and booking cards. Show selected formats and delivery states in Neo Chat, feed interactive replies into the conversation, and include Jev setup in generated projects.

## 5.9.7
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.7, `@open-wa/socket-client` v5.9.7

## 5.9.6
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.6, `@open-wa/core` v5.9.6, `@open-wa/integration-voxtral` v5.9.6

## 5.9.5
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.5

## 5.9.4
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.4, `@open-wa/core` v5.9.4, `@open-wa/driver-puppeteer` v5.9.4, `@open-wa/integration-voxtral` v5.9.4

## 5.9.3
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.3

## 5.9.2
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.2, `@open-wa/decrypt` v5.9.2, `@open-wa/integration-voxtral` v5.9.2

## 5.9.1
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/integration-voxtral` v5.9.1

## 5.9.0
<sub>2026-10-24</sub>

-  *(minor)*
  Create Easy API and SDK projects through npm init @open-wa with shared JS/TS,
  browser, plugin and Voxtral options. Add the matching docs-site project builder
  with copyable commands, file previews and shareable settings.
