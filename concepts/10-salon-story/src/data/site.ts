// Only the fact-pack fields this concept renders. Server-side only: never
// import this file from a client <script>.
import facts from "../../../_shared/content/openwa.json";

export const product = facts.product;
export const stats = facts.stats;
export const commands = facts.commands;
export const firstRun = facts.firstRun;
export const snippets = {
  socketClient: facts.snippets.socketClient,
  embedded: facts.snippets.embedded,
  mcpConfig: facts.snippets.mcpConfig,
  mcpStart: facts.snippets.mcpStart,
  claudeDesktop: facts.snippets.claudeDesktop,
  plugins: facts.snippets.plugins,
  cfProxyConsumer: facts.snippets.cfProxyConsumer,
  event: facts.snippets.event,
  sessionKey: facts.snippets.sessionKey,
};
export const capabilities = facts.capabilities;
export const integrations = facts.integrations;
export const licences = facts.licences;
export const support = facts.support;
export const migration = facts.migration;
export const releases = facts.releases;
export const legal = facts.legal;
export const http = facts.http;
export const jobs = facts.jobs;

export type Job = (typeof facts.jobs)[number];
export const jobById = (id: string) => facts.jobs.find((j) => j.id === id)!;

export const starsShort = `${(stats.githubStars / 1000).toFixed(1)}k`;
export const checked = stats.checkedOn;

/** Short job-framed licence labels used on cards and the pricing table. */
export const jobKey: Record<string, { label: string; tone: "free" | "key" | "preview" | "note" }> = {
  "salon-bookings": { label: "Free when they message first", tone: "free" },
  "hotel-notifications": { label: "Restricted for new guests, £15 a month", tone: "key" },
  otp: { label: "Restricted, £15 a month", tone: "key" },
  "pbx-calls": { label: "Calling key, preview", tone: "preview" },
  stickers: { label: "No key listed, uses sticker patch", tone: "note" },
  media: { label: "Free", tone: "free" },
  "order-updates": { label: "Free when they message first", tone: "free" },
  "support-inbox": { label: "Free for plain chat", tone: "free" },
  "ai-agent": { label: "Follows each tool's method", tone: "note" },
};

/** Who each job is for, in a business's words (for the "same works for" strip). */
export const jobPlace: Record<string, string> = {
  "salon-bookings": "a salon or clinic",
  "hotel-notifications": "a hotel",
  otp: "an app's sign-in",
  "pbx-calls": "a phone line",
  stickers: "a playful bot",
  media: "menus and invoices",
  "order-updates": "a shop",
  "support-inbox": "a support team",
  "ai-agent": "an AI agent",
};

export const nav = [
  { href: "recipes/", label: "Recipes" },
  { href: "features/", label: "Features" },
  { href: "integrations/", label: "Integrations" },
  { href: "pricing/", label: "Pricing" },
];

export const footer = [
  {
    title: "Product",
    links: [
      { href: "features/", label: "Features" },
      { href: "recipes/", label: "Recipes" },
      { href: "integrations/", label: "Integrations" },
      { href: "pricing/", label: "Pricing" },
      { href: "compare/", label: "Compare" },
    ],
  },
  {
    title: "Developers",
    links: [
      { href: "quickstart/", label: "Quick start" },
      { href: facts.support.docs, label: "Docs", ext: true },
      { href: facts.support.apiExplorer, label: "API explorer", ext: true },
      { href: "changelog/", label: "Changelog" },
      { href: "migrate/", label: "Migrate from v4" },
      { href: facts.support.github, label: "GitHub", ext: true },
      { href: facts.support.npm, label: "npm", ext: true },
      { href: facts.support.dockerHub, label: "Docker Hub", ext: true },
    ],
  },
  {
    title: "Community",
    links: [
      { href: facts.support.discord, label: "Discord", ext: true },
      { href: "community/", label: "Contributing" },
      { href: "integrations/#plugin-sdk", label: "Plugin SDK" },
      { href: "support/", label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: facts.support.terms, label: "Terms of Service", ext: true },
      { href: facts.support.licenceText, label: "Licence", ext: true },
      { href: "legal/", label: "Unofficial notice" },
    ],
  },
];
