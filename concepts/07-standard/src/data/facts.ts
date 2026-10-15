// Build-time view of the shared fact pack. Pages import from here in their
// frontmatter only, so the JSON never ships to the browser; client scripts get
// the few values they need through data attributes.
import pack from "../../../_shared/content/openwa.json";

export const product = pack.product;
export const stats = pack.stats;
export const commands = pack.commands;
export const firstRun = pack.firstRun;
export const snippets = pack.snippets;
export const paths = pack.paths;
export const useCases = pack.useCases;
export const capabilities = pack.capabilities;
export const integrations = pack.integrations;
export const licences = pack.licences;
export const support = pack.support;
export const migration = pack.migration;
export const releases = pack.releases;
export const legal = pack.legal;

export const DOCS = support.docs;
export const checked = stats.checkedOn;

/** 3666 -> "3.6k" (rounded down, as the fact pack asks). */
export const kDown = (n: number) => {
  if (n < 1000) return String(n);
  if (n >= 100000) return `${Math.floor(n / 1000)}k`;
  const k = Math.floor(n / 100) / 10;
  return `${k}k`;
};

export const periods = [
  { id: "month", label: "Monthly", short: "month", months: 1 },
  { id: "threeMonths", label: "3 months", short: "3 months", months: 3 },
  { id: "sixMonths", label: "6 months", short: "6 months", months: 6 },
  { id: "year", label: "Yearly", short: "year", months: 12 },
] as const;

/** The (one-line) cost per month for a period, from the fact-pack price. */
export const perMonth = (price: string, months: number) => {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  return `£${(n / months).toFixed(2).replace(/\.00$/, "")}`;
};

// From the docs quick start (apps/docs/content/docs/getting-started/quickstart.mdx),
// with the recipient swapped for a UK drama-range demo number.
export const curlSend = `curl -X POST http://localhost:8080/api/messages/sendText \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-secure-key" \\
  -d '{"to":"447700900123@c.us","content":"Your order has shipped","options":{}}'`;
export const curlHealth = "curl http://localhost:8080/health";

export const generalFaqs = [
  { q: "Does it work with my existing WhatsApp number?", a: "Yes. open-wa runs WhatsApp Web in a browser it controls and links to the account on your phone as a linked device, the same way WhatsApp Web does. There's no new number to register and no Meta business account." },
  { q: "Is it free?", a: "The library is free to use and open source. Most methods need no key. Some methods, such as number checks, buttons and creating groups, need an Insiders or Restricted licence key for the WhatsApp number that runs them." },
  { q: "Can my WhatsApp account get banned?", a: "It can. Automation tools can cause a WhatsApp account to be restricted or banned, and you accept that risk when you use open-wa. It's unofficial and isn't affiliated with WhatsApp or Meta. If you need an officially supported route, compare it with the WhatsApp Business Platform." },
  { q: "Which languages can I use?", a: "The runtime is Node.js. Anything that can make HTTP requests can use the Easy API, and every instance serves Swagger and Postman files you can generate clients from." },
  { q: "How is it different from the official Cloud API?", a: "The official WhatsApp Business Platform needs a Meta business account, approved templates for conversations you start and per-message pricing, and it's officially supported. open-wa uses the number you already have, is free for most methods, and is unofficial with account-ban risk." },
  { q: "I'm on v4. What happens if I upgrade?", a: "Version 5 is the current release line and unqualified installs get v5. Pin v4 with npm install @open-wa/wa-automate@4 while you follow the migration guide." },
];
