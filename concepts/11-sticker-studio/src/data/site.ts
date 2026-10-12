import facts from "../../../_shared/content/openwa.json";

export const f = facts;
export const product = facts.product;
export const stats = facts.stats;
export const commands = facts.commands;
export const support = facts.support;
export const licences = facts.licences;
export const jobs = facts.jobs;
export const http = facts.http;
export const legal = facts.legal;
export const releases = facts.releases;
export const integrations = facts.integrations;
export const capabilities = facts.capabilities;
export const snippets = facts.snippets;
export const migration = facts.migration;

export const tier = (id: "insiders" | "restricted") => facts.licences.tiers.find((t) => t.id === id)!;

/** Round down, as the fact pack asks: 3666 -> "3.6k". */
export const kRound = (n: number) => `${Math.floor(n / 100) / 10}k`;

export const starsLabel = `${kRound(stats.githubStars)} stars`;
export const checked = stats.checkedOn;

/** Resolve a job's snippet: a few point at another snippet by key. */
export const jobSnippet = (j: (typeof jobs)[number]) =>
  j.snippet.startsWith("snippets.") ? (facts.snippets as Record<string, string>)[j.snippet.slice(9)] : j.snippet;

/** Licence label per job, short, for badges. */
export const jobBadge: Record<string, { label: string; tone: "free" | "insiders" | "restricted" | "calls" }> = {
  "salon-bookings": { label: "Free when they message first", tone: "free" },
  "hotel-notifications": { label: "Restricted for new guests", tone: "restricted" },
  otp: { label: "Restricted", tone: "restricted" },
  "pbx-calls": { label: "Calling key, preview", tone: "calls" },
  stickers: { label: "Needs the sticker patch", tone: "insiders" },
  media: { label: "No key", tone: "free" },
  "order-updates": { label: "Free when they message first", tone: "free" },
  "support-inbox": { label: "Follows the methods used", tone: "free" },
  "ai-agent": { label: "Follows the methods used", tone: "free" },
};

export const base = import.meta.env.BASE_URL.replace(/\/?$/u, "/");
export const href = (p: string) => `${base}${p.replace(/^\//u, "")}`;
