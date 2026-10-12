// Server-side only: pages import the fields they render from the fact pack.
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
export const href = (p = "") => `${base}${p.replace(/^\//u, "")}`;

/** 3,666 -> "3.6k" (rounded down, as the fact pack asks). */
export const k = (n: number) => (n >= 100000 ? `${Math.floor(n / 1000)}k` : `${Math.floor(n / 100) / 10}k`);

export const starsLabel = `${k(stats.githubStars)}`;
export const checked = stats.checkedOn;
