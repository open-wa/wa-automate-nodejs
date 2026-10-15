// Example conversations for each recipe's phone. Invented businesses, labelled
// "Example" on the page; numbers use the +44 7700 900xxx drama range.
export type Line = { from: "them" | "biz"; type: string; text?: string; note?: string };
export const conversations: Record<string, { biz: string; lines: Line[] }> = {
  "salon-bookings": { biz: "Rosa's Salon", lines: [
    { from: "them", type: "text", text: "Can I book a cut on Friday?" },
    { from: "biz", type: "poll", note: "sendPoll" },
    { from: "them", type: "text", text: "Voted 13:30" },
    { from: "biz", type: "event", note: "sendEvent" },
    { from: "biz", type: "text", text: "Reminder: haircut with Rosa tomorrow at 13:30.", note: "sendText, the day before" },
    { from: "them", type: "text", text: "Running 10 minutes late, sorry" },
  ] },
  "hotel-notifications": { biz: "Harbour House", lines: [
    { from: "biz", type: "text", text: "Hi Sam, your room at Harbour House is booked for 14 to 16 November.", note: "sendText" },
    { from: "biz", type: "pin", note: "sendLocation" },
    { from: "biz", type: "pdf", note: "sendFile" },
    { from: "them", type: "text", text: "Can I park on site?" },
  ] },
  otp: { biz: "Acme app", lines: [
    { from: "biz", type: "otp", note: "sendText" },
  ] },
  "pbx-calls": { biz: "Harbour House front desk", lines: [
    { from: "biz", type: "call", note: "onIncomingCall, call.accept" },
  ] },
  stickers: { biz: "Rosa's Salon", lines: [
    { from: "them", type: "photo-in" },
    { from: "them", type: "text", text: "Can you make that a sticker?" },
    { from: "biz", type: "sticker", note: "sendSticker" },
  ] },
  media: { biz: "Corner Shop", lines: [
    { from: "biz", type: "image", text: "Today's menu", note: "sendImage" },
    { from: "biz", type: "voice", note: "sendPtt" },
    { from: "biz", type: "pdf-invoice", note: "sendFile" },
  ] },
  "order-updates": { biz: "Corner Shop", lines: [
    { from: "biz", type: "text", text: "Order 1042 is on its way.", note: "sendText from your shop's webhook" },
    { from: "them", type: "text", text: "Can you leave it with next door?" },
  ] },
  "support-inbox": { biz: "Corner Shop support", lines: [
    { from: "them", type: "text", text: "Hi, my order hasn't arrived yet" },
    { from: "biz", type: "text", text: "Sorry about that. Checking with the courier now.", note: "Sent by an agent in Chatwoot" },
  ] },
  "ai-agent": { biz: "Rosa's Salon", lines: [
    { from: "them", type: "text", text: "What time do you close today?" },
    { from: "biz", type: "text", text: "We close at 18:00 today.", note: "Your agent calls the sendText tool over MCP" },
  ] },
};
