// Every command, snippet, price and stat on the site comes from the shared fact
// pack. This module only reshapes it; nothing here invents a fact.
import facts from "../../../_shared/content/openwa.json";

export const product = facts.product;
export const stats = facts.stats;
export const commands = facts.commands;
export const firstRun = facts.firstRun;
export const snippets = facts.snippets;
export const capabilities = facts.capabilities;
export const integrations = facts.integrations;
export const licences = facts.licences;
export const support = facts.support;
export const migration = facts.migration;
export const releases = facts.releases;
export const legal = facts.legal;
export const http = facts.http;
export const paths = facts.paths;

export type Job = (typeof facts.jobs)[number];

/** Resolve "snippets.mcpConfig"-style references inside the fact pack. */
export const resolveSnippet = (s: string): string =>
  /^snippets\.\w+$/.test(s) ? (snippets as Record<string, string>)[s.split(".")[1]] : s;

export const jobs: Job[] = facts.jobs.map((j) => ({ ...j, snippet: resolveSnippet(j.snippet) }));
export const job = (id: string): Job => {
  const j = jobs.find((x) => x.id === id);
  if (!j) throw new Error(`no job ${id}`);
  return j;
};

/** Lines from..to (1-based, inclusive) of a fact-pack snippet, verbatim. */
export const lines = (s: string, from: number, to: number): string =>
  s.split("\n").slice(from - 1, to).join("\n");

export const k = (n: number) => `${(Math.floor(n / 100) / 10).toFixed(1)}k`;
export const starsLabel = `${k(stats.githubStars)}`;
export const checked = stats.checkedOn;
export const priceNote = `Prices checked ${licences.pricesCheckedOn.split(",")[0]}; checkout shows the current price.`;

export const tier = (id: "insiders" | "restricted") => licences.tiers.find((t) => t.id === id)!;

/** Short job-words licence verdict per recipe, derived from each job's licence line. */
export type Need = "free" | "insiders" | "restricted" | "preview" | "depends";
export const jobNeed: Record<string, { need: Need; label: string }> = {
  "salon-bookings": { need: "free", label: "Free when they message first" },
  "hotel-notifications": { need: "restricted", label: `Restricted, ${tier("restricted").prices.month} a month` },
  otp: { need: "restricted", label: `Restricted, ${tier("restricted").prices.month} a month` },
  "pbx-calls": { need: "preview", label: "Calling-enabled key, licensed preview" },
  stickers: { need: "depends", label: "Not marked licensed; needs the sticker patch" },
  media: { need: "free", label: "No key" },
  "order-updates": { need: "free", label: "Free when they messaged first" },
  "support-inbox": { need: "free", label: "Plain chat needs no key" },
  "ai-agent": { need: "depends", label: "Follows the methods each tool calls" },
};

/** Short names for cards and nav. */
export const jobShort: Record<string, string> = {
  "salon-bookings": "Salon bookings",
  "hotel-notifications": "Hotel notifications",
  otp: "OTP codes",
  "pbx-calls": "Calls and your PBX",
  stickers: "Stickers",
  media: "Photos, voice notes, PDFs",
  "order-updates": "Order updates",
  "support-inbox": "Support inbox",
  "ai-agent": "An AI agent",
};

export const docsUrl = support.docs;
