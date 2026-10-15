// Example conversations for each recipe page, drawn from the fact pack's job
// flows. Every business here is invented and labelled "Example".
export type Msg =
  | { from: "them" | "biz"; kind: "text"; text: string }
  | { from: "biz"; kind: "poll"; title: string; options: string[]; picked?: string }
  | { from: "biz"; kind: "event"; title: string; when: string }
  | { from: "biz"; kind: "location"; title: string; address: string }
  | { from: "biz"; kind: "file"; name: string; caption: string }
  | { from: "biz"; kind: "voice"; length: string }
  | { from: "biz" | "them"; kind: "image"; caption?: string; sticker?: boolean }
  | { kind: "system"; text: string }
  | { kind: "call"; title: string; detail: string };

export const convo: Record<string, { business: string; number: string; msgs: Msg[] }> = {
  "salon-bookings": { business: "Rosa Salon", number: "+44 7700 900210", msgs: [
    { from: "them", kind: "text", text: "Hi, can I book a cut on Friday?" },
    { from: "biz", kind: "poll", title: "Friday: pick a time", options: ["10:00", "13:30", "16:00"], picked: "13:30" },
    { from: "biz", kind: "event", title: "Haircut with Rosa, Friday 13:30", when: "Friday · 13:30" },
    { kind: "system", text: "onEventResponse: going" },
    { from: "them", kind: "text", text: "Running 10 minutes late, sorry." },
  ] },
  "hotel-notifications": { business: "Harbour House", number: "+44 7700 900100", msgs: [
    { from: "biz", kind: "text", text: "Hi Sam, your room at Harbour House is booked for 14 to 16 November." },
    { from: "biz", kind: "location", title: "Harbour House", address: "12 Quay Road" },
    { from: "biz", kind: "file", name: "booking-HH2291.pdf", caption: "Your booking confirmation" },
    { from: "them", kind: "text", text: "Lovely, is there parking?" },
  ] },
  otp: { business: "Acme", number: "+44 7700 900300", msgs: [
    { kind: "system", text: "Your app generated a code" },
    { from: "biz", kind: "text", text: "Your Acme code is 204117. It expires in 10 minutes." },
  ] },
  "pbx-calls": { business: "Harbour House", number: "+44 7700 900100", msgs: [
    { kind: "call", title: "Voice call, answered", detail: "onIncomingCall → call.accept" },
    { kind: "system", text: "Audio to your PBX: PCM16, 16 kHz, mono" },
    { kind: "system", text: "onCallState: ended" },
  ] },
  stickers: { business: "Rosa Salon", number: "+44 7700 900210", msgs: [
    { from: "them", kind: "image", caption: "Our team after the refit" },
    { from: "biz", kind: "image", sticker: true },
  ] },
  media: { business: "Quay Café", number: "+44 7700 900400", msgs: [
    { from: "biz", kind: "image", caption: "Today's menu" },
    { from: "biz", kind: "voice", length: "0:12" },
    { from: "biz", kind: "file", name: "invoice-1042.pdf", caption: "Invoice 1042" },
  ] },
  "order-updates": { business: "Quay Café", number: "+44 7700 900400", msgs: [
    { kind: "system", text: "POST /shop/order-shipped" },
    { from: "biz", kind: "text", text: "Order 1042 is on its way." },
    { from: "them", kind: "text", text: "Thanks. Can it go to the side door?" },
  ] },
  "support-inbox": { business: "Quay Café", number: "+44 7700 900400", msgs: [
    { from: "them", kind: "text", text: "Hi, do you do gluten-free bread?" },
    { kind: "system", text: "New Chatwoot conversation" },
    { from: "biz", kind: "text", text: "We do, on weekdays from 8am. (Sent from Chatwoot)" },
  ] },
  "ai-agent": { business: "Your agent", number: "+44 7700 900500", msgs: [
    { from: "them", kind: "text", text: "Can you send me the address again?" },
    { kind: "system", text: "Agent called the sendLocation tool over MCP" },
    { from: "biz", kind: "location", title: "Harbour House", address: "12 Quay Road" },
  ] },
};

