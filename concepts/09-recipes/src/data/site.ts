/**
 * Everything this concept renders comes from the shared fact pack. The only
 * things added here are presentation: which business filters a job belongs to,
 * its swatch, a short licence badge, three steps written from the job's flow,
 * and the example conversation its little phone plays (labelled "Example").
 */
import facts from "../../../_shared/content/openwa.json";

export const product = facts.product;
export const stats = facts.stats;
export const commands = facts.commands;
export const snippets = facts.snippets;
export const support = facts.support;
export const licences = facts.licences;
export const http = facts.http;
export const capabilities = facts.capabilities;
export const integrations = facts.integrations;
export const releases = facts.releases;
export const migration = facts.migration;
export const legal = facts.legal;
export const firstRun = facts.firstRun;

export const base = import.meta.env.BASE_URL.replace(/\/?$/u, "/");
export const starsShort = `${(Math.floor(stats.githubStars / 100) / 10).toFixed(1)}k`;

const restricted = licences.tiers.find((t) => t.id === "restricted")!;
const insiders = licences.tiers.find((t) => t.id === "insiders")!;
export const tiers = { restricted, insiders };
export const priceNote = "Prices checked 12 Oct 2026 on Gumroad, in GBP. Checkout shows the current price.";

export type Swatch = "tomato" | "saffron" | "sky" | "lilac";

export const businesses = [
  { id: "salons", label: "Salons and clinics" },
  { id: "hotels", label: "Hotels" },
  { id: "shops", label: "Shops" },
  { id: "apps", label: "Apps" },
  { id: "phone", label: "Phone lines" },
] as const;
export type Business = (typeof businesses)[number]["id"];

export const families: Record<Swatch, string> = {
  tomato: "Bookings",
  saffron: "Updates and codes",
  sky: "Calls and conversations",
  lilac: "Media and stickers",
};

/** One line of the example conversation. `who`: in (customer), out (your code), sys (phone status). */
export type Line =
  | { who: "in" | "out"; kind: "text"; text: string; time?: string }
  | { who: "out"; kind: "poll"; title: string; options: string[]; picked: number }
  | { who: "out"; kind: "event"; title: string; when: string }
  | { who: "in"; kind: "rsvp"; text: string }
  | { who: "out"; kind: "pin"; title: string; address: string }
  | { who: "out"; kind: "file"; name: string; caption: string; size: string }
  | { who: "in" | "out"; kind: "photo"; caption?: string; tone: Swatch }
  | { who: "out"; kind: "sticker" }
  | { who: "out"; kind: "voice"; length: string }
  | { who: "out"; kind: "code"; text: string; code: string }
  | { who: "sys"; kind: "call"; state: string; detail: string }
  | { who: "sys"; kind: "note"; text: string };

export interface Job {
  id: string;
  name: string;
  short: string;
  summary: string;
  who: string;
  flow: string;
  methods: string[];
  licence: string;
  snippet: string;
  swatch: Swatch;
  business: Business[];
  badge: string;
  badgeTier: "free" | "restricted" | "calling" | "conditional";
  priceLine: string;
  tier?: "insiders" | "restricted";
  contact: { name: string; number: string };
  steps: string[];
  chat: Line[];
  extra?: { label: string; code: string; lang: string }[];
  audio?: string;
}

const raw = Object.fromEntries(facts.jobs.map((j) => [j.id, j]));
const resolveSnippet = (s: string) =>
  s.startsWith("snippets.") ? (facts.snippets as Record<string, string>)[s.slice(9)] ?? s : s;

const pres: Record<string, Omit<Job, "id" | "name" | "who" | "flow" | "methods" | "licence" | "snippet">> = {
  "salon-bookings": {
    summary: "A customer asks to book. Your code replies with a poll of free times, then sends the appointment as an event card they can RSVP to.",
    short: "Salon bookings",
    swatch: "tomato",
    business: ["salons"],
    badge: "No key",
    badgeTier: "free",
    priceLine: "No key when the customer messages first. Restricted (£15 a month) to start chats with new numbers.",
    tier: "restricted",
    contact: { name: "Rosa's Salon", number: "+44 7700 900214" },
    steps: [
      "Listen with onMessage. When a customer asks to book, reply with sendPoll and the free times.",
      "When they tap a time, send the appointment with sendEvent as a card they can RSVP to.",
      "Handle onEventResponse, send a reminder the day before with sendText, and pass replies like 'running late' to staff.",
    ],
    chat: [
      { who: "in", kind: "text", text: "Hi, can I book a cut on Friday?", time: "09:12" },
      { who: "out", kind: "poll", title: "Friday: pick a time", options: ["10:00", "13:30", "16:00"], picked: 1 },
      { who: "out", kind: "event", title: "Haircut with Rosa", when: "Friday 13:30" },
      { who: "in", kind: "rsvp", text: "Going" },
      { who: "in", kind: "text", text: "Running 10 min late, sorry", time: "13:24" },
      { who: "out", kind: "text", text: "No problem, Rosa knows.", time: "13:24" },
    ],
  },
  "hotel-notifications": {
    summary: "When a booking is made, the guest gets a confirmation, the address as a map pin and the booking PDF.",
    short: "Hotel notifications",
    swatch: "tomato",
    business: ["hotels", "salons"],
    badge: "Restricted · £15/mo",
    badgeTier: "restricted",
    priceLine: "First messages to guests who haven't messaged you need Restricted: £15 a month.",
    tier: "restricted",
    contact: { name: "Harbour House", number: "+44 7700 900388" },
    steps: [
      "When a booking is made, call sendText with the confirmation.",
      "Send the address as a map pin with sendLocation and the booking PDF with sendFile.",
      "The day before, send the check-in reminder; route guest replies from onMessage to the front desk.",
    ],
    chat: [
      { who: "out", kind: "text", text: "Hi Sam, your room at Harbour House is booked for 14 to 16 November.", time: "18:02" },
      { who: "out", kind: "pin", title: "Harbour House", address: "12 Quay Road" },
      { who: "out", kind: "file", name: "booking-HH2291.pdf", caption: "Your booking confirmation", size: "PDF" },
      { who: "in", kind: "text", text: "Thanks. Can we check in early?", time: "18:05" },
    ],
  },
  otp: {
    summary: "Your app generates a code, sends it to the user's WhatsApp from your own number, and the user types it back.",
    short: "OTP codes",
    swatch: "saffron",
    business: ["apps"],
    badge: "Restricted · £15/mo",
    badgeTier: "restricted",
    priceLine: "Codes go to numbers that haven't messaged you: Restricted, £15 a month (includes Insiders for checkNumberStatus).",
    tier: "restricted",
    contact: { name: "Acme", number: "+44 7700 900105" },
    steps: [
      "Optionally check the number is on WhatsApp with checkNumberStatus.",
      "Generate a six-digit code and send it from your own number with sendText.",
      "The user types it back into your app; you compare and expire it as you would any code.",
    ],
    chat: [
      { who: "sys", kind: "note", text: "Acme sign-in: code sent to +44 7700 900517" },
      { who: "out", kind: "code", text: "Your Acme code is 482913. It expires in 10 minutes.", code: "482913" },
      { who: "sys", kind: "note", text: "Code entered in the app. Signed in." },
    ],
  },
  "pbx-calls": {
    summary: "Answer WhatsApp calls with a greeting and record the caller, or stream the call audio to your own phone system.",
    short: "PBX calls",
    swatch: "sky",
    business: ["phone", "hotels"],
    badge: "Calling key · preview",
    badgeTier: "calling",
    priceLine: "Calling is a licensed preview: it needs a calling-enabled licence key. Audio only.",
    contact: { name: "Front desk line", number: "+44 7700 900461" },
    steps: [
      "Handle onIncomingCall. Accept with a greeting file and a recording file, or with your own audio streams.",
      "Bridge audio to your phone system: PCM16, 16 kHz, mono over a wss:// endpoint. Most PBXs need a small adapter.",
      "Follow onCallState to log when calls ring, connect and end; place calls with startCall.",
    ],
    chat: [
      { who: "sys", kind: "call", state: "Incoming WhatsApp call", detail: "+44 7700 900461" },
      { who: "sys", kind: "call", state: "Answered by your code", detail: "Playing greeting.wav" },
      { who: "sys", kind: "call", state: "Recording", detail: "received.wav · PCM16 16 kHz mono" },
      { who: "sys", kind: "call", state: "Call ended", detail: "0:42 · onCallState: ended" },
    ],
  },
  stickers: {
    summary: "Turn a customer's photo into a WebP sticker with effects such as comic and sparkle, rendered locally, and send it.",
    short: "Stickers",
    swatch: "lilac",
    business: ["shops", "salons"],
    badge: "No key listed",
    badgeTier: "conditional",
    priceLine: "Not marked as licensed in the method list. Sending relies on the current sticker patch from the patch service.",
    contact: { name: "Rosa's Salon", number: "+44 7700 900214" },
    steps: [
      "Receive the customer's photo in onMessage, or pick any image or short video.",
      "Call sendSticker with the effects you want (62 recipes in this release, such as comic and sparkle) and a pack name.",
      "open-wa renders the WebP locally and sends it. The same renderer is a CLI for making sticker files.",
    ],
    chat: [
      { who: "in", kind: "photo", caption: "Can you make this a sticker?", tone: "lilac" },
      { who: "out", kind: "sticker" },
      { who: "in", kind: "text", text: "Love it, thank you", time: "16:40" },
    ],
  },
  media: {
    summary: "Send images with captions, voice notes, invoices and menus as documents, and video notes.",
    short: "Photos, voice and PDFs",
    swatch: "lilac",
    business: ["shops", "hotels", "salons"],
    badge: "No key",
    badgeTier: "free",
    priceLine: "No key needed for these methods.",
    contact: { name: "Corner Café", number: "+44 7700 900733" },
    steps: [
      "Send an image with a caption using sendImage.",
      "Send a voice note with sendPtt and documents such as invoices and menus with sendFile.",
      "Receive what customers send and read it with decryptMedia.",
    ],
    chat: [
      { who: "out", kind: "photo", caption: "Today's menu", tone: "saffron" },
      { who: "out", kind: "voice", length: "0:07" },
      { who: "out", kind: "file", name: "invoice-1042.pdf", caption: "Invoice 1042", size: "PDF" },
    ],
  },
  "order-updates": {
    summary: "Your shop's webhook calls the API when an order ships. The customer gets the update and can reply.",
    short: "Order updates",
    swatch: "saffron",
    business: ["shops", "apps"],
    badge: "No key",
    badgeTier: "free",
    priceLine: "No key when the customer has messaged you before. Restricted (£15 a month) to start new chats.",
    tier: "restricted",
    contact: { name: "Kettle & Co", number: "+44 7700 900652" },
    steps: [
      "Point your shop's 'order shipped' webhook at a small route in your app.",
      "In that route, call sendText with the order number.",
      "Customers reply on WhatsApp; answer them from onMessage or your helpdesk.",
    ],
    chat: [
      { who: "out", kind: "text", text: "Order 1042 is on its way.", time: "11:30" },
      { who: "in", kind: "text", text: "Great. Can you leave it next door if I'm out?", time: "11:34" },
      { who: "out", kind: "text", text: "Done, we've added a note for the driver.", time: "11:36" },
    ],
  },
  "support-inbox": {
    summary: "Messages to the business number appear as Chatwoot conversations, and agents reply from Chatwoot.",
    short: "Support inbox",
    swatch: "sky",
    business: ["shops", "hotels", "salons", "phone"],
    badge: "No key",
    badgeTier: "free",
    priceLine: "Follows the methods used. Plain chat needs no key.",
    contact: { name: "Kettle & Co", number: "+44 7700 900652" },
    steps: [
      "Add @open-wa/integration-chatwoot to your plugins.",
      "Messages to the business number appear as Chatwoot conversations.",
      "Agents reply from Chatwoot and the customer gets the reply on WhatsApp.",
    ],
    chat: [
      { who: "in", kind: "text", text: "Hi, is my order ready to collect?", time: "15:02" },
      { who: "sys", kind: "note", text: "New Chatwoot conversation" },
      { who: "out", kind: "text", text: "Yes, it's ready from 4pm. Jo, Kettle & Co", time: "15:04" },
    ],
  },
  "ai-agent": {
    summary: "Turn on the built-in MCP server and each Easy API method becomes a tool Claude, Cursor or your own agent can call.",
    short: "AI agent",
    swatch: "sky",
    business: ["apps", "shops"],
    badge: "Per tool",
    badgeTier: "conditional",
    priceLine: "Follows the method each tool calls. Replying to people who messaged you needs no key.",
    contact: { name: "Corner Café", number: "+44 7700 900733" },
    steps: [
      "Turn on the built-in MCP server in wa.config.mjs.",
      "Point Claude, Cursor or your own agent at http://localhost:8080/mcp with your API key.",
      "Each Easy API method is now a tool the agent can call, such as sendText.",
    ],
    chat: [
      { who: "in", kind: "text", text: "Are you open on Saturday?", time: "20:15" },
      { who: "sys", kind: "note", text: "Agent called the sendText tool" },
      { who: "out", kind: "text", text: "Yes, 9am to 5pm on Saturday.", time: "20:15" },
    ],
  },
};

export const jobs: Job[] = facts.jobs.map((j) => ({
  id: j.id,
  name: j.name,
  who: j.who,
  flow: j.flow,
  methods: j.methods,
  licence: j.licence,
  snippet: resolveSnippet(j.snippet),
  audio: (raw[j.id] as { audio?: string }).audio,
  extra:
    j.id === "stickers"
      ? [{ label: "Make sticker files with the CLI", code: (raw[j.id] as { cli?: string }).cli ?? "", lang: "bash" }]
      : j.id === "ai-agent"
        ? [
            { label: "Start it", code: snippets.mcpStart, lang: "bash" },
            { label: "Claude Desktop config", code: snippets.claudeDesktop, lang: "json" },
          ]
        : undefined,
  ...pres[j.id]!,
}));

export const jobById = (id: string) => jobs.find((j) => j.id === id)!;

export const nav = [
  { href: `${base}recipes/`, label: "Recipes" },
  { href: `${base}features/`, label: "Features" },
  { href: `${base}integrations/`, label: "Integrations" },
  { href: `${base}pricing/`, label: "Pricing" },
];

export const footer = [
  {
    title: "Product",
    links: [
      { href: `${base}features/`, label: "Features" },
      { href: `${base}recipes/`, label: "Recipes" },
      { href: `${base}integrations/`, label: "Integrations" },
      { href: `${base}pricing/`, label: "Pricing" },
      { href: `${base}compare/`, label: "Compare" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: `${base}quickstart/`, label: "Quick start" },
      { href: support.docs, label: "Docs" },
      { href: support.apiExplorer, label: "API explorer" },
      { href: `${base}changelog/`, label: "Changelog" },
      { href: `${base}migrate/`, label: "Migrate from v4" },
      { href: support.github, label: "GitHub" },
      { href: support.npm, label: "npm" },
      { href: support.dockerHub, label: "Docker Hub" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: support.discord, label: "Discord" },
      { href: `${base}community/`, label: "Contributing" },
      { href: `${base}integrations/#plugin-sdk`, label: "Plugin SDK" },
      { href: `${base}support/`, label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: support.terms, label: "Terms of Service" },
      { href: support.licenceText, label: "Licence" },
      { href: `${base}legal/`, label: "Unofficial notice" },
    ],
  },
];
