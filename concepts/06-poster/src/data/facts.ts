// The shared fact pack. Imported only in Astro frontmatter (build time), so
// nothing here reaches a client bundle unless a page renders it.
import facts from "../../../_shared/content/openwa.json";

export const product = facts.product;
export const stats = facts.stats;
export const commands = facts.commands;
export const firstRun = facts.firstRun;
export const snippets = facts.snippets;
export const paths = facts.paths;
export const useCases = facts.useCases;
export const capabilities = facts.capabilities;
export const integrations = facts.integrations;
export const licences = facts.licences;
export const support = facts.support;
export const migration = facts.migration;
export const releases = facts.releases;
export const legal = facts.legal;

export const starsShort = `${(Math.floor(stats.githubStars / 100) / 10).toFixed(1)}k`;
