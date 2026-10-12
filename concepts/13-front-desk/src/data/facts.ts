// Build-time view of the shared fact pack. Pages import it in their
// frontmatter only, so the JSON never ships to the browser.
import pack from "../../../_shared/content/openwa.json";

export const product = pack.product;
export const stats = pack.stats;
export const commands = pack.commands;
export const firstRun = pack.firstRun;
export const snippets = pack.snippets;
export const paths = pack.paths;
export const capabilities = pack.capabilities;
export const integrations = pack.integrations;
export const licences = pack.licences;
export const support = pack.support;
export const migration = pack.migration;
export const releases = pack.releases;
export const legal = pack.legal;
export const http = pack.http;
export const jobs = pack.jobs;

export const DOCS = support.docs;
export const checked = stats.checkedOn;
export const [insiders, restricted] = licences.tiers;

/** 3666 -> "3.6k" (rounded down, as the fact pack asks). */
export const kDown = (n: number) => {
  if (n < 1000) return String(n);
  if (n >= 100000) return `${Math.floor(n / 1000)}k`;
  return `${Math.floor(n / 100) / 10}k`;
};

export const periods = [
  { id: "month", label: "Monthly", short: "a month", months: 1 },
  { id: "threeMonths", label: "3 months", short: "for 3 months", months: 3 },
  { id: "sixMonths", label: "6 months", short: "for 6 months", months: 6 },
  { id: "year", label: "Yearly", short: "a year", months: 12 },
] as const;

export const priceNote = `Prices in GBP, checked ${pack.stats.checkedOn} on Gumroad. Checkout shows the current price.`;

/** The licence each job needs, as a chip: kind and short label. */
export const jobLicence: Record<string, { kind: "free" | "insiders" | "restricted" | "preview"; label: string; short: string }> = {
  "salon-bookings": { kind: "free", label: "Free when the customer writes first", short: "Free" },
  "hotel-notifications": { kind: "restricted", label: "Restricted for guests who haven't written yet", short: "Restricted" },
  otp: { kind: "restricted", label: "Restricted: codes go to new numbers", short: "Restricted" },
  "pbx-calls": { kind: "preview", label: "Licensed preview: calling-enabled key", short: "Licensed preview" },
  stickers: { kind: "free", label: "No key; relies on the current sticker patch", short: "No key, patch" },
  media: { kind: "free", label: "Free", short: "Free" },
  "order-updates": { kind: "free", label: "Free when the customer wrote before", short: "Free" },
  "support-inbox": { kind: "free", label: "Plain chat needs no key", short: "Free" },
  "ai-agent": { kind: "free", label: "Follows the method each tool calls", short: "Follows the method" },
};

/** Short card copy for the recipe gallery, from the fact pack's job flows. */
export const jobCard: Record<string, { line: string; preview: string }> = {
  "salon-bookings": { line: "A poll of free times, an event card they RSVP to, a reminder the day before.", preview: "Friday: pick a time" },
  "hotel-notifications": { line: "Confirmation, the address as a map pin and the booking PDF, then a check-in reminder.", preview: "booking-HH2291.pdf" },
  otp: { line: "Your app makes a six-digit code and sends it from your own number.", preview: "Your Acme code is 204117" },
  "pbx-calls": { line: "Answer WhatsApp calls with a greeting, record them, or stream the audio to your phone system.", preview: "PCM16, 16 kHz, mono" },
  stickers: { line: "Turn a photo into a WebP sticker with effects such as comic and sparkle, rendered locally.", preview: "comic, sparkle" },
  media: { line: "Images with captions, voice notes, PDFs, video notes and view-once media.", preview: "invoice-1042.pdf" },
  "order-updates": { line: "Your shop's webhook calls the API when an order ships; the customer can reply.", preview: "Order 1042 is on its way." },
  "support-inbox": { line: "Messages appear as Chatwoot conversations and agents reply from there.", preview: "@open-wa/integration-chatwoot" },
  "ai-agent": { line: "Turn on the built-in MCP server and each method becomes a tool your agent can call.", preview: "http://localhost:8080/mcp" },
};

export const jobSnippet = (id: string) => {
  const job = jobs.find((j) => j.id === id)!;
  return job.snippet === "snippets.mcpConfig" ? snippets.mcpConfig : job.snippet;
};

export const generalFaqs = [
  { q: "Does it work with my existing WhatsApp number?", a: "Yes. open-wa runs WhatsApp Web in a browser it controls and links to the account on your phone as a linked device. There's no new number to register and no Meta business account." },
  { q: "Is it free?", a: "The library is free and open source, and most methods need no key. Some methods, such as messaging numbers that haven't written to you, number checks, buttons and creating groups, need an Insiders or Restricted key for the number that runs them." },
  { q: "Can my WhatsApp account get banned?", a: "It can. Automation tools can cause a WhatsApp account to be restricted or banned, and you accept that risk when you use open-wa. It's unofficial and isn't affiliated with WhatsApp or Meta. If you need an officially supported route, look at the WhatsApp Business Platform." },
  { q: "Which languages can I use?", a: "The runtime is Node.js. Every method is an HTTP endpoint on the running Easy API, so PHP, Python, Go, n8n's HTTP node or a PBX script can call it. Each instance serves Swagger and Postman files." },
  { q: "How is it different from the official Cloud API?", a: "The WhatsApp Business Platform needs a Meta business account, approved templates for conversations you start and per-message pricing, and it's officially supported. open-wa uses the number you already have, is free for most methods, and is unofficial with account-ban risk." },
];
