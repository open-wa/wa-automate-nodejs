/** Exact historical paths with a useful current replacement. */
const legacyDocs: Record<string, string> = {
  '/reference/cli': '/docs/guides/configuration-and-cli',
  '/guides/client': '/docs/getting-started/custom-code',
  '/concepts/architecture': '/docs/reference/core',
  '/docs/configuration/command-line-options': '/docs/guides/configuration-and-cli',
};

export function getLegacyDocsRedirect(pathname: string): string | undefined {
  return legacyDocs[pathname.replace(/\/+$/, '')];
}
