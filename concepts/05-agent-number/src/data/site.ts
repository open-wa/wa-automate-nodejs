// Facts come from the shared fact pack only. This module runs at build time;
// client scripts never import it, so nothing else from the pack ships.
import pack from "../../../_shared/content/openwa.json";

export const product = pack.product;
export const stats = pack.stats;
export const commands = pack.commands;
export const snippets = pack.snippets;
export const firstRun = pack.firstRun;
export const paths = pack.paths;
export const useCases = pack.useCases;
export const capabilities = pack.capabilities;
export const integrations = pack.integrations;
export const licences = pack.licences;
export const support = pack.support;
export const migration = pack.migration;
export const releases = pack.releases;
export const legal = pack.legal;

export const base = import.meta.env.BASE_URL.replace(/\/?$/u, "/");
export const href = (p: string) => `${base}${p.replace(/^\//u, "")}`;

/** Rounded down, as the pack asks: 3666 becomes 3.6k. */
export const short = (n: number) => (n >= 1000 ? `${Math.floor(n / 100) / 10}k` : String(n));

export const latest = releases[0];

export const nav = [
  { label: "Features", href: "features/" },
  { label: "Integrations", href: "integrations/" },
  { label: "AI agents", href: "ai-agents/" },
  { label: "Pricing", href: "pricing/" },
];

export const footer = [
  {
    title: "Product",
    links: [
      { label: "Features", href: href("features/") },
      { label: "Integrations", href: href("integrations/") },
      { label: "AI agents", href: href("ai-agents/") },
      { label: "Use cases", href: href("use-cases/") },
      { label: "Pricing", href: href("pricing/") },
      { label: "Compare", href: href("compare/") },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Quick start", href: href("quickstart/") },
      { label: "Docs", href: support.docs },
      { label: "API explorer", href: support.apiExplorer },
      { label: "Changelog", href: href("changelog/") },
      { label: "Migrate from v4", href: href("migrate/") },
      { label: "GitHub", href: support.github },
      { label: "npm", href: support.npm },
      { label: "Docker Hub", href: support.dockerHub },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: support.discord },
      { label: "Contributing", href: href("community/") },
      { label: "Plugin SDK", href: href("integrations/#plugin-sdk") },
      { label: "Support", href: href("support/") },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: support.terms },
      { label: "Licence", href: support.licenceText },
      { label: "Unofficial notice", href: href("legal/") },
    ],
  },
];

/** Which path each use case runs on, and the methods it leans on. */
export const useCaseDetail = [
  { path: "SocketClient + Chatwoot", methods: ["onMessage", "sendText", "getAllChats"], slug: "support-inbox" },
  { path: "Easy API", methods: ["sendText", "sendFile", "sendEvent"], slug: "notifications" },
  { path: "SocketClient or embedded", methods: ["onMessage", "onEventResponse", "sendText"], slug: "bots" },
  { path: "Webhooks plugin", methods: ["@open-wa/integration-webhook"], slug: "webhooks" },
  { path: "Embedded, several sessionIds", methods: ["createClient", "sessionId"], slug: "multi-session" },
  { path: "MCP server", methods: ["chats.getAllChats", "messages.sendText"], slug: "ai-agents" },
];
