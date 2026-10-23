# Changelog


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
