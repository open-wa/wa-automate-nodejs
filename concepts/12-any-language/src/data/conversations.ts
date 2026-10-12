// Example conversations for each recipe's drawn phone. Businesses are
// invented and labelled "Example business"; numbers use +44 7700 900xxx.
export type Msg =
  | { t: "text"; from: "me" | "biz"; body: string; time?: string }
  | { t: "poll"; title: string; options: string[]; picked: number }
  | { t: "event"; name: string; when: string }
  | { t: "location"; name: string; address: string }
  | { t: "doc"; file: string; caption?: string }
  | { t: "image"; caption: string; label: string }
  | { t: "voice"; secs: string }
  | { t: "sticker"; pack: string }
  | { t: "photo"; label: string }
  | { t: "call"; state: string }
  | { t: "note"; body: string };

export type Convo = { biz: string; initials: string; msgs: Msg[] };

export const convos: Record<string, Convo> = {
  "salon-bookings": {
    biz: "Rosa's Salon", initials: "RS",
    msgs: [
      { t: "text", from: "me", body: "Can I book a cut on Friday?", time: "09:12" },
      { t: "poll", title: "Friday: pick a time", options: ["10:00", "13:30", "16:00"], picked: 1 },
      { t: "event", name: "Haircut with Rosa, Friday 13:30", when: "Fri 13:30" },
      { t: "note", body: "Thursday" },
      { t: "text", from: "biz", body: "Reminder: your cut with Rosa is tomorrow at 13:30.", time: "10:00" },
      { t: "text", from: "me", body: "Running 10 minutes late, sorry", time: "13:24" },
    ],
  },
  "hotel-notifications": {
    biz: "Harbour House", initials: "HH",
    msgs: [
      { t: "text", from: "biz", body: "Hi Sam, your room at Harbour House is booked for 14 to 16 November.", time: "16:40" },
      { t: "location", name: "Harbour House", address: "12 Quay Road" },
      { t: "doc", file: "booking-HH2291.pdf", caption: "Your booking confirmation" },
      { t: "text", from: "me", body: "Thanks. Is there parking?", time: "16:52" },
    ],
  },
  otp: {
    biz: "Acme", initials: "A",
    msgs: [
      { t: "text", from: "biz", body: "Your Acme code is 482913. It expires in 10 minutes.", time: "13:02" },
    ],
  },
  "pbx-calls": {
    biz: "Rosa's Salon", initials: "RS",
    msgs: [
      { t: "call", state: "Voice call, answered" },
      { t: "note", body: "Greeting played, caller recorded" },
      { t: "text", from: "biz", body: "Thanks for calling Rosa's Salon. We'll call you back within the hour.", time: "11:06" },
    ],
  },
  stickers: {
    biz: "Rosa's Salon", initials: "RS",
    msgs: [
      { t: "photo", label: "Customer's photo" },
      { t: "text", from: "me", body: "Can you make this a sticker?", time: "18:20" },
      { t: "sticker", pack: "Rosa Salon" },
    ],
  },
  media: {
    biz: "Corner Café", initials: "CC",
    msgs: [
      { t: "image", caption: "Today's menu", label: "menu.jpg" },
      { t: "voice", secs: "0:12" },
      { t: "doc", file: "invoice-1042.pdf", caption: "Invoice 1042" },
    ],
  },
  "order-updates": {
    biz: "Pip & Pine", initials: "PP",
    msgs: [
      { t: "text", from: "me", body: "Hi, any news on order 1042?", time: "08:30" },
      { t: "text", from: "biz", body: "Order 1042 is on its way.", time: "11:15" },
      { t: "text", from: "me", body: "Great, can the driver leave it next door?", time: "11:17" },
    ],
  },
  "support-inbox": {
    biz: "Pip & Pine", initials: "PP",
    msgs: [
      { t: "text", from: "me", body: "My order arrived with a cracked mug", time: "14:02" },
      { t: "note", body: "Opened in Chatwoot" },
      { t: "text", from: "biz", body: "Sorry about that. A replacement goes out today, no need to return it.", time: "14:09" },
    ],
  },
  "ai-agent": {
    biz: "Corner Café", initials: "CC",
    msgs: [
      { t: "text", from: "me", body: "Do you have a table for two tonight?", time: "17:45" },
      { t: "note", body: "Your agent calls sendText through MCP" },
      { t: "text", from: "biz", body: "Yes, 19:30 or 20:15. Which works for you?", time: "17:45" },
    ],
  },
};
