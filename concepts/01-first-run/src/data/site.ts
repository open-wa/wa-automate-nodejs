// Everything rendered comes from the shared fact pack. Import only what's used.
import pack from "../../../_shared/content/openwa.json";

export const product = pack.product;
export const stats = pack.stats;
export const commands = pack.commands;
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
export const firstRun = pack.firstRun;

export const base = import.meta.env.BASE_URL.replace(/\/?$/u, "/");
export const href = (p: string) => base + p.replace(/^\//u, "");

/** 3666 -> "3.6k": round down, as the fact pack asks. */
export const kfloor = (n: number) =>
  n >= 1000 ? `${Math.floor(n / 100) / 10}k`.replace(/\.0k$/u, "k") : String(n);

export const starsShort = kfloor(stats.githubStars);
export const checked = stats.checkedOn;

/** The three ways to start, for the hero tabs. */
export const runTabs = [
  { id: "npx", label: "npx", cmd: commands.easyApi, note: "Easy API on port 8080. Needs Node.js " + product.node.replace(">=", "") + " or newer." },
  { id: "docker", label: "Docker", cmd: commands.docker, note: "Same Easy API in a container, published on port 8080." },
  { id: "npm", label: "npm", cmd: commands.embeddedInstall, note: "Embed the runtime in your own Node.js app with createClient." },
];

export const nav = [
  { label: "Features", href: href("features/") },
  { label: "Integrations", href: href("integrations/") },
  { label: "AI agents", href: href("ai-agents/") },
  { label: "Pricing", href: href("pricing/") },
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
      { label: "Official API or open-wa?", href: href("compare/") },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Quick start", href: href("quickstart/") },
      { label: "Docs", href: support.docs, ext: true },
      { label: "API explorer", href: support.apiExplorer, ext: true },
      { label: "Changelog", href: href("changelog/") },
      { label: "Migrate from v4", href: href("migrate/") },
      { label: "GitHub", href: support.github, ext: true },
      { label: "npm", href: support.npm, ext: true },
      { label: "Docker Hub", href: support.dockerHub, ext: true },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: support.discord, ext: true },
      { label: "Community", href: href("community/") },
      { label: "Contributing", href: support.github + "/blob/master/CONTRIBUTING.md", ext: true },
      { label: "Plugin SDK", href: href("integrations/#plugin-sdk") },
      { label: "Support and consulting", href: href("support/") },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: support.terms, ext: true },
      { label: "Software licence", href: support.licenceText, ext: true },
      { label: "Unofficial notice", href: href("legal/#unofficial") },
      { label: "Ban-risk notice", href: href("legal/#risk") },
    ],
  },
];
