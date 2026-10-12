// The example hotel and its front-desk automations, for the signature moment.
// Harbour House is invented and labelled "Example" wherever it appears. The
// check-in code is the fact pack's hotel snippet; the other three are built
// only from methods and signatures the fact pack documents.
import { jobs, insiders, restricted } from "./facts";

const hotel = jobs.find((j) => j.id === "hotel-notifications")!;
const pbx = jobs.find((j) => j.id === "pbx-calls")!;

export const harbour = {
  name: "Harbour House",
  address: "12 Quay Road",
  number: "+44 7700 900100",
  session: "harbour",
};

export const guests = [
  { id: "sam", name: "Sam", meta: "Room 4 · 14 to 16 Nov", last: "", unread: 0, active: true },
  { id: "priya", name: "Priya", meta: "Room 2 · arrives today", last: "Can we leave bags before 3?", unread: 1, active: false },
  { id: "jo", name: "Jo and Tom", meta: "Room 7 · 21 Nov", last: "Thanks, see you Friday", unread: 0, active: false },
  { id: "new", name: "+44 7700 900417", meta: "New enquiry", last: "Is there parking?", unread: 1, active: false },
];

export type Bubble =
  | { from: "guest" | "hotel"; kind: "text"; text: string }
  | { from: "hotel"; kind: "location"; title: string; address: string }
  | { from: "hotel"; kind: "file"; name: string; caption: string }
  | { from: "hotel"; kind: "call"; title: string; detail: string };

export interface Rule {
  id: string;
  label: string;
  when: string;
  methods: string[];
  licence: { kind: "free" | "restricted" | "preview"; text: string };
  code: string;
  bubbles: Bubble[];
  inboxLine: string;
  on?: boolean;
}

const pbxGreeting = pbx.snippet.split("\n\n")[0];

export const rules: Rule[] = [
  {
    id: "checkin",
    label: "Send check-in details",
    when: "When a booking is made",
    methods: ["sendText", "sendLocation", "sendFile"],
    licence: { kind: "restricted", text: `Sam hasn't written to the hotel yet, so this first message needs ${restricted.name} (${restricted.prices.month} a month, checked 12 Oct 2026).` },
    code: hotel.snippet,
    bubbles: [
      { from: "hotel", kind: "text", text: "Hi Sam, your room at Harbour House is booked for 14 to 16 November." },
      { from: "hotel", kind: "location", title: "Harbour House", address: "12 Quay Road" },
      { from: "hotel", kind: "file", name: "booking-HH2291.pdf", caption: "Your booking confirmation" },
    ],
    inboxLine: "Check-in details sent",
    on: true,
  },
  {
    id: "where",
    label: "Reply to “where are you?”",
    when: "When a guest asks for directions",
    methods: ["onMessage", "sendLocation"],
    licence: { kind: "free", text: "Free. The guest wrote first, so no key is needed." },
    code: `client.onMessage(async (message) => {
  if (/where are you/i.test(message.body)) {
    await client.sendLocation(message.from, 50.7192, -1.8808, 'Harbour House', '12 Quay Road');
  }
});`,
    bubbles: [
      { from: "guest", kind: "text", text: "Just off the train, where are you?" },
      { from: "hotel", kind: "location", title: "Harbour House", address: "12 Quay Road" },
    ],
    inboxLine: "Sent the map pin",
  },
  {
    id: "calls",
    label: "Answer calls with a greeting",
    when: "When a guest calls the number",
    methods: ["onIncomingCall", "call.accept"],
    licence: { kind: "preview", text: "Calling is a licensed preview: it needs a calling-enabled licence key. Audio only." },
    code: pbxGreeting,
    bubbles: [
      { from: "hotel", kind: "call", title: "Voice call, answered", detail: "greeting.wav played, reply saved to received.wav" },
    ],
    inboxLine: "Call answered, recording saved",
  },
  {
    id: "wifi",
    label: "Send the guest wifi code",
    when: "When a guest asks for the wifi",
    methods: ["onMessage", "sendText"],
    licence: { kind: "free", text: "Free. The guest asked, so the reply needs no key." },
    code: `import { randomInt } from 'node:crypto';

client.onMessage(async (message) => {
  if (/wifi/i.test(message.body)) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await client.sendText(message.from, \`Wifi code for your stay: \${code}\`);
  }
});`,
    bubbles: [
      { from: "guest", kind: "text", text: "Hi, what's the wifi code?" },
      { from: "hotel", kind: "text", text: "Wifi code for your stay: 482915" },
    ],
    inboxLine: "Wifi code sent",
  },
];

export const licenceChip = { free: "chip--free", restricted: "chip--restricted", preview: "chip--preview" } as const;
export const licenceShort = { free: "Free", restricted: "Restricted", preview: "Licensed preview" } as const;
void insiders;
