import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { DOCS_PATHS, REPO_URL } from '@/lib/site';
import { GetLicenseButton } from '@/components/licensing';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      transparentMode: 'top',
      title: (
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <img src="/logo.png" alt="" className="size-4 object-contain" />
          </span>
          <span>open-wa</span>
        </span>
      ),
      url: '/',
    },
    links: [
      { type: 'custom', secondary: true, children: <GetLicenseButton className="license-header-button" /> },
      { text: 'Docs', url: DOCS_PATHS.overview },
      { text: 'API reference', url: DOCS_PATHS.referenceClient },
      { text: 'Integrations', url: DOCS_PATHS.integrationsOverview },
      { text: 'Changelog', url: DOCS_PATHS.changelog },
      {
        text: 'Resources', type: 'menu', items: [
          { text: 'API Explorer', url: DOCS_PATHS.apiExplorer },
          { text: 'Licensing', url: DOCS_PATHS.licensedFeatures },
          { text: 'GitHub', url: REPO_URL, external: true },
          { text: 'Discord', url: 'https://discord.gg/dpan7EYE3t', external: true },
        ],
      },
    ],
    githubUrl: REPO_URL,
  };
}
