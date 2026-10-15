/**
 * The fact pack, trimmed to what this concept renders. Every command, snippet,
 * price and stat on the site comes through here from
 * concepts/_shared/content/openwa.json. Nothing is invented.
 */
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

/** Round down, as the fact pack asks: 3666 → "3.6k". */
export const short = (n: number): string =>
  n >= 1000 ? `${Math.floor(n / 100) / 10}k` : String(n);

export const fmt = (n: number): string => n.toLocaleString("en-GB");

export const checked = stats.checkedOn; // "12 Oct 2026"
export const pricesNote = "Prices checked 12 Oct 2026 on Gumroad, in GBP. Checkout shows the current price.";

export const tiers = licences.tiers;
export const tierById = (id: string) => tiers.find((t) => t.id === id);

/** Method names each tier unlocks, pulled from the fact pack's prose. */
export const methodsByTier: Record<string, string[]> = {
  insiders: ["getNumberProfile", "checkNumberStatus", "sendInteractive", "sendButtons", "sendListMessage"],
  restricted: ["createGroup", "joinGroupViaLink", "joinGroup"],
};

export const pathSnippet: Record<string, { code: string; lang: string; file: string }> = {
  "easy-api": { code: commands.easyApi, lang: "bash", file: "Terminal" },
  "socket-client": { code: snippets.socketClient, lang: "js", file: "bot.mjs" },
  embedded: { code: snippets.embedded, lang: "js", file: "app.mjs" },
  mcp: { code: snippets.mcpConfig, lang: "js", file: "wa.config.mjs" },
};

export const pathInstall: Record<string, string | undefined> = {
  "easy-api": undefined,
  "socket-client": commands.socketClientInstall,
  embedded: commands.embeddedInstall,
  mcp: snippets.mcpStart,
};
