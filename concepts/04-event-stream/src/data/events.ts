// Example output for the event board. Numbers use the UK drama range
// (+44 7700 900xxx); payloads follow the v5 schema field names, trimmed.
import pack from "../../../_shared/content/openwa.json";

export type EventType = "message" | "any" | "ack" | "group" | "rsvp" | "poll";

export const types: { id: EventType; label: string; handler: string; glyph: string }[] = [
  { id: "message", label: "message", handler: "onMessage", glyph: "●" },
  { id: "any", label: "any_message", handler: "onAnyMessage", glyph: "○" },
  { id: "ack", label: "ack", handler: "onAck", glyph: "✓" },
  { id: "group", label: "participants", handler: "onGlobalParticipantsChanged", glyph: "▲" },
  { id: "rsvp", label: "rsvp", handler: "onEventResponse", glyph: "◆" },
  { id: "poll", label: "poll_vote", handler: "onPollVote", glyph: "■" },
];

export const handlers: Record<EventType, string> = {
  message: pack.snippets.socketClient,
  any: `client.onAnyMessage(async (message) => {
  // Fires for messages you send as well as ones you receive
  if (message.fromMe) {
    console.log('sent', message.id, message.body);
  }
});`,
  ack: `client.onAck(async (message) => {
  // ack: 1 sent, 2 delivered, 3 read
  console.log(message.id, message.ack);
});`,
  group: `client.onGlobalParticipantsChanged(async (change) => {
  if (change.action === 'add') {
    await client.sendText(change.groupId, 'Welcome to the group');
  }
});`,
  rsvp: pack.snippets.event,
  poll: `client.onPollVote(async (vote) => {
  console.log(vote.pollId, vote.selectedOptionIds);
});`,
};

const T = 1791830400; // a fixed example Unix time

export interface ExampleEvent {
  type: EventType;
  chat: string;
  summary: string;
  media?: boolean;
  payload: Record<string, unknown>;
}

const msg = (n: string, id: string, body: string, extra: Record<string, unknown> = {}) => ({
  id: `false_44770090${n}@c.us_${id}`,
  from: `44770090${n}@c.us`,
  to: "447700900100@c.us",
  body,
  type: "chat",
  t: T,
  fromMe: false,
  ack: 1,
  isGroupMsg: false,
  ...extra,
});

export const events: ExampleEvent[] = [
  { type: "message", chat: "+44 7700 900123", summary: "“Hi”", payload: msg("0123", "3EB0C4F1A2", "Hi", { notifyName: "Sam" }) },
  { type: "any", chat: "+44 7700 900123", summary: "you: “\u{1F44B} Hello!”", payload: { ...msg("0100", "3EB0D91B7E", "\u{1F44B} Hello!"), id: "true_447700900123@c.us_3EB0D91B7E", from: "447700900100@c.us", to: "447700900123@c.us", fromMe: true, self: "out" } },
  { type: "ack", chat: "+44 7700 900123", summary: "delivered (ack 2)", payload: { id: "true_447700900123@c.us_3EB0D91B7E", ack: 2, fromMe: true, to: "447700900123@c.us" } },
  { type: "rsvp", chat: "Riders Club", summary: "going · Community meetup", payload: { id: "3EB0E2A51C", eventId: "3EB0E07F33", chatId: "120363041234567890@g.us", senderId: "447700900271@c.us", response: "going", timestamp: T * 1000, fromMe: false } },
  { type: "message", chat: "+44 7700 900418", summary: "“Is the 2pm slot still free?”", payload: msg("0418", "3EB0F0C9D8", "Is the 2pm slot still free?", { notifyName: "Priti" }) },
  { type: "poll", chat: "Riders Club", summary: "voted option 1 · Which day suits?", payload: { pollId: "true_120363041234567890@g.us_3EB0A77B10", chatId: "120363041234567890@g.us", id: "3EB0B21C44", senderId: "447700900355@c.us", selectedOptionIds: [1], timestamp: T * 1000, fromMe: false, hideVoterNames: false } },
  { type: "ack", chat: "+44 7700 900123", summary: "read (ack 3)", payload: { id: "true_447700900123@c.us_3EB0D91B7E", ack: 3, fromMe: true, to: "447700900123@c.us" } },
  { type: "group", chat: "Riders Club", summary: "add +44 7700 900590", payload: { groupId: "120363041234567890@g.us", action: "add", participantIds: ["447700900590@c.us"], by: "447700900100@c.us" } },
  { type: "message", chat: "+44 7700 900764", summary: "image · “Order 1042 receipt”", media: true, payload: { ...msg("0764", "3EB0AA19F2", "", { type: "image", caption: "Order 1042 receipt", mimetype: "image/jpeg", isMedia: true }) } },
  { type: "any", chat: "+44 7700 900418", summary: "you: “Booked you in for 2pm.”", payload: { ...msg("0100", "3EB0C55E01", "Booked you in for 2pm."), id: "true_447700900418@c.us_3EB0C55E01", from: "447700900100@c.us", to: "447700900418@c.us", fromMe: true, self: "out" } },
  { type: "rsvp", chat: "Riders Club", summary: "maybe · Community meetup", payload: { id: "3EB0E9D002", eventId: "3EB0E07F33", chatId: "120363041234567890@g.us", senderId: "447700900812@c.us", response: "maybe", timestamp: T * 1000, fromMe: false } },
  { type: "group", chat: "Riders Club", summary: "leave +44 7700 900943", payload: { groupId: "120363041234567890@g.us", action: "leave", participantIds: ["447700900943@c.us"] } },
  { type: "poll", chat: "Riders Club", summary: "voted option 0 · Which day suits?", payload: { pollId: "true_120363041234567890@g.us_3EB0A77B10", chatId: "120363041234567890@g.us", id: "3EB0B5E871", senderId: "447700900271@c.us", selectedOptionIds: [0], timestamp: T * 1000, fromMe: false, hideVoterNames: false } },
  { type: "message", chat: "+44 7700 900588", summary: "“Where is my order?”", payload: msg("0588", "3EB0D2B6A3", "Where is my order?", { notifyName: "Dele" }) },
];

export type RouteId = "code" | "webhook" | "chatwoot" | "nodered" | "s3";

export const routes: { id: RouteId; label: string; pkg: string; file: string; lang: string; config: string }[] = [
  { id: "code", label: "Your code", pkg: "@open-wa/socket-client", file: "", lang: "ts", config: "" },
  {
    id: "webhook", label: "Webhook", pkg: "@open-wa/integration-webhook", file: "wa.config.mjs", lang: "js",
    config: `export default {
  apiKey: process.env.WA_API_KEY,
  port: 8080,
  plugins: ['@open-wa/integration-webhook'],
  pluginConfig: {
    webhook: {
      url: 'https://hooks.example.com/whatsapp',
      events: 'all',
    },
  },
};`,
  },
  {
    id: "chatwoot", label: "Chatwoot", pkg: "@open-wa/integration-chatwoot", file: "wa.config.mjs", lang: "js",
    config: `export default {
  apiKey: process.env.WA_API_KEY,
  port: 8080,
  plugins: ['@open-wa/integration-chatwoot'],
  pluginConfig: {
    chatwoot: {
      chatwootUrl: 'https://app.chatwoot.com/api/v1/accounts/123',
      chatwootApiAccessToken: process.env.CHATWOOT_TOKEN,
      apiHost: 'https://wa.example.com',
    },
  },
};`,
  },
  {
    id: "nodered", label: "Node-RED", pkg: "@open-wa/node-red", file: "terminal", lang: "bash",
    config: `# Easy API keeps running; Node-RED connects to it
cd ~/.node-red
npm install @open-wa/node-red
node-red
# Add an owa-server node (http://localhost:8080 + your key),
# then a Listen node on the handler shown here`,
  },
  {
    id: "s3", label: "S3", pkg: "@open-wa/integration-s3", file: "wa.config.mjs", lang: "js",
    config: `export default {
  apiKey: process.env.WA_API_KEY,
  port: 8080,
  plugins: ['@open-wa/integration-s3'],
  pluginConfig: {
    s3: {
      provider: 'aws',
      bucket: 'whatsapp-media',
      accessKeyId: process.env.S3_KEY_ID,
      secretAccessKey: process.env.S3_SECRET,
    },
  },
};`,
  },
];

/** Does this route take this event? Mirrors what each plugin actually handles. */
export function routeTakes(route: RouteId, e: ExampleEvent): { ok: boolean; why: string } {
  switch (route) {
    case "code": return { ok: true, why: "Your handler receives it over Server-Sent Events from Easy API." };
    case "webhook": return { ok: true, why: "POSTs every public event as JSON to your URL, with retries." };
    case "nodered": return { ok: true, why: "A Listen node subscribes to this handler and emits the payload as msg.payload." };
    case "chatwoot":
      return e.type === "message"
        ? { ok: true, why: "Mirrored into a Chatwoot conversation; agent replies go back to WhatsApp." }
        : { ok: false, why: "Skipped: Chatwoot bridges received messages, not this event type." };
    case "s3":
      return e.media
        ? { ok: true, why: "The media is decrypted, uploaded, and its cloudUrl added to the message." }
        : { ok: false, why: "Skipped: the S3 plugin stores media from received messages, and this event has none." };
  }
}
