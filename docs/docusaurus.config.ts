import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { typedocOptions } from "./src/config/typedoc"
import { consts, customFields } from "./src/config/consts"
import { tailwindPlugin } from './plugins/tailwind-config';
import { markdownReplacerPlugin, variable } from './plugins/markdown-replacer';

const config: Config = {
  title: '@open-wa/wa-automate-nodejs',
  tagline: 'The most advanced NodeJS library for chatbots with advanced features.',
  url: `https://${consts.domain}`,
  baseUrl: '/',
  customFields: customFields,
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'open-wa',
  projectName: 'wa-automate-nodejs',
  trailingSlash: false,
  scripts: [{
    src: '/js/gumroad_docusaurus_cart_fix.js',
    async: true,
    defer: true
  },
    "https://gumroad.com/js/gumroad.js"
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  plugins: [
    [
      "posthog-docusaurus",
      {
        apiKey: "phc_Qs2dUPQ8enwIy39BPV3ToHcTPiaHzixepIIPS8QREzD",
        appUrl: "https://posthog.synthetiko.com", // optional, defaults to "https://us.i.posthog.com"
        enableInDevelopment: true, // optional
        enable_heatmaps: true,
        loaded: () => {console.log("POSTHOG LOADED")},
      },
    ],
  [
    'docusaurus-plugin-typedoc',
    typedocOptions
  ],
  // '@docusaurus/plugin-debug',
  markdownReplacerPlugin,
  tailwindPlugin
  ],

presets: [
  [
    'classic',
    {
      docs: {
        sidebarPath: './sidebars.ts',
        // Please change this to your repo.
        // Remove this to remove the "edit this page" links.
        remarkPlugins: [variable],
        admonitions: {
          keywords: ['note', 'tip', 'info', 'warning', 'danger', 'license'],
          extendDefaults: true,
        },
        editUrl:
          'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      },
      blog: {
        showReadingTime: true,
        // Please change this to your repo.
        // Remove this to remove the "edit this page" links.
        editUrl:
          'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
      },
      theme: {
        customCss: './src/css/custom.css',
      },
    } satisfies Preset.Options,
  ],
],

  themeConfig: {
  // Replace with your project's social card
  image: 'img/docusaurus-social-card.jpg',
    navbar: {
    title: 'open-wa/wa-automate',
      logo: {
      alt: 'Open-wa',
        src: 'img/logo.png',
      },
    items: [

      {
        type: 'dropdown',
        docId: 'intro',
        position: 'left',
        label: 'Get Started',
        items: [
          {
            label: 'CLI/EASY API',
            href: '/docs/get-started/quick-run',
          },
          {
            label: 'NodeJS',
            href: '/docs/get-started/installation',
          },
          {
            label: 'Docker',
            to: "/docs/get-started/docker/",
          }
        ],
      },
      // {
      //   type: 'docSidebar',
      //   sidebarId: 'tutorialSidebar',
      //   position: 'left',
      //   label: 'Tutorial',
      // },
      { to: '/blog', label: 'Blog', position: 'left' },
      { to: '/docs/reference/api/Client/classes/Client', label: 'The Client API', position: 'left' },
      {
        type: 'dropdown',
        position: 'right',
        label: 'Community',
        items: [
          { to: customFields.githubUrl, label: 'Github' },
          { to: customFields.discordInviteUrl, label: 'Discord' },
          { to: customFields.twitterUrl, label: 'Twitter' },
        ],
      },
      {
        href: customFields.githubUrl,
        label: 'GitHub',
        position: 'right',
      },
      {
        type: 'custom-glnb',
        position: 'right',
        // value: '<a class="navbar-lic-button" href="https://gum.co/BTMt?tier=1%20Restricted%20License">Get License</a>'
      },
    ],
    },
  footer: {
    style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: customFields.discordInviteUrl,
            },
            {
              label: 'Twitter',
              href: customFields.twitterUrl
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              label: 'Emergency Support',
              href: 'https://cal.com/smashah/15min',
            },
            {
              label: '1 Hour Consultation',
              href: 'https://www.buymeacoffee.com/smashah',
            },
            {
              label: 'Contracting',
              href: 'mailto:shah@openwa.dev?subject=WhatsApp%20Consulting',
            },
            {
              label: 'Twitter',
              href: customFields.twitterUrl
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: "Get A License",
              href: "https://openwa.page.link/key"
            },
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/facebook/docusaurus',
            },
          ],
        },
      ],
        copyright: `Copyright © ${new Date().getFullYear()} open-wa. Docs by Docusaurus.`,
    },

  algolia: {
    // The application ID provided by Algolia
    appId: '345AS1OFCF',

      // Public API key: it is safe to commit it
      apiKey: '04ffcb0cee53d965fb8605035ecdc04b',

        indexName: 'openwa',

          // Optional: see doc section below
          contextualSearch: false,

            // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
            // externalUrlRegex: 'external\\.com|domain\\.com',

            // Optional: Algolia search parameters
            // searchParameters: {},

            // Optional: path for search page that enabled by default (`false` to disable it)
            searchPagePath: 'search',

      //... other Algolia params
    },
  prism: {
    theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
} satisfies Preset.ThemeConfig,
};

export default config;
