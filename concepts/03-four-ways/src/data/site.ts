// Every fact on this site comes from the shared fact pack. Nothing here is
// invented: this module only picks fields and formats them.
import fact from "../../../_shared/content/openwa.json";

export const product = fact.product;
export const stats = fact.stats;
export const commands = fact.commands;
export const snippets = fact.snippets;
export const firstRun = fact.firstRun;
export const paths = fact.paths;
export const useCases = fact.useCases;
export const capabilities = fact.capabilities;
export const integrations = fact.integrations;
export const licences = fact.licences;
export const links = fact.support;
export const migration = fact.migration;
export const releases = fact.releases;
export const legal = fact.legal;

export const base = import.meta.env.BASE_URL.replace(/\/?$/u, "/");
export const href = (p = "") => `${base}${p.replace(/^\//u, "")}`;

const k = (n: number) => `${Math.floor(n / 100) / 10}k`;
export const starsShort = k(stats.githubStars); // 3.6k
export const fmt = (n: number) => n.toLocaleString("en-GB");
export const downloadsYearShort = `${Math.floor(stats.npmDownloadsLast12Months / 1000)}k`; // 105k
export const checked = stats.checkedOn; // 12 Oct 2026
export const latest = releases[0];

export const nav = {
  product: [
    { label: "Features", href: href("features/"), note: "Messages, media, groups, polls, events" },
    { label: "Integrations", href: href("integrations/"), note: "Webhooks, Chatwoot, Node-RED, S3" },
    { label: "AI agents", href: href("ai-agents/"), note: "The built-in MCP server" },
    { label: "Use cases", href: href("use-cases/"), note: "Inboxes, notifications, bots" },
  ],
  paths: [
    { label: "Easy API", href: href("quickstart/#easy-api"), note: "An HTTP API from one command" },
    { label: "SocketClient", href: href("quickstart/#socket-client"), note: "A bot that connects to a running API" },
    { label: "Embedded runtime", href: href("quickstart/#embedded"), note: "createClient inside your app" },
    { label: "MCP server", href: href("quickstart/#mcp"), note: "WhatsApp tools for an AI agent" },
  ],
  decide: [
    { label: "Official API or open-wa?", href: href("compare/"), note: "Honest trade-offs" },
    { label: "Pricing", href: href("pricing/"), note: "Free for most methods" },
    { label: "Migrate from v4", href: href("migrate/"), note: "Pin v4 while you move" },
    { label: "Changelog", href: href("changelog/"), note: `${latest.version}, ${latest.date}` },
  ],
};

export const footer = [
  {
    title: "Product",
    items: [
      ["Features", href("features/")],
      ["Integrations", href("integrations/")],
      ["AI agents", href("ai-agents/")],
      ["Use cases", href("use-cases/")],
      ["Pricing", href("pricing/")],
      ["Compare", href("compare/")],
    ],
  },
  {
    title: "Developers",
    items: [
      ["Quick start", href("quickstart/")],
      ["Docs", links.docs],
      ["API explorer", links.apiExplorer],
      ["Changelog", href("changelog/")],
      ["Migrate from v4", href("migrate/")],
      ["GitHub", links.github],
      ["npm", links.npm],
      ["Docker Hub", links.dockerHub],
    ],
  },
  {
    title: "Community",
    items: [
      ["Discord", links.discord],
      ["Community", href("community/")],
      ["Contributing", href("community/#contributing")],
      ["Plugin SDK", href("integrations/#plugin-sdk")],
      ["Support", href("support/")],
    ],
  },
  {
    title: "Legal",
    items: [
      ["Terms of Service", links.terms],
      ["Licence", links.licenceText],
      ["Unofficial notice", href("legal/#unofficial")],
      ["Legal", href("legal/")],
    ],
  },
] as const;
