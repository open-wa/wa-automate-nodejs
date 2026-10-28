# Voxtral for open-wa

Create a new voice assistant through the open-wa setup wizard:

```bash
npm init @open-wa@latest voice-assistant -- --mode easy-api --plugins voxtral
cd voice-assistant
```

Choose JS or TS, your browser, and Voice notes, Calls, or Both. Copy
`.env.example` to `.env`, set `MISTRAL_API_KEY`, `JEV_API_KEY` for chat actions, and the calling license when
needed, then run `npm start`. The [project builder](https://openwa.dev/new?plugins=voxtral)
offers the same choices with file previews.

The official Easy API plugin for conversational WhatsApp voice notes and live
audio calls can also be added to an existing Easy API project. Set
`MISTRAL_API_KEY` and add it to `wa.config.js` or `wa.config.ts`:

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
When someone asks during a call or voice note, Jev chooses the appropriate chat
action: text, a confirmation template, buttons, a choice list, a form, or a native
booking card. Set `JEV_API_KEY` on the Easy API host. Voxtral fills only the
selected format and asks only for missing required details. Booking dates and
displayed times are calculated by the plugin from the local date, time and
timezone. Forms and buttons do not require booking details.
To correct the latest card, say “No, I said 2 pm.” Voxtral keeps its other
details, sends a corrected card, then removes the old one. If removal cannot be
confirmed, it reports that the old card may still be visible. Corrections work
in voice notes and calls while the card remains in the conversation context.
Rich formats require an interactive-messaging license; Jev chooses among the
formats available to the session. Templates are formatted text confirmations,
not Meta-approved business templates.

Chat actions are enabled by default; turn off **Edit assistant → Chat actions →
Send messages when asked** or set `actions: { sendMessage: false }` inside
`pluginConfig.voxtral`. **Choose format** previews Jev's decision without sending
a WhatsApp message. Chat shows the chosen format, message details and actual
submission/delivery state. Button, list and form replies to the assistant's own
messages return to the conversation, through the active call or voice notes.
In calls-only mode, selections outside a call are retained for the next call.

Jev evaluates each user turn, proposed message content, action result and spoken reply.
It receives recent conversation and actual submission outcomes, so it can advance
an unfinished request, repair rejected arguments, retry a definitely-not-sent
operation, ask for missing information or reconcile an uncertain result. A turn
can build more than one requested message, such as a booking card followed by
reply buttons. Accepted and uncertain sends are not repeated. The same loop
runs for calls, voice notes and replies to interactive messages.

The assistant waits for the send result and reply review before acknowledging it aloud. Sending
booking details does not create a reservation or update a booking system.
Without a Jev key, voice conversations continue but chat actions are unavailable.
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
to your Mistral account. When chat actions are enabled, the latest request and a
bounded excerpt of recent conversation, action results and proposed replies go
to Jev for decisions and response review.

The plugin page is an ES module supplied by this package. Neo supplies its React
instance, BoardUI components, authenticated requests, privacy controls, and the
shared call controller. Its `chat.js` module contributes to the existing Chat
toolbar and timeline through the same host, with transcripts attached to their
original WhatsApp messages where available.

See the [guide](../../apps/docs/content/docs/guides/voxtral.mdx) and
[implementation contract](../../docs/plans/2026-10-20-voxtral-integration.md).

## Text conversations with Jev

Voxtral uses the shared Jev decision and action engine. Add
`@open-wa/integration-jev` to `plugins` to also answer ordinary text messages,
or select Jev alongside Voxtral in the setup wizard. They share recent context,
booking cards and send outcomes. During a live call, button and form replies
return through call audio. See the [Jev guide](/docs/guides/jev) for setup,
correction rules, dates and decision evidence.
