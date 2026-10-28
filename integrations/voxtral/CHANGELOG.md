# Changelog











## 5.10.0
<sub>2026-10-28</sub>

-  *(minor)*
  Add a standalone Jev chat assistant and share its decision/action engine with Voxtral. Enforce booking correction masks, retain literal source spans and decision distributions, and resolve dates in the agreed timezone from a captured turn instant. Add Neo controls, shared conversation services, and matching terminal/docs builder options.

  Export the plugin SDK for both ESM and CommonJS consumers. Treat recorded conversation memory as valid reply evidence and remove submitted formats from the current turn’s action choices so completed requests finish without duplicate attempts. Classify each requested message format independently and retain unfinished formats across the turn, while keeping irrelevant fan-out facts out of conversational prompts. Retire superseded call responses before new playback and queue a bounded two-packet lead to absorb brief browser RPC stalls.

  Make decision routing aware of the response channel, retain explicit AM/PM punctuation from speech, give multi-format requests bounded repair capacity per format, and narrow correction fields again during proposal review. Preserve hydrated call method descriptors when applying chat-scope hooks.

  After an interruption or changed question, answer the latest request without resuming the interrupted explanation.
-  *(minor)*
  Share an OpenUI component catalogue across agent plugins, native WhatsApp sends and Neo Chat previews. Add message and reply previews to Voxtral, validate booking destinations, and preserve Jev format selection and correlated voice responses.
-  *(minor)*
  Let Jev choose chat actions during Voxtral calls and voice notes, including text, confirmation templates, buttons, lists, forms and booking cards. Show selected formats and delivery states in Neo Chat, feed interactive replies into the conversation, and include Jev setup in generated projects.
-  *(minor)*
  Add the official Voxtral assistant for conversational WhatsApp voice notes and
  live audio calls, with a plugin-provided Neo dashboard page, saved settings,
  voice preview, conversation context, and shared call controls.

  Show transcripts, assistant status, and per-chat controls in Neo's normal Chat
  feed through plugin-provided chat components.

  Load configured plugins in Easy API and expose host-side media/calling services
  to plugins. Plugin pages can supply native page modules and request host route
  authentication.
-  *(patch)*
  Validate and normalize booking timestamps with a shared branded Effect codec so Android displays the appointment date and time alongside its location. Preserve Effect decoding, encoding and schema metadata in the serving projection, and describe request inputs separately from normalized outputs in the API reference. Reject invalid dates and ranges that collapse at whole-second precision before sending.
-  *(patch)*
  Install missing configured npm plugins on demand and reuse their local cache.
  Load JavaScript and TypeScript config files with the same module handling, and
  simplify Voxtral setup to a config entry without a separate plugin installation.
-  *(patch)*
  Send requested cards without asking for optional personal details. Keep form requirements separate from booking requirements, repair invalid generated fields, and calculate booking timestamps and displayed times from the appointment timezone, including daylight-saving transitions.
-  *(patch)*
  Correct the latest booking card through voice notes or calls. Jev recognizes a correction, the plugin preserves unchanged details, and the corrected card is submitted before the original is removed. Report failed or unconfirmed removal without losing the replacement or claiming to change an external reservation.
-  *(patch)*
  Keep live-call speech continuous with one playback clock, a bounded speech prebuffer and 80 ms browser packets. Prevent browser request latency from stretching audio into repeated gaps, flush final speech packets, and retain immediate interruption clearing.

  Use the same buffered packet clock for file microphones. Wait for the realtime transcription delay after a turn ends before acting on its final words, and retain redacted provider error details for diagnosis.

  Reconnect dropped transcription sessions on the existing call with bounded retries. Cancel idle microphone readers before joining their audio pumps so replacing call media cannot hang during recovery.

  Keep live transcription listening when an individual answer or speech request fails. Show the error without disconnecting the call; a new caller turn clears it and can respond without reconnecting or replaying actions.
-  *(patch)* - Discard all queued assistant speech when a caller interrupts, including frames waiting for the call host to read them.
-  *(patch)* - Clear failed call errors after successful retry and show terminal calls as ended.
-  *(patch)* - Retain voice-note and text delivery acknowledgements that arrive before submission returns a message ID.
-  *(patch)*
  Execute Jev-selected chat actions on the first complete request without redundant confirmation. Ask for missing booking facts before exposing the send tool, and keep ordinary spoken questions from resending earlier chat actions.
-  *(patch)*
  Reassess each exchange with Jev using recent actions, real tool outcomes and proposed speech. Advance unfinished requests, repair invalid arguments and definitely-not-sent failures, and revise unsupported replies before speaking. Preserve deduplication and reconcile uncertain sends without resubmitting them.
-  *(patch)* - Explain how to select an available answer model when Mistral reports zero request quota for the configured model.
-  *(patch)*
  Pass verified button and form selection context to Jev. Render conversational acknowledgements directly from the validated choices in voice notes and calls, so the answer model cannot promise an external booking change, schedule a reminder or resend the original form when the person only tapped a choice.
-  *(patch)*
  Convert Mistral's float32 speech PCM to signed 16-bit audio before voice-note encoding and call playback. Preserve split samples across streaming chunks and reject malformed audio instead of sending distorted speech.

## 5.9.7
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/api` v5.9.7, `@open-wa/socket-client` v5.9.7

## 5.9.6
<sub>2026-10-24</sub>

-  *(patch)* - Clear failed call errors after successful retry and show terminal calls as ended.

## 5.9.5
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.5

## 5.9.4
<sub>2026-10-24</sub>

-  *(patch)*
  Convert Mistral's float32 speech PCM to signed 16-bit audio before voice-note encoding and call playback. Preserve split samples across streaming chunks and reject malformed audio instead of sending distorted speech.

## 5.9.3
<sub>2026-10-24</sub>

- *(patch)* Version bump from group with `@open-wa/core` v5.9.3

## 5.9.2
<sub>2026-10-24</sub>

-  *(patch)* - Explain how to select an available answer model when Mistral reports zero request quota for the configured model.

## 5.9.1
<sub>2026-10-24</sub>

-  *(patch)* - Retain voice-note and text delivery acknowledgements that arrive before submission returns a message ID.
-  *(patch)* - Discard all queued assistant speech when a caller interrupts, including frames waiting for the call host to read them.

## 5.9.0
<sub>2026-10-24</sub>

- *(minor)* Version bump from group with `@open-wa/config` v5.9.0, `@open-wa/create` v5.9.0, `@open-wa/wa-automate` v5.9.0

## 5.8.0
<sub>2026-10-23</sub>

-  *(patch)*
  Install missing configured npm plugins on demand and reuse their local cache.
  Load JavaScript and TypeScript config files with the same module handling, and
  simplify Voxtral setup to a config entry without a separate plugin installation.
- *(minor)* Version bump from group with `@open-wa/core` v5.8.0

## 5.7.0
<sub>2026-10-23</sub>

-  *(minor)*
  Add the official Voxtral assistant for conversational WhatsApp voice notes and
  live audio calls, with a plugin-provided Neo dashboard page, saved settings,
  voice preview, conversation context, and shared call controls.

  Show transcripts, assistant status, and per-chat controls in Neo's normal Chat
  feed through plugin-provided chat components.

  Load configured plugins in Easy API and expose host-side media/calling services
  to plugins. Plugin pages can supply native page modules and request host route
  authentication.
