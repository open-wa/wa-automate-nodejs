// The five scenes at Rosa's (an example salon). Phone messages, captions and
// the code that sent each one. Snippets come from the fact pack's salon job and
// http.sendTextCurl shape; message text is example output.
import { jobById, http } from "./site";

const salon = jobById("salon-bookings");

export const salonSnippet = salon.snippet;

export const reminderCurl = http.sendTextCurl.replace(
  "Your table is booked for 8pm.",
  "Reminder: your haircut with Rosa is tomorrow at 13:30. Reply here if you need to move it.",
);

export const lateSnippet = `const staffChat = '447700900456@c.us'; // Rosa's own phone

client.onMessage(async (message) => {
  if (/late/i.test(message.body)) {
    await client.sendText(staffChat, \`\${message.from} is running late: \${message.body}\`);
    await client.sendText(message.from, 'No problem, Rosa knows. See you soon.');
  }
});`;

export type Panel = "salon" | "curl" | "late";

export interface Scene {
  id: string;
  when: string;
  clock: number; // minutes past midnight, drives the stage clock
  title: string;
  body: string;
  methods: string[];
  key: string;
  panel: Panel;
  file: string;
  lang: string;
  hl: [number[], number[]]; // highlighted lines for phase 0 and phase 1
}

export const scenes: Scene[] = [
  {
    id: "asks",
    when: "Tuesday 09:12",
    clock: 9 * 60 + 12,
    title: "A customer asks for Friday",
    body: "Sam messages the salon's normal WhatsApp number. Your code sees the message the moment it arrives, so a word like “book” can start the booking.",
    methods: ["onMessage"],
    key: "No key. Replying to people who message you is free.",
    panel: "salon",
    file: "bookings.js",
    lang: "js",
    hl: [[1, 2], [1, 2]],
  },
  {
    id: "poll",
    when: "Tuesday 09:12",
    clock: 9 * 60 + 12,
    title: "The bot sends Friday's free times as a poll",
    body: "One call sends a native WhatsApp poll with the free slots from the salon's calendar. Sam taps 13:30, and the vote reaches your code like any other event.",
    methods: ["sendPoll"],
    key: "No key.",
    panel: "salon",
    file: "bookings.js",
    lang: "js",
    hl: [[3], [3]],
  },
  {
    id: "event",
    when: "Tuesday 09:13",
    clock: 9 * 60 + 13,
    title: "The booking becomes an event card",
    body: "The appointment arrives as a WhatsApp event card that Sam can add to their calendar. When they answer Going, Maybe or Not going, onEventResponse tells you.",
    methods: ["sendEvent", "onEventResponse"],
    key: "No key. Event cards are new in 5.5.",
    panel: "salon",
    file: "bookings.js",
    lang: "js",
    hl: [[7, 8, 9, 10, 11], [13, 14, 15]],
  },
  {
    id: "reminder",
    when: "Thursday 18:00",
    clock: 18 * 60,
    title: "A reminder the day before",
    body: "The salon's booking system runs a job the evening before and makes one HTTP call. PHP, Python, a cron script or n8n can send it; it doesn't have to be Node.js.",
    methods: ["sendText", "POST /api/messages/sendText"],
    key: "No key. Sam has messaged the salon before.",
    panel: "curl",
    file: "Thursday 18:00, from any language",
    lang: "bash",
    hl: [[1], [4]],
  },
  {
    id: "late",
    when: "Friday 13:21",
    clock: 13 * 60 + 21,
    title: "“Running late” reaches the staff",
    body: "Sam is stuck on the bus. The message goes straight to Rosa's own phone, and Sam gets a reply so they don't worry.",
    methods: ["onMessage", "sendText"],
    key: "No key. Rosa's phone is already a contact.",
    panel: "late",
    file: "late.js",
    lang: "js",
    hl: [[3, 4], [5, 6]],
  },
];

/** Phone messages, each shown from a scene and phase ("at" = scene + phase / 2). */
export type Msg =
  | { kind: "day"; at: number; text: string }
  | { kind: "me" | "them"; at: number; text: string; time: string }
  | { kind: "poll"; at: number; q: string; options: string[]; pick: string; pickAt: number; time: string }
  | { kind: "event"; at: number; name: string; when: string; rsvpAt: number; time: string };

export const messages: Msg[] = [
  { kind: "day", at: 0, text: "Tuesday" },
  { kind: "me", at: 0, text: "Hi, can I book a cut on Friday?", time: "09:12" },
  { kind: "poll", at: 1, q: "Friday: pick a time", options: ["10:00", "13:30", "16:00"], pick: "13:30", pickAt: 1.5, time: "09:12" },
  { kind: "event", at: 2, name: "Haircut with Rosa, Friday 13:30", when: "Fri 13:30 to 14:15", rsvpAt: 2.5, time: "09:13" },
  { kind: "day", at: 3, text: "Thursday" },
  { kind: "them", at: 3, text: "Reminder: your haircut with Rosa is tomorrow at 13:30. Reply here if you need to move it.", time: "18:00" },
  { kind: "day", at: 4, text: "Friday" },
  { kind: "me", at: 4, text: "Running 10 minutes late, sorry", time: "13:21" },
  { kind: "them", at: 4.5, text: "No problem, Rosa knows. See you soon.", time: "13:21" },
];

export const staffNote = {
  at: 4.5,
  who: "Rosa's phone",
  text: "447700900123@c.us is running late: Running 10 minutes late, sorry",
};
