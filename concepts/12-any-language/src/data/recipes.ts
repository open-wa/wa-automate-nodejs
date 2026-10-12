// Per-recipe presentation data layered over the fact pack's jobs.
import { f, restricted, insiders } from "./facts";
import { sendTextAll, otpAll } from "./builder";

const R = `Restricted, ${restricted.prices.month} a month`;
export const recipeMeta: Record<string, {
  short: string; tag: string; paid: boolean; build: string;
  any?: ReturnType<typeof sendTextAll>; extra?: { title: string; code: string; lang: string }[];
}> = {
  "salon-bookings": { short: "Bookings", tag: "Free to reply", paid: false, build: "A booking bot on the salon's own number: a poll of free times, an event card the customer can RSVP to, a reminder the day before.", any: sendTextAll("Reminder: your cut with Rosa is tomorrow at 13:30.") },
  "hotel-notifications": { short: "Notifications", tag: R, paid: true, build: "Booking confirmations with the address as a map pin and the booking PDF, then a check-in reminder.", any: sendTextAll("Hi Sam, your room at Harbour House is booked for 14 to 16 November.") },
  otp: { short: "OTP", tag: R, paid: true, build: "Login and verification codes sent from your own number to your user's WhatsApp.", any: otpAll },
  "pbx-calls": { short: "Calls", tag: "Calling key, licensed preview", paid: true, build: "Answer WhatsApp calls with a greeting and record the caller, or bridge the audio to your PBX, IVR or recorder." },
  stickers: { short: "Stickers", tag: "See the notes", paid: false, build: "Turn a customer's photo into a sticker with effects, and send it back.", extra: [{ title: "CLI: render a sticker file locally", code: f.commands.stickerCli, lang: "bash" }] },
  media: { short: "Media", tag: "No key", paid: false, build: "Menus as images, invoices as PDFs, voice notes and video, plus decrypting the media customers send you." },
  "order-updates": { short: "Orders", tag: "Free to reply", paid: false, build: "Your shop's webhook tells the customer their order shipped, and they can reply with questions.", any: sendTextAll("Order 1042 is on its way.") },
  "support-inbox": { short: "Support", tag: "Free for plain chat", paid: false, build: "Customer messages land in Chatwoot as conversations, and agents reply from Chatwoot.", extra: [{ title: "wa.config.mjs: plugins", code: f.snippets.plugins, lang: "js" }] },
  "ai-agent": { short: "AI agent", tag: "Follows the method", paid: false, build: "Claude, Cursor or your own agent reads and sends WhatsApp messages through the built-in MCP server.", extra: [{ title: "Start with MCP on", code: f.snippets.mcpStart, lang: "bash" }, { title: "Claude Desktop config", code: f.snippets.claudeDesktop, lang: "json" }] },
};

export const snippetFor = (id: string, snippet: string) =>
  snippet.startsWith("snippets.") ? (f.snippets as Record<string, string>)[snippet.slice(9)] : snippet;
export const insidersPrice = insiders.prices.month;
