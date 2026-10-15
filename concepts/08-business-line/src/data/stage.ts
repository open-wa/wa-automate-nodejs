// Demo conversation for the home page phone. Businesses, names and numbers
// are invented and labelled "Example"; every call shown comes verbatim from
// the fact pack (job snippets and the HTTP curl).
import { http, job, lines, jobNeed } from "./facts";

export type Bubble =
  | { kind: "them"; text: string }
  | { kind: "biz"; call: number; type: "text" | "otp" | "poll" | "event" | "pin" | "pdf" | "sticker" | "call"; text?: string };

export interface Call { label: string; lang: string; code: string; methods: string[]; need: string; needKind: string; recipe: string; note: string }
export interface Scene { biz: string; initial: string; jobId: string; bubbles: Bubble[] }

const salon = job("salon-bookings");
const hotel = job("hotel-notifications");
const otp = job("otp");
const pbx = job("pbx-calls");
const sticker = job("stickers");
const order = job("order-updates");

export const calls: Call[] = [
  { label: "curl, from any language", lang: "bash", code: http.sendTextCurl, methods: ["POST /api/messages/sendText"], need: "No key: they messaged first", needKind: "free", recipe: "order-updates", note: http.note },
  { label: "JavaScript", lang: "js", code: lines(salon.snippet, 1, 5), methods: ["onMessage", "sendPoll"], need: jobNeed["salon-bookings"].label, needKind: "free", recipe: "salon-bookings", note: salon.licence },
  { label: "JavaScript", lang: "js", code: lines(salon.snippet, 7, 15), methods: ["sendEvent", "onEventResponse"], need: jobNeed["salon-bookings"].label, needKind: "free", recipe: "salon-bookings", note: salon.licence },
  { label: "JavaScript", lang: "js", code: otp.snippet, methods: otp.methods.slice(0, 1), need: jobNeed.otp.label, needKind: "restricted", recipe: "otp", note: otp.licence },
  { label: "JavaScript", lang: "js", code: lines(hotel.snippet, 1, 1), methods: ["sendText"], need: jobNeed["hotel-notifications"].label, needKind: "restricted", recipe: "hotel-notifications", note: hotel.licence },
  { label: "JavaScript", lang: "js", code: lines(hotel.snippet, 2, 2), methods: ["sendLocation"], need: jobNeed["hotel-notifications"].label, needKind: "restricted", recipe: "hotel-notifications", note: hotel.licence },
  { label: "JavaScript", lang: "js", code: lines(hotel.snippet, 3, 5), methods: ["sendFile"], need: jobNeed["hotel-notifications"].label, needKind: "restricted", recipe: "hotel-notifications", note: hotel.licence },
  { label: "JavaScript", lang: "js", code: sticker.snippet, methods: sticker.methods, need: "Not marked licensed", needKind: "depends", recipe: "stickers", note: sticker.licence },
  { label: "JavaScript", lang: "js", code: lines(pbx.snippet, 1, 4), methods: ["onIncomingCall", "call.accept"], need: "Calling-enabled key", needKind: "preview", recipe: "pbx-calls", note: pbx.licence },
];
void order;

export const scenes: Scene[] = [
  { biz: "Lantern Kitchen", initial: "L", jobId: "order-updates", bubbles: [
    { kind: "them", text: "Table for 2 at 8 tonight?" },
    { kind: "biz", call: 0, type: "text", text: "Your table is booked for 8pm." },
  ] },
  { biz: "Rosa's Salon", initial: "R", jobId: "salon-bookings", bubbles: [
    { kind: "them", text: "Can I book a cut on Friday?" },
    { kind: "biz", call: 1, type: "poll" },
    { kind: "biz", call: 2, type: "event" },
  ] },
  { biz: "Acme app", initial: "A", jobId: "otp", bubbles: [
    { kind: "biz", call: 3, type: "otp" },
  ] },
  { biz: "Harbour House", initial: "H", jobId: "hotel-notifications", bubbles: [
    { kind: "biz", call: 4, type: "text", text: "Hi Sam, your room at Harbour House is booked for 14 to 16 November." },
    { kind: "biz", call: 5, type: "pin" },
    { kind: "biz", call: 6, type: "pdf" },
  ] },
  { biz: "Rosa's Salon", initial: "R", jobId: "stickers", bubbles: [
    { kind: "them", text: "Love the cut, thank you." },
    { kind: "biz", call: 7, type: "sticker" },
  ] },
  { biz: "Harbour House front desk", initial: "H", jobId: "pbx-calls", bubbles: [
    { kind: "biz", call: 8, type: "call" },
  ] },
];
