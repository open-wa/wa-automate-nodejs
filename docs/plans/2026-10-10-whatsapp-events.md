# Native WhatsApp events

The public SDK exposes event contracts and transport bindings. The injected implementation is owned by OpenWA Backoffice in `packages/patch-engine/src/features/patch_events.js`. Backoffice's `scripts/generate-event-patch.ts` assembles and obfuscates that source into the common public `patches.json` array; events don't require a licence. Licensed extras retain structured `message.event` serialization when their serializer replaces the base serializer. The public immutable WAPI asset is unchanged. These additions are prepared for review and aren't published.

```ts
const rsvps = client.onEventResponse(response => {
  console.log(response.eventId, response.senderId, response.response);
});

const eventId = await client.sendEvent('447700900123@c.us', {
  name: 'Community meetup',
  startTime: Math.floor(Date.now() / 1000) + 3600,
  description: 'Join us for a chat',
  location: 'London',
});

const event = await client.getEvent(eventId);
const firstPage = await client.getEvents('447700900123@c.us', { limit: 50 });
const responses = await client.getEventResponses(eventId);
await client.editEvent(eventId, { description: 'Updated details' });
// On an invitation received from someone else:
// await client.respondToEvent(invitationId, 'going');
// await client.cancelEvent(eventId);
rsvps.off();
```

`sendEvent()` returns a message ID after native submission. Observe `onAck()` for delivery and read status. `editEvent()`, `cancelEvent()`, and `respondToEvent()` return `true` after their native action completes. A lost response can leave the outcome unknown; inspect the event and its ACK before retrying.

`getEvents(chatId, { limit, before })` queries WhatsApp's locally synced event history, newest first. It returns `{ events, nextCursor }`; pass `nextCursor` as `before` for the next page. `getEvent()` returns `null` if the event is absent from available history. A linked Web device cannot promise a phone's entire unsynced history.

`onEvent()` reports additions and changes to native event snapshots, including this account's sends. `onEventResponse()` observes the decrypted event-response collection rather than the ordinary message stream. History hydration can produce callbacks; deduplicate by response ID and timestamp. `getEventResponses()` returns the latest explicit RSVP per participant; WhatsApp's implicit creator attendance is not fabricated as a response.

Event start/end times and event creation timestamps are Unix seconds. RSVP timestamps are milliseconds. RSVP values are `going`, `notGoing`, `maybe`, or `unknown`; outgoing RSVPs accept the first three. Only the creator can edit or cancel an event. `endTime: null` removes an existing end time; empty description/location removes that field. `callType: 'voice' | 'video'` creates a native call link, and `isScheduledCall: true` requires a call type. Link creation failure rejects before sending. Existing call-link events retain their call type during edits.

Effect schemas describe inputs, updates, snapshots, RSVPs, pagination and results. The existing serving registry projects them for HTTP routes and listener payloads. `serializeWhatsAppEvent()` / `deserializeWhatsAppEvent()` and `serializeEventResponse()` / `deserializeEventResponse()` provide validated JSON round trips. Message snapshots expose their structured event under `message.event`. Message secrets, encryption keys and raw encrypted RSVP bytes are excluded from these contracts.

The original cleanroom native event reached Android WhatsApp 2.26.40.7, and Mohammed confirmed its card and an “I'm going” response. On 2026-10-11, a real Client and Transport attached to the existing linked headful page ran creation, lookup, pagination, edits, field clearing, cancellation, all three outgoing RSVP values, attendance reads, both queued listeners and runtime listener rebinding. Listener payloads passed through the exported Effect JSON serializers. The generated common event payload was installed through `Transport.applyLivePatchArtifacts`, and its methods ran through the SDK.

The attachment didn't run a fresh session bootstrap or the general message/ACK/state bridges, so it doesn't establish whole-client startup acceptance. Later voice/video scheduled-event demos reached both test phones, and their Going/Maybe RSVPs were confirmed and read back through native decrypted history. The recipients showed RSVP and calendar controls without a Join control; a working Join-call UI remains unconfirmed. Private evidence and IDs remain in Backoffice; the public guide contains synthetic examples only.

The user guide, generated method/listener reference, OpenAPI, method types, remote-client bindings and minor Bumpy intent are prepared. Source/artifact generators were run to produce those release files. No tests, typechecks, lint or package builds were run. Production patch upload and release publication remain pending.
