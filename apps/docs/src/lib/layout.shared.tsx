import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GetLicenseButton } from '@/components/licensing';
import { DOCS_PATHS, REPO_URL } from '@/lib/site';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'open-wa v5 docs',
      url: '/',
      children: <GetLicenseButton className="hidden sm:inline-flex" subtle />,
    },
    links: [
      {
        text: 'Docs',
        url: DOCS_PATHS.overview,
        active: 'nested-url',
      },
      {
        text: 'Getting Started',
        url: DOCS_PATHS.easyApi,
        active: 'nested-url',
      },
      {
        text: 'Integrations',
        url: DOCS_PATHS.chatwoot,
        active: 'nested-url',
      },
      {
        text: 'Licensing',
        url: DOCS_PATHS.licensedFeatures,
        active: 'nested-url',
      },
    ],
    githubUrl: REPO_URL,
  };
}
