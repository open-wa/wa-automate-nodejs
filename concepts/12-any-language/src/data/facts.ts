// The fact pack is the single source for every command, price, stat and job.
import facts from "../../../_shared/content/openwa.json";

export const f = facts;
export const base = import.meta.env.BASE_URL.replace(/\/?$/u, "/");
export const href = (p = "") => `${base}${p.replace(/^\//u, "")}`;

export const stars = `${Math.floor(facts.stats.githubStars / 100) / 10}k`;
export const checked = facts.stats.checkedOn;
export const priceNote = "Prices checked 12 Oct 2026 on Gumroad. Checkout shows the current price.";

export const tiers = facts.licences.tiers;
export const insiders = tiers.find((t) => t.id === "insiders")!;
export const restricted = tiers.find((t) => t.id === "restricted")!;

export const jobs = facts.jobs;
export const job = (id: string) => facts.jobs.find((j) => j.id === id)!;

export const nav = [
  { label: "Recipes", href: href("recipes/") },
  { label: "Features", href: href("features/") },
  { label: "Integrations", href: href("integrations/") },
  { label: "Pricing", href: href("pricing/") },
];

export const S = facts.support;
