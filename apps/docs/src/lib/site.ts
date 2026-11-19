import { version } from '../../../../packages/wa-automate/package.json';

export type LicenseTier = 'insiders' | 'restricted';

export const SITE_NAME = 'open-wa v5 docs';
export const NOT_FOUND_TITLE = 'Page not found | open-wa';
// Canonical origin for the docs site. Used for sitemap, robots, OG image URLs,
// and og:url so they never disagree. Current docs are served at openwa.dev;
// docs.openwa.dev redirects to the current documentation.
export const SITE_ORIGIN = 'https://openwa.dev';
export const REPO_URL = 'https://github.com/open-wa/wa-automate-nodejs';
export const LICENSE_CHECKOUT_URL = `${SITE_ORIGIN}/checkout`;
export const GENERIC_LICENSE_URL = LICENSE_CHECKOUT_URL;
export const GENERIC_GUMROAD_URL = 'https://smashah.gumroad.com/l/open-wa?wanted=true';
export const RELEASES_URL = `${REPO_URL}/releases`;
export const CURRENT_VERSION = version;

export const DOCS_PATHS = {
  blog: '/blog',
  releases: RELEASES_URL,
  overview: '/docs',
  apiExplorer: '/api-explorer',
  quickstart: '/docs/getting-started/quickstart',
  easyApi: '/docs/getting-started/easy-api',
  customCode: '/docs/getting-started/custom-code',
  linkCode: '/docs/getting-started/link-code',
  sendOtp: '/docs/build/send-otp',
  bookingConfirmation: '/docs/build/booking-confirmation',
  supportBot: '/docs/build/support-bot',
  whatsappBotPython: '/docs/build/whatsapp-bot-python',
  sendMessage: '/docs/guides/send-message-api',
  receiveMessages: '/docs/guides/receive-messages',
  webhooks: '/docs/guides/receive-webhooks',
  integrations: '/docs/guides/integrations',
  sessions: '/docs/sessions',
  goToProduction: '/docs/operations/go-to-production',
  pricing: '/docs/licensing/pricing',
  configuration: '/docs/guides/configuration-and-cli',
  sessionEvents: '/docs/guides/session-events',
  multiSession: '/docs/guides/multiple-sessions',
  messages: '/docs/guides/messages',
  whatsappBot: '/docs/guides/whatsapp-bot',
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
  return `${LICENSE_CHECKOUT_URL}?tier=${tier}`;
}

export function getLicenseTierSummary(tier: LicenseTier): string {
  return tier === 'insiders'
    ? 'This method requires an Insiders license. Configure your license here, then review the current terms and price at checkout.'
    : 'This method requires a Restricted license. Configure your license here, then review the current terms and price at checkout.';
}
