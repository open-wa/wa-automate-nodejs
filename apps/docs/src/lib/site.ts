export type LicenseTier = 'insiders' | 'restricted';

export const SITE_NAME = 'open-wa v5 docs';
export const REPO_URL = 'https://github.com/open-wa/wa-automate-nodejs';
export const GENERIC_LICENSE_URL = 'https://smashah.gumroad.com/l/open-wa?wanted=true';
export const GENERIC_GUMROAD_URL = 'https://smashah.gumroad.com/l/open-wa?wanted=true';
export const CURRENT_VERSION = '5.0.0-alpha.1';

export const DOCS_PATHS = {
  overview: '/docs',
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
  referenceClient: '/docs/reference/client',
} as const;

export function getLicenseTierLabel(tier: LicenseTier): string {
  return tier === 'insiders' ? 'Insiders' : 'Restricted';
}

export function getLicenseTierHref(tier: LicenseTier): string {
  return tier === 'insiders'
    ? 'https://smashah.gumroad.com/l/open-wa?wanted=true&tier=Insiders%20Program'
    : 'https://smashah.gumroad.com/l/open-wa?wanted=true&tier=1%20Restricted%20License%20Key';
}

export function getLicenseTierSummary(tier: LicenseTier): string {
  return tier === 'insiders'
    ? 'May require an insiders license for advanced or early-access capabilities.'
    : 'May require a restricted license for gated or host-account-specific flows.';
}
