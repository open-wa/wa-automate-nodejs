# Jev for open-wa

A chat assistant that chooses WhatsApp text, templates, reply buttons, lists,
forms and booking cards. It works without Voxtral. Jev makes bounded decisions,
Mistral composes wording, and open-wa owns state and executes the selected action.

```bash
npm init @open-wa@latest chat-assistant -- --plugins jev
cd chat-assistant
```

Choose Easy API or SDK and JavaScript or TypeScript. Copy `.env.example` to
`.env`, set `MISTRAL_API_KEY` and `JEV_API_KEY`, then run `npm start`. The plugin
is installed on demand. The [project builder](https://openwa.dev/new?plugins=jev)
uses the same options.

For an existing project, add `@open-wa/integration-jev` to `plugins` in
`wa.config.js` or `wa.config.ts`. No separate install or config flag is needed.

```js
export default {
  plugins: ['@open-wa/integration-jev'],
  pluginConfig: {
    jev: {
      agent: { instructions: ['Help people arrange demo appointments.', 'Send the requested details in this chat.'] },
      conversation: { timeZone: 'Europe/London' },
    },
  },
};
```

In Neo, open **Plugins → Jev** to edit settings. Normal **Chat** shows controls,
OpenUI message previews, submitted/read states and expandable decision evidence.
SDK mode runs the same assistant without an HTTP dashboard. Keys remain on the
host; they are never included in settings responses.

Add `@open-wa/integration-voxtral` for voice notes and calls. Voxtral depends on
the shared Jev engine automatically; configuring the Jev plugin additionally
enables plain text conversations. Both share context, booking state, pause
controls and a send journal. Reply selections during a live call go to that
call; other selections return to the adapter that sent the control, with text handling call selections after a call ends. Queued text
waits until the call ends. Each channel can have its own agent instructions and
model settings.

Booking corrections preserve fields that Jev didn't identify as changed. The
host copies selected literal times, phone numbers, URLs and references from
source spans, and calculates dates in the agreed timezone. “Tomorrow” uses one
captured turn instant. A bare weekday means its next occurrence on or after the
reference day; “this” uses the current Monday-based week and “next” the following
week. A missing year means the next occurrence of the supplied month/day.
Nonexistent dates and ambiguous/nonexistent DST times require clarification.
Unknown prose such as a new location still comes from Mistral and is reviewed by
Jev. Incorrect transcripts can still produce incorrect facts.

Interactive messages require the corresponding open-wa license. Without that
capability, Jev can choose text and formatted text templates. A booking card is a
chat message: it doesn't create or change a reservation in a booking system.
The host sends a corrected card before attempting to delete its predecessor,
and reports the actual removal result. Unknown sends aren't automatically retried.

The action journal and settings are stored under `.open-wa/plugins/`; recent
conversation context is in memory and expires after 30 minutes of inactivity by
default. Restarting clears that context.
