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
