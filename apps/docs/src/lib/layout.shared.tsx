import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GetLicenseButton } from '@/components/licensing';
import { DOCS_PATHS, REPO_URL } from '@/lib/site';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <img src="/logo.png" alt="Open-wa" className="w-5 h-5 object-contain" />
          <span>open-wa/wa-automate</span>
        </span>
      ),
      url: '/',
    },
    links: [
      {
        text: 'Get Started',
        type: 'menu',
        items: [
          {
            text: 'CLI/EASY API',
            url: DOCS_PATHS.quickstart,
          },
          {
            text: 'NodeJS',
            url: DOCS_PATHS.easyApi,
          },
          {
            text: 'Docker',
            url: DOCS_PATHS.easyApi,
          },
        ],
      },
      {
        text: 'The Client API',
        url: '/docs/reference/client/client',
        active: 'nested-url',
      },
      {
        text: 'API Explorer',
        url: DOCS_PATHS.apiExplorer,
      },
      {
        text: 'Community',
        type: 'menu',
        items: [
          {
            text: 'GitHub',
            url: REPO_URL,
            external: true,
          },
          {
            text: 'Discord',
            url: 'https://discord.gg/dpan7EYE3t',
            external: true,
          },
          {
            text: 'Twitter',
            url: 'https://twitter.com/openwadev',
            external: true,
          },
        ],
      },
      {
        text: 'Licensing',
        url: DOCS_PATHS.licensedFeatures,
        active: 'nested-url',
      },
      {
        type: 'custom',
        on: 'nav',
        secondary: true,
        children: <GetLicenseButton className="navbar-lic-button" subtle />,
      },
    ],
    githubUrl: REPO_URL,
  };
}
