/** Drawn mini conversations for the recipe cards. Wording follows each job's flow in the fact pack; every business is an example. */
export type Line =
  | { kind: "in" | "out"; text: string; time: string }
  | { kind: "poll"; title: string; options: string[]; time: string }
  | { kind: "event"; title: string; time: string }
  | { kind: "pin"; title: string; sub: string; time: string }
  | { kind: "doc"; title: string; sub: string; time: string }
  | { kind: "call"; title: string; sub: string; time: string }
  | { kind: "tool"; title: string; sub: string }
  | { kind: "sticker"; src: string; alt: string; time: string }
  | { kind: "voice"; length: string; time: string };

export const miniChats: Record<string, { who: string; lines: Line[]; call: string }> = {
  "salon-bookings": {
    who: "Rosa Salon",
    call: "client.sendPoll(message.from, 'Friday: pick a time', ['10:00', '13:30', '16:00'])",
    lines: [
      { kind: "in", text: "can I book a cut on Friday?", time: "09:12" },
      { kind: "poll", title: "Friday: pick a time", options: ["10:00", "13:30", "16:00"], time: "09:12" },
      { kind: "event", title: "Haircut with Rosa, Friday 13:30", time: "09:13" },
    ],
  },
  "hotel-notifications": {
    who: "Harbour House",
    call: "client.sendLocation(guest, 50.7192, -1.8808, 'Harbour House', '12 Quay Road')",
    lines: [
      { kind: "out", text: "Hi Sam, your room at Harbour House is booked for 14 to 16 November.", time: "18:40" },
      { kind: "pin", title: "Harbour House", sub: "12 Quay Road", time: "18:40" },
      { kind: "doc", title: "booking-HH2291.pdf", sub: "Your booking confirmation", time: "18:40" },
    ],
  },
  otp: {
    who: "Acme",
    call: "client.sendText(`${phone}@c.us`, `Your Acme code is ${code}. It expires in 10 minutes.`)",
    lines: [{ kind: "out", text: "Your Acme code is 482913. It expires in 10 minutes.", time: "11:05" }],
  },
  "pbx-calls": {
    who: "Front line",
    call: "call.accept('greeting.wav', 'received.wav')",
    lines: [
      { kind: "call", title: "Incoming voice call", sub: "Answered: playing greeting.wav, recording the caller", time: "16:22" },
    ],
  },
  "order-updates": {
    who: "Corner Shop",
    call: "client.sendText(`${phone}@c.us`, `Order ${order} is on its way.`)",
    lines: [
      { kind: "out", text: "Order 1042 is on its way.", time: "10:31" },
      { kind: "in", text: "Great, will it come before 5?", time: "10:33" },
    ],
  },
  "support-inbox": {
    who: "Help desk",
    call: "plugins: ['@open-wa/integration-chatwoot']",
    lines: [
      { kind: "in", text: "My parcel says delivered but it isn't here", time: "14:02" },
      { kind: "out", text: "Sorry about that. Checking with the courier now. (Sent from Chatwoot)", time: "14:04" },
    ],
  },
  stickers: {
    who: "Rosa Salon",
    call: "client.sendSticker(chatId, './team-photo.jpg', { effects: ['comic', 'sparkle'] })",
    lines: [
      { kind: "in", text: "Send us the team photo as a sticker please", time: "17:40" },
      { kind: "sticker", src: "stickers/highfive-stamp.webp", alt: "Example output: the high-five sample photo as a stamp sticker", time: "17:41" },
    ],
  },
  media: {
    who: "Corner Cafe",
    call: "client.sendFile(chatId, './invoice-1042.pdf', 'invoice-1042.pdf', { caption: 'Invoice 1042' })",
    lines: [
      { kind: "voice", length: "0:07", time: "12:01" },
      { kind: "doc", title: "invoice-1042.pdf", sub: "Invoice 1042", time: "12:01" },
    ],
  },
  "ai-agent": {
    who: "Your agent",
    call: "mcp: { enabled: true, path: '/mcp' }",
    lines: [
      { kind: "in", text: "Is my 3pm still on?", time: "08:50" },
      { kind: "tool", title: "Tool call: sendText", sub: "via http://localhost:8080/mcp" },
      { kind: "out", text: "Yes, 3pm today is confirmed.", time: "08:50" },
    ],
  },
};
