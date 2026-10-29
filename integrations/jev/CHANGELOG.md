# Changelog

## 5.10.0

- Align the public package version with the OpenWA 5.10.0 release.

## 5.7.0
<sub>2026-10-28</sub>

-  *(minor)*
  Add a standalone Jev chat assistant and share its decision/action engine with Voxtral. Enforce booking correction masks, retain literal source spans and decision distributions, and resolve dates in the agreed timezone from a captured turn instant. Add Neo controls, shared conversation services, and matching terminal/docs builder options.

  Export the plugin SDK for both ESM and CommonJS consumers. Treat recorded conversation memory as valid reply evidence and remove submitted formats from the current turn’s action choices so completed requests finish without duplicate attempts. Classify each requested message format independently and retain unfinished formats across the turn, while keeping irrelevant fan-out facts out of conversational prompts. Retire superseded call responses before new playback and queue a bounded two-packet lead to absorb brief browser RPC stalls.

  Make decision routing aware of the response channel, retain explicit AM/PM punctuation from speech, give multi-format requests bounded repair capacity per format, and narrow correction fields again during proposal review. Preserve hydrated call method descriptors when applying chat-scope hooks.

  After an interruption or changed question, answer the latest request without resuming the interrupted explanation.
