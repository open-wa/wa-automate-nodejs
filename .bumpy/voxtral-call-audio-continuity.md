---
"@open-wa/integration-voxtral": patch
"@open-wa/runtime-node": patch
---

Keep live-call speech continuous with one playback clock, a bounded speech prebuffer and 80 ms browser packets. Prevent browser request latency from stretching audio into repeated gaps, flush final speech packets, and retain immediate interruption clearing.

Use the same buffered packet clock for file microphones. Wait for the realtime transcription delay after a turn ends before acting on its final words, and retain redacted provider error details for diagnosis.

Reconnect dropped transcription sessions on the existing call with bounded retries. Cancel idle microphone readers before joining their audio pumps so replacing call media cannot hang during recovery.

Keep live transcription listening when an individual answer or speech request fails. Show the error without disconnecting the call; a new caller turn clears it and can respond without reconnecting or replaying actions.
