import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import typedocOptions from "./src/config/typedoc"
// import path from 'path';
// const replace = require('replace-in-file');
import { replaceInFileSync } from 'replace-in-file'
import { consts, customFields } from "./src/config/consts"
import { visit } from 'unist-util-visit';
// const visit = require('unist-util-visit');
import { unified } from 'unified';
// unified import('unified')).default;
import remarkGfm from 'remark-gfm';
// remarkGfm = (await import('remark-gfm')).default;
import remarkParse from 'remark-parse';
import tailwindPlugin from './plugins/tailwind-config';
// remarkParse = (await import('remark-parse')).default;

const RE_VAR = /{@([\w-_]+)@}/g
const RE_VAR_NEW = /\|@\|([\w-_]+)\|@\|/g
const RE_LABEL = /{@([\w-:]+)@}/
const BLOCK_REGEX = /#{3}.*[.,\s]*.*[.,\s]*{@([\w-:]+)@}/g
// const customFields = require("./src/config/customFields")

const parseMD = (md) => unified()
  .use(remarkParse)
  .use(remarkGfm)
  .parse(md)

const iterate = (obj) => {
  Object.keys(obj).forEach(key => {

    if (obj[key]?.includes && obj[key] == ("]")) console.log(`key: ${key}, value: ${obj[key]}`)

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      iterate(obj[key])
    }
  })
}

function variable() {
  const getVariable = (full, partial) =>
    partial ? customFields[partial] : full

  const getLabel = (full, partial) => partial ? customFields.labels[partial] : full


  function textVisitor(node, vfile) {
    if (!["text", "code"].includes(node.type)) return
    const matches = node.value.match(RE_VAR_NEW)
    if (matches) {
      console.log("🚀 ~ textVisitor ~ matches:", matches)
      //check if it's meant to be a table
      if (matches.find(match => match.toLowerCase().includes("table"))) {
        const field = matches[0].replace(RE_VAR_NEW, (_, x) => x)
        const resss = parseMD(customFields[field]).children[0]
        Object.assign(node, resss)
      }
      else node.value = node.value.replace(RE_VAR_NEW, getVariable)
    } else if (node.value === "]") {
      // console.log("EMPTY NODE", node)
      Object.assign(node, parseMD(``).children[0])
    } else if (node.value.match(RE_LABEL)) {
      // console.log("🚀 ~ file: docusaurus.config.js ~ line 125 ~ textVisitor ~ node, vfile", node, vfile)
      console.log("THIS IS A LABEL", node.value);
      // nodeReplace(node, node.value.replace(RE_LABEL, getLabel))
      // console.log("🚀 ~ file: docusaurus.config.js ~ line 143 ~ textVisitor ~ match", match)
      // node.value = node.value.replace(RE_LABEL, getLabel)
      // console.log("🚀 ~ file: docusaurus.config.js ~ line 157 ~ textVisitor ~ node.value", node.value)
      // console.log(JSON.stringify(parseAdmonMd(node.value)))
      // // const children = parseAdmonMd(node.value).children;
      // const firstChildNode = parseAdmonMd(node.value).children[0];
      // // firstChildNode.children[0].value = children.flatMap(x=>x.children?.flatMap(x=>x.value) || x.value).join("\n")
      // //append rest of the nodes' values to the firstChildNode value

      // Object.assign(node, firstChildNode)
      // console.log("REPLACED", JSON.stringify(node));
    }
    //maybe it's a config link
    // else if(node.value.match(confRegex)){
    // else if(node.value.includes("ConfigObject.sessionId") || node.value.includes("[[")){
    //   console.log('asdasdasd', node, node.value, node.parent)
    //   nodeReplace(node, node.value.replace(confRegex, (full,partial) => `[\`${partial}\`](/docs/api/interfaces/api.ConfigObject#${partial})` ))
    // }
  }

  function linkVisitor(node) {
    node.url = node.url.replace(RE_VAR, getVariable)
    if (!node.url) console.log("🚀 ~ file: docusaurus.config.js ~ line 47 ~ linkVisitor ~ node", node)
    if (node.title) {
      node.title = node.title.replace(RE_VAR, getVariable)
      if (node.title?.includes("ConfigObject.")) {
        console.log('xxxxx', node)
      }
    }
  }
  function linkReferenceVisitor(node) {
    const linkRefReplace = (node, rawMd) => Object.assign(node, parseMD(rawMd).children[0].children[0])
    if (node.label.startsWith("ConfigObject.")) {
      // linkRefReplace(node,`[\`${node.label}\`](/docs/api/interfaces/api.ConfigObject#${node.label.replace("ConfigObject.", "")})`)
    } else if (node.label.startsWith("create")) {
      // linkRefReplace(node,`[\`${node.label.replace("api.","")}\`](/docs/api/modules/controllers#create)`)
    } else if (node.label.startsWith("Client.")) {
      // linkRefReplace(node,`[\`${node.label.replace("api.","")}\`](/docs/api/classes/api.client/${node.label})`)
    }
    Object.assign(node, parseMD(node.value))
  }

  function paraVisitor(node) {
    // if(node?.children?.find(child=>child?.value?.includes("ConfigObject"))) console.log(node)
    iterate(node)
    // if(node?.children?.find(child=>Object.entries(child).find(([_,v])=>v?.includes && v?.includes("[[")))) console.log(node)
  }

  function transformer(ast) {
    visit(ast, "text", textVisitor)
    visit(ast, "code", textVisitor)
    // visit(ast, "link", linkVisitor)
    // visit(ast, "linkReference", linkReferenceVisitor)
    // visit(ast, paraVisitor)
  }

  return transformer
}

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
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // onBrokenLinks: 'throw',
  // onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  plugins: [
    [
      'docusaurus-plugin-typedoc',
      typedocOptions
      // {
      //   entryPoints: ['../src/index.ts'],
      //   tsconfig: '../_tsconfig.docs.json',
      // },
    ],

    // '@docusaurus/plugin-debug',
    async function mdPlaceholderReplacer(context, options) {
      // ...
      return {
        name: 'md-placeholder-replacer',
        async loadContent() {
          // ...
          /**
           * Find and replace placeholders in markdown files.
           */
          replaceInFileSync({
            files: './docs/api/**/*.md',
            from: BLOCK_REGEX,
            to: (match) => {
              const labelMatch = match.match(RE_LABEL)
              if (!labelMatch) return match
              const initLabelText = labelMatch[0]
              const [type, subtype] = labelMatch[1].split(":")
              const heading = match.match(/#{3}.*/) && match.match(/#{3}.*/)[0] || ""
              match = match.replace(heading, `${heading} <div class="label ${type} ${subtype}">${subtype}</div>`)
              const variant = subtype == "restricted" ? '1%20Restricted%20License' : 'Insiders%20Program'
              match = match.replace(initLabelText, `:::${type} May require ${subtype} license\nUse this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=${variant}).\n:::`)
              // match = match.replace(initLabelText, `${type} May require ${subtype} license\nUse this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=${variant}).\n`)
              return match;
            }
          })
        },
        async contentLoaded({ content, actions }) {
          // console.log("🚀 ~ file: docusaurus.config.js ~ line 458 ~ contentLoaded ~ content", content)
          // process.exit()
          // actions.addRoute(conf)
          // ...
        },
      };
    },
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
        { to: '/docs/api/api/Client/classes/Client', label: 'The Client API', position: 'left' },
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
          type: 'html',
          position: 'right',
          value: '<a class="navbar-lic-button" href="https://gum.co/BTMt?tier=1%20Restricted%20License">Get License</a>',
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
