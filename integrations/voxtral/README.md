# Voxtral for open-wa

The official Easy API plugin for conversational WhatsApp voice notes and live
audio calls. Set `MISTRAL_API_KEY` and save this as `wa.config.js` beside your
Easy API project:

```js title="wa.config.js"
export default {
  plugins: ['@open-wa/integration-voxtral'],
};
```

Easy API discovers `wa.config.js` or `wa.config.ts` automatically. Both accept
`export default`; JavaScript also accepts `module.exports`. Run:

```bash
npx @open-wa/wa-automate
```

The first start installs Voxtral on demand if it's missing, then reuses the
project's `.open-wa/plugins/packages/` cache. You don't need a separate plugin
install command. Only configured plugins are downloaded; Voxtral isn't bundled
with Easy API.

Open a person in Neo's normal Chat view for voice transcripts, replies, delivery
states, call turns, and pause/takeover controls. Open `/dashboard/plugins/voxtral`
to edit the assistant, choose Voice notes, Calls, or Both, preview a voice, and
view usage. Its conversation list opens the same Chat feed.
Voice notes work by default. Calling requires an open-wa calling-enabled license
in the Easy API config. Audio encoding is included through `ffmpeg-static`;
a system FFmpeg installation is not required.

Instructions accept either a string or an array. The plugin handles joining,
nested defaults, and environment-key lookup. Dashboard changes are saved as
per-session overrides; reset them to return to your config file's settings.
Credentials are never included in dashboard responses or saved overrides.

Recent conversation text stays in memory for 30 minutes of inactivity by
default. Raw audio and call recordings are not saved. Local settings, pause
choices, bounded send journals, and usage counters live under
`.open-wa/plugins/voxtral/`. Audio and conversation text used for responses go
to your Mistral account.

The plugin page is an ES module supplied by this package. Neo supplies its React
instance, BoardUI components, authenticated requests, privacy controls, and the
shared call controller. Its `chat.js` module contributes to the existing Chat
toolbar and timeline through the same host, with transcripts attached to their
original WhatsApp messages where available.

See the [guide](https://openwa.dev/docs/guides/voxtral) and
[implementation contract](https://github.com/open-wa/wa-automate-nodejs/blob/master/docs/plans/2026-10-20-voxtral-integration.md).
