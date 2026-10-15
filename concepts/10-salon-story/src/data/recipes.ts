// Example conversations for each recipe page (example output, invented
// businesses, +44 7700 900xxx numbers). Code and licence text come from the
// fact pack's jobs.
import { jobs, snippets, http, jobById } from "./site";

export type Line =
  | { k: "day"; t: string }
  | { k: "me" | "them"; t: string; time?: string }
  | { k: "file"; name: string; cap?: string }
  | { k: "loc"; name: string; addr: string }
  | { k: "call"; t: string; sub: string }
  | { k: "sticker"; t: string }
  | { k: "image"; cap: string }
  | { k: "voice"; len: string }
  | { k: "note"; t: string }
  | { k: "tool"; t: string };

export const recipeBusiness: Record<string, { name: string; sub: string }> = {
  "salon-bookings": { name: "Rosa's", sub: "Example salon" },
  "hotel-notifications": { name: "Harbour House", sub: "Example hotel" },
  otp: { name: "Acme", sub: "Example app" },
  "pbx-calls": { name: "Quay Dental", sub: "Example clinic line" },
  stickers: { name: "Rosa's", sub: "Example salon" },
  media: { name: "Corner Café", sub: "Example café" },
  "order-updates": { name: "Thread & Co", sub: "Example shop" },
  "support-inbox": { name: "Rosa's", sub: "Example salon" },
  "ai-agent": { name: "Your agent", sub: "Example" },
};

export const convo: Record<string, Line[]> = {
  "salon-bookings": [
    { k: "me", t: "Hi, can I book a cut on Friday?", time: "09:12" },
    { k: "them", t: "Friday: pick a time · 10:00 · 13:30 · 16:00", time: "09:12" },
    { k: "note", t: "Sam votes 13:30" },
    { k: "them", t: "Event: Haircut with Rosa, Friday 13:30", time: "09:13" },
    { k: "day", t: "Thursday" },
    { k: "them", t: "Reminder: your haircut with Rosa is tomorrow at 13:30.", time: "18:00" },
  ],
  "hotel-notifications": [
    { k: "them", t: "Hi Sam, your room at Harbour House is booked for 14 to 16 November.", time: "11:02" },
    { k: "loc", name: "Harbour House", addr: "12 Quay Road" },
    { k: "file", name: "booking-HH2291.pdf", cap: "Your booking confirmation" },
    { k: "day", t: "13 November" },
    { k: "them", t: "See you tomorrow, Sam. Reply here if your plans change.", time: "10:00" },
    { k: "me", t: "We'll arrive after 9pm, is that OK?", time: "10:41" },
    { k: "note", t: "Reply goes to the front desk" },
  ],
  otp: [
    { k: "them", t: "Your Acme code is 204731. It expires in 10 minutes.", time: "14:05" },
    { k: "note", t: "The user types 204731 into your app" },
  ],
  "pbx-calls": [
    { k: "call", t: "Incoming WhatsApp call", sub: "Answered, playing greeting.wav" },
    { k: "note", t: "Caller audio recorded to received.wav" },
    { k: "call", t: "Call ended", sub: "onCallState: ended" },
  ],
  stickers: [
    { k: "image", cap: "team-photo.jpg" },
    { k: "sticker", t: "Rosa" },
    { k: "note", t: "Rendered locally with comic and sparkle" },
  ],
  media: [
    { k: "image", cap: "Today's menu" },
    { k: "voice", len: "0:07" },
    { k: "file", name: "invoice-1042.pdf", cap: "Invoice 1042" },
  ],
  "order-updates": [
    { k: "them", t: "Order 1042 is on its way.", time: "08:30" },
    { k: "me", t: "Great, can you leave it with the neighbour?", time: "08:44" },
    { k: "note", t: "Your code sees the reply in onMessage" },
  ],
  "support-inbox": [
    { k: "me", t: "Do you have any Saturday slots?", time: "16:20" },
    { k: "note", t: "Opens as a Chatwoot conversation" },
    { k: "them", t: "Yes, 11:00 or 14:30. Which suits you?", time: "16:22" },
  ],
  "ai-agent": [
    { k: "tool", t: "sendText" },
    { k: "them", t: "Hi Sam, your order shipped this morning.", time: "09:00" },
    { k: "note", t: "Called by the agent through the MCP server" },
  ],
};

/** Extra code shown on a recipe page beyond the job's own snippet. */
export const extras: Record<string, { title: string; code: string; lang: string }[]> = {
  "salon-bookings": [{ title: "The reminder, from any language", code: http.sendTextCurl, lang: "bash" }],
  "hotel-notifications": [{ title: "The confirmation text over HTTP", code: http.sendTextCurl, lang: "bash" }],
  otp: [{ title: "The same code over HTTP, from PHP, Python or Go", code: http.sendTextCurl.replace("Your table is booked for 8pm.", "Your Acme code is 204731. It expires in 10 minutes."), lang: "bash" }],
  stickers: [{ title: "Make a sticker file with the CLI", code: jobById("stickers").cli as string, lang: "bash" }],
  "order-updates": [{ title: "Or call the API from your shop's backend", code: http.sendTextCurl.replace("Your table is booked for 8pm.", "Order 1042 is on its way."), lang: "bash" }],
  "support-inbox": [{ title: "Load the plugin with its config", code: snippets.plugins, lang: "js" }],
  "ai-agent": [
    { title: "Start it with MCP on", code: snippets.mcpStart, lang: "bash" },
    { title: "Add it to Claude Desktop", code: snippets.claudeDesktop, lang: "json" },
  ],
};

export const snippetFor = (id: string) => {
  const j = jobById(id);
  if (j.snippet === "snippets.mcpConfig") return snippets.mcpConfig;
  return j.snippet;
};

export const recipeTier: Record<string, "none" | "insiders" | "restricted" | "calling" | "note"> = {
  "salon-bookings": "none",
  "hotel-notifications": "restricted",
  otp: "restricted",
  "pbx-calls": "calling",
  stickers: "note",
  media: "none",
  "order-updates": "none",
  "support-inbox": "none",
  "ai-agent": "note",
};

export { jobs };
