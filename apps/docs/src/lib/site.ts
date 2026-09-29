export type LicenseTier = 'insiders' | 'restricted';

export const SITE_NAME = 'open-wa v5 docs';
// Canonical origin for the docs site. Used for sitemap, robots, OG image URLs,
// and og:url so they never disagree. The docs are served at openwa.dev (there
// is no docs.openwa.dev subdomain). If the deploy moves, change it here.
export const SITE_ORIGIN = 'https://openwa.dev';
export const REPO_URL = 'https://github.com/open-wa/wa-automate-nodejs';
export const LICENSE_CHECKOUT_URL = `${SITE_ORIGIN}/checkout`;
export const GENERIC_LICENSE_URL = LICENSE_CHECKOUT_URL;
// Active docs/package line. Prerelease tags and the v4 archive are documented
// on their own pages; shell, search, feedback, and generated metadata use the
// supported stable release here.
export const CURRENT_VERSION = '5.1.0';

export const DOCS_PATHS = {
  overview: '/docs',
  apiExplorer: '/api-explorer',
  quickstart: '/docs/getting-started/quickstart',
  easyApi: '/docs/getting-started/easy-api',
  customCode: '/docs/getting-started/custom-code',
  linkCode: '/docs/getting-started/link-code',
  configuration: '/docs/guides/configuration-and-cli',
  sessionEvents: '/docs/guides/session-events',
  multiSession: '/docs/guides/multiple-sessions',
  messages: '/docs/guides/messages',
  media: '/docs/guides/media',
  groups: '/docs/guides/groups',
  socketClient: '/docs/client-and-integrations/socket-client',
  chatwoot: '/docs/client-and-integrations/chatwoot',
  cloudflareProxy: '/docs/client-and-integrations/cf-proxy',
  proxying: '/docs/client-and-integrations/proxying-a-session',
  runtimeModel: '/docs/concepts/how-it-works',
  glossary: '/docs/concepts/glossary',
  bestPractices: '/docs/operations-and-troubleshooting/best-practices',
  errorHandling: '/docs/operations-and-troubleshooting/error-handling',
  logoutDetection: '/docs/operations-and-troubleshooting/detect-logouts',
  licensedFeatures: '/docs/licensing/licensed-features',
  integrationsOverview: '/docs/guides/integrations-overview',
  referenceClient: '/docs/reference/client/client',
} as const;

export function getLicenseTierLabel(tier: LicenseTier): string {
  return tier === 'insiders' ? 'Insiders' : 'Restricted';
}

export function getLicenseTierHref(_tier: LicenseTier): string {
  // The account checkout currently offers the “Open-WA License” product and
  // does not select a runtime tier from the docs link.
  return LICENSE_CHECKOUT_URL;
}

export function getLicenseTierSummary(tier: LicenseTier): string {
  return tier === 'insiders'
    ? 'The current method metadata marks this capability as Insiders. Confirm the offered account plan covers your runtime before purchasing.'
    : 'The current method metadata marks this capability as Restricted. Confirm the offered account plan covers your runtime before purchasing.';
}
