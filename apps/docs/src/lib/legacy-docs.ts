/**
 * Redirects for URLs from the retired docs.openwa.dev sites (Docusaurus,
 * TypeDoc and the earlier `/pages` build). docs.openwa.dev forwards every path
 * to the same path on openwa.dev, and this table sends it to the current page.
 */

/** Exact historical paths with a useful current replacement. */
const legacyDocs: Record<string, string> = {
  '/index.html': '/',
  '/modules.html': '/docs/reference',
  '/reference/cli': '/docs/guides/configuration-and-cli',
  '/guides/client': '/docs/getting-started/custom-code',
  '/concepts/architecture': '/docs/reference/core',
  '/docs/intro': '/docs',
  '/docs/api': '/docs/reference',
  '/docs/get-started/quick-run': '/docs/getting-started/easy-api',
  '/docs/get-started/docker': '/docs/getting-started/docker',
  '/docs/get-started/installation': '/docs/getting-started/custom-code',
  '/docs/get-started/link-code': '/docs/getting-started/link-code',
  '/docs/get-started/socketmode': '/docs/client-and-integrations/socket-client',
  '/docs/configuration/config-object': '/docs/guides/configuration-and-cli',
  '/docs/configuration/the-client': '/docs/getting-started/custom-code',
  '/docs/configuration/command-line-options': '/docs/guides/configuration-and-cli',
  '/docs/configuration/capture-qr': '/docs/guides/session-events',
  '/docs/configuration/capture-sd': '/docs/guides/session-events',
  '/docs/configuration/launch-events': '/docs/guides/session-events',
  '/docs/configuration/multiple-sessions': '/docs/guides/multiple-sessions',
  '/docs/configuration/licensed-features': '/docs/licensing/licensed-features',
  '/docs/how-to/send-messages': '/docs/guides/messages',
  '/docs/how-to/receive-messages': '/docs/guides/messages',
  '/docs/how-to/location': '/docs/guides/messages',
  '/docs/how-to/misc': '/docs/guides/messages',
  '/docs/how-to/read-state': '/docs/guides/messages',
  '/docs/how-to/incoming-calls': '/docs/guides/calls',
  '/docs/how-to/send-files': '/docs/guides/media',
  '/docs/how-to/receive-files': '/docs/guides/media',
  '/docs/how-to/send-videos': '/docs/guides/media',
  '/docs/how-to/sendfile': '/docs/guides/media',
  '/docs/how-to/decrypt-media': '/docs/guides/media',
  '/docs/how-to/groups': '/docs/guides/groups',
  '/docs/how-to/manage-participants': '/docs/guides/groups',
  '/docs/how-to/react-to-group-events': '/docs/guides/groups',
  '/docs/how-to/create-api': '/docs/getting-started/easy-api',
  '/docs/how-to/use-a-proxy': '/docs/client-and-integrations/proxying-a-session',
  '/docs/how-to/handle-errors': '/docs/operations-and-troubleshooting/error-handling',
  '/docs/how-to/detect-logout': '/docs/operations-and-troubleshooting/detect-logouts',
  '/docs/advanced/best-practices': '/docs/operations-and-troubleshooting/best-practices',
  '/docs/integrations/chatwoot': '/docs/client-and-integrations/chatwoot',
  // Docusaurus starter-template pages that were published by accident.
  '/blog/first-blog-post': '/blog',
  '/blog/long-blog-post': '/blog',
  '/blog/mdx-blog-post': '/blog',
  '/blog/welcome': '/blog',
};

/** Pages from the pre-Docusaurus `/pages/<Section>/<slug>.html` build, by slug. */
const legacyPageSlugs: Record<string, string> = {
  'manage-participants': '/docs/guides/groups',
  'send-videos': '/docs/guides/media',
  'capture-qr': '/docs/guides/session-events',
  'multiple-sessions': '/docs/guides/multiple-sessions',
  'the-client': '/docs/getting-started/custom-code',
  'config-object': '/docs/guides/configuration-and-cli',
  'launch-events': '/docs/guides/session-events',
  'licensed-features': '/docs/licensing/licensed-features',
  'quick-run': '/docs/getting-started/easy-api',
  installation: '/docs/getting-started/custom-code',
  docker: '/docs/getting-started/docker',
  'best-practices': '/docs/operations-and-troubleshooting/best-practices',
  'send-messages': '/docs/guides/messages',
  'receive-messages': '/docs/guides/messages',
  location: '/docs/guides/messages',
  misc: '/docs/guides/messages',
  'incoming-calls': '/docs/guides/calls',
  'send-files': '/docs/guides/media',
  'decrypt-media': '/docs/guides/media',
  groups: '/docs/guides/groups',
  'react-to-group-events': '/docs/guides/groups',
  'use-a-proxy': '/docs/client-and-integrations/proxying-a-session',
  'handle-errors': '/docs/operations-and-troubleshooting/error-handling',
  'detect-logout': '/docs/operations-and-troubleshooting/detect-logouts',
};

/**
 * Old generated API reference modules, keyed by normalized module path
 * (`api_model_config`, `controllers_initializer`, ...). The longest matching
 * prefix wins.
 */
const legacyReferenceModules: [string, string][] = [
  ['client', '/docs/reference/client/client'],
  ['model_aliases', '/docs/guides/chatid-primer'],
  ['model_id', '/docs/guides/chatid-primer'],
  ['model_config', '/docs/guides/config-schema'],
  ['model_group_metadata', '/docs/guides/groups'],
  ['model_errors', '/docs/operations-and-troubleshooting/error-handling'],
  ['model_button', '/docs/guides/interactive-messages'],
  ['model_product', '/docs/reference/client/business'],
  ['model_reactions', '/docs/reference/client/messages'],
  ['model_media', '/docs/guides/media'],
  ['model_sessioninfo', '/docs/reference/client/session'],
  ['model_call', '/docs/guides/calls'],
  ['model_label', '/docs/reference/client/labels'],
  ['model_events', '/docs/reference/client/events'],
  ['exposed', '/docs/reference/client/events'],
  ['model', '/docs/concepts/data-models'],
  ['functions', '/docs/reference/client/events'],
  ['controllers_events', '/docs/reference/events'],
  ['controllers_initializer', '/docs/reference/create'],
  ['controllers', '/docs/concepts/how-it-works'],
  ['logging', '/docs/guides/logging-and-audit'],
  ['structures', '/docs/getting-started/migrating-to-v5'],
  ['connect', '/docs/client-and-integrations/socket-client'],
];

const typeDocKinds = new Set([
  'classes',
  'interfaces',
  'enumerations',
  'enums',
  'type-aliases',
  'types',
  'functions',
  'variables',
]);

const legacyReferenceRoots = new Set(['api', 'controllers', 'logging', 'structures']);

function normalizeModule(segments: string[]): string {
  return segments
    .join('_')
    .toLowerCase()
    .replace(/[-.]/g, '_')
    .replace(/^(api_)+/, '');
}

function getReferenceModuleRedirect(module: string): string {
  for (const [prefix, destination] of legacyReferenceModules) {
    if (module === prefix || module.startsWith(`${prefix}_`)) return destination;
  }
  return '/docs/reference';
}

export function getLegacyDocsRedirect(pathname: string): string | undefined {
  let path = pathname.replace(/\/+$/, '') || '/';
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the raw path when it is not valid percent-encoding.
  }

  const exact = legacyDocs[path] ?? legacyDocs[path.toLowerCase()];
  if (exact) return exact;

  const segments = path.split('/').filter(Boolean);

  // Docusaurus starter-template sections and tags.
  if (/^\/docs\/(category|tutorial-basics|tutorial-extras)(\/|$)/.test(path)) return '/docs';
  if (/^\/blog\/tags(\/(docusaurus|facebook|hello|hola))?$/.test(path)) return '/blog';

  // /pages/<Section>/[<parent>/]<slug>(.html)
  if (segments[0] === 'pages' && segments.length >= 3) {
    const slug = segments[segments.length - 1].replace(/\.html$/, '').toLowerCase();
    return legacyPageSlugs[slug] ?? '/docs';
  }

  // Flat TypeDoc output, at the root as .html or under /docs/api:
  // /<kind>/<module>.<symbol>[.html] or /modules/<module>[.html]
  const typeDocFlat = path.match(
    /^(?:\/docs\/api)?\/(modules|classes|interfaces|enums|types|functions|variables)\/([^/]+?)(?:\.html)?$/,
  );
  if (typeDocFlat && (path.startsWith('/docs/api/') || path.endsWith('.html'))) {
    const module = typeDocFlat[1] === 'modules' ? typeDocFlat[2] : typeDocFlat[2].split('.')[0];
    return getReferenceModuleRedirect(normalizeModule([module]));
  }

  // Docusaurus TypeDoc output: /docs/api/** and /docs/reference/{api,controllers,logging,structures}/**
  const isOldApiTree = segments[0] === 'docs' && segments[1] === 'api';
  const isOldReferenceTree =
    segments[0] === 'docs' && segments[1] === 'reference' && legacyReferenceRoots.has(segments[2]);
  if (isOldApiTree || isOldReferenceTree) {
    const moduleSegments: string[] = [];
    for (const segment of segments.slice(2)) {
      if (typeDocKinds.has(segment.toLowerCase())) break;
      moduleSegments.push(segment);
    }
    if (moduleSegments.length === 0) return '/docs/reference';
    return getReferenceModuleRedirect(normalizeModule(moduleSegments));
  }

  return undefined;
}
