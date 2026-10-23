# Official Voxtral integration

Status: implemented on 20 October 2026; prepared for publication on 23 October.
The actual Easy API process loaded
and registered the plugin, and Neo rendered its page and assistant settings
sheet. The local preview has neither a paired WhatsApp session nor a Mistral
key, so voice-note exchanges, provider audio, live calls, acknowledgements, and
human takeover have not been exercised end to end. No tests, standalone typechecks, or lint checks were run. Publication artifact
builds are part of the authorized release. Package and guide availability must
be confirmed from the registry and live documentation after deployment.

## Customer contract

Install `@open-wa/integration-voxtral` beside Easy API, set `MISTRAL_API_KEY`, add
`plugins: ['@open-wa/integration-voxtral']` to `config.js`, and run Easy API with
`--config ./config.js`. The same process owns WhatsApp, provider requests,
conversation state, and call audio. The package includes its voice-note encoder
through `ffmpeg-static` and requires no separate service or system encoder.
Calling uses the existing OpenWA calling license and media host.

`mode` accepts `voice-notes` (default), `calls`, or `both`. Instructions accept a
string or array; the plugin trims and joins arrays, removes blank entries, and
uses default instructions for an empty result. Nested settings receive schema
defaults. An explicit nonblank key takes precedence over the environment. Keys
never enter the plugin's settings API, saved overrides, or config export.

The guide at `apps/docs/content/docs/guides/voxtral.mdx` describes the requested
finished customer experience. It isn't evidence of npm publication or successful
provider/WhatsApp exchanges.

## Runtime

`integrations/voxtral/src/config.ts` owns defaults and normalization. Defaults:

- Voice-note transcription: `voxtral-mini-transcribe-3-0`.
- Realtime transcription: `voxtral-mini-transcribe-realtime-3-0`.
- Speech: `voxtral-mini-tts-3-0`, voice `voice_478`.
- Answers: `mistral-small-latest`; automatic language detection.
- Thirty-minute idle history, at most forty history messages and 32,000
  characters; sixty recent display turns.
- Voice-note text copies and typed follow-ups disabled.
- Calls answered automatically in a calls-enabled mode, with an AI greeting
  after the observed call becomes active. Manual answering is configurable.

`service.ts` coordinates direct incoming messages, four concurrent conversations,
serialized turns per person, bounded queues, pause/reset, delivery states,
provider usage, and call ownership. Voice notes received during the same person's
call wait until the call ends. Identity uses the exact host-supplied peer ID;
phone/LID aliases aren't guessed or merged.

`provider.ts` implements file transcription, streamed/nonstreamed answers, JSON
speech output, PCM SSE speech, and voice discovery. Automatic language detection
omits the provider language field. Vocabulary hints are trimmed and deduplicated.
Errors expose status and recovery instructions without provider response bodies.

`audio.ts` converts generated mono 24 kHz PCM to Ogg Opus for voice notes through
the bundled encoder. Calls use a stateful 24 kHz to 16 kHz resampler, clocked
20 ms PCM frames, and a bounded queue with backpressure.

`live-call.ts` configures realtime PCM16LE mono 16 kHz transcription before
accepting audio. End-of-turn detection starts answer generation; completed
phrases enter streamed speech synthesis. Caller interruption aborts old answer
and speech work and clears outgoing call audio. Reconnect/resume creates a new
provider pipeline on the same current call generation without redialling or
repeating its greeting. No benchmark latency claim is made.

Human takeover prepares browser audio through the existing call controller and
explicitly replaces assistant media. A receive-only observer retains the caller's
words while AI replies are suppressed. The human microphone isn't transcribed;
the operator can supply a handoff summary before returning to the assistant.
Assistant turns marked Sent to call audio mean samples entered the playback path,
not that the remote participant heard them.

## Neo: conversations stay in Chat

The plugin supplies two self-contained browser modules using Neo's React and
shared components. No iframe or second copy of React is used.

- `src/chat.js` contributes to the existing Chat toolbar and timeline. Incoming
  transcripts attach to the original voice note; outgoing assistant turns attach
  to their returned message IDs when loaded. Unmatched turns and call transcripts
  appear in time order. Controls include per-chat pause, clear AI context,
  assistant calling, human takeover, return, mute, recovery, and end call.
- `src/dashboard.js` supplies Plugins → Voxtral for settings, mode, global pause,
  voice preview, usage, and a paged recent-conversation list linking into Chat.
  Edit assistant uses Neo's DetailSheet. Privacy settings redact conversation
  names and text. Usage explicitly identifies missing realtime/interrupted data.

`docs/design/voxtral-dashboard-wireframe.svg` illustrates the Chat-first layout
with labelled sample content; it is a wireframe, not an actual call screenshot.

## Host changes

| Area | Implementation |
| --- | --- |
| Plugin SDK / PluginHost | `runtime.invoke()` reaches the attached high-level Client facade without a core/client dependency cycle. `pages[].module` and `chat.module` enter the manifest. |
| Client facade | Binds the host runtime invoker for media decryption, voice-note sending, and hydrated Call objects with Web streams. |
| Easy API startup | Forwards configured plugin references and per-plugin settings, then mounts plugin routes before client startup. |
| Plugin route authentication | `routeAuth: 'host'` requires the configured API key; without one it permits only local access with same-origin browser requests. |
| Neo module loader | Authenticated, plugin-scoped fetch, shared React/UI/hooks, component error boundaries, and no API key in event URLs. |
| Neo Chat | Generic plugin contributions augment native messages and the toolbar; plugins own their data and components. |
| Calls / socket media | Explicit takeover allows native assistant and browser human media to replace one another. Reservation identity prevents a delayed takeover from claiming a newer attachment. |
| Diagnostics | Omits plugin config from startup events and redacts it from the config dump to protect explicitly configured provider keys. |

Injected WhatsApp code is unchanged. `packages/core/src/transport/assets/wapi.js`
remains immutable; this integration operates on the host side.

## Data and lifetime

Recent transcripts and answers live only in memory. Raw audio and call recordings
aren't persisted. Session-specific state is stored under
`.open-wa/plugins/voxtral/<session-hash>/state.json`: validated non-secret
settings overrides, pause choices, bounded message-ID journal, and usage.
Settings apply as defaults → file config → saved overrides, with revision checks
for edits and reset/export controls. Interrupted in-progress sends restored from
disk become unknown and aren't automatically repeated.

Provider requests, streams, encoders, queues, and call observers are cancelled on
their owning lifetime. WhatsApp recovery discards old call attachments. Call
state, media state, generation state, and message acknowledgements remain
separate; accepted actions aren't described as connected calls or delivered
messages. Provider audio and conversation context are sent to Mistral.

## API

All plugin routes are beneath `/plugins/voxtral` and use host route auth.

| Routes | Purpose |
| --- | --- |
| `GET /dashboard.js`, `GET /chat.js` | Plugin browser modules. |
| `GET /status`, `/settings`, `/settings/export` | State, redacted effective settings, environment-based config export. |
| `PATCH /settings`, `POST /settings/reset` | Revision-checked overrides and reset. |
| `GET /voices`, `POST /voice-preview` | Provider voice list and local WAV sample. |
| `GET /conversations`, `/conversations/:id` | Paged summaries and recent in-memory turns. |
| `POST /pause`, `/resume`, `/conversations/:id/pause`, `.../resume`, `.../reset` | Session/person pause and context reset. |
| `POST /calls/start`, `/calls/:id/answer`, `.../reconnect`, `.../resume`, `.../takeover`, `.../mute`, `.../clear` | Explicit current-generation assistant actions. |
| `GET /usage`, `/events` | Usage and coalesced current-state SSE snapshots, including `peer` for the open Chat. |

Reject/end and human audio preparation reuse the shared call controller. SSE
reconnects fetch fresh state; event IDs do not promise replay.

## Provider references

Research used Mistral's official Voxtral 3 announcement, audio guides, and API
schemas on 20 October 2026. Model availability and account permissions still need
an actual provider exchange.

- https://mistral.ai/news/voxtral-3/
- https://docs.mistral.ai/studio/audio/speech-to-text/transcribe-files
- https://docs.mistral.ai/studio/audio/speech-to-text/transcribe-in-realtime
- https://docs.mistral.ai/studio/audio/speech-to-text/turn-detection
- https://docs.mistral.ai/studio/audio/text-to-speech/generate-speech
- https://docs.mistral.ai/studio/audio/text-to-speech/stream-speech
- https://docs.mistral.ai/studio/audio/specs-and-limits/audio-formats
