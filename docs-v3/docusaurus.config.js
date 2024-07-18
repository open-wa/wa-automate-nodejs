// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const consts = require("./src/config/consts")
const typedocOptions = require("./src/config/typedoc")
// const sectionPrefix = require('./src/remark/section-prefix');
const visit = require('unist-util-visit');
const replace = require('replace-in-file');

let unified;
let remarkParse;
let remarkGfm;
let remarkRehype;
// let h;
// const RE_CONF = /\[\[ConfigObject.([\w-_]+\]\])/g
const RE_VAR = /{@([\w-_]+)@}/g
const RE_LABEL = /{@([\w-:]+)@}/
const BLOCK_REGEX = /#{3}.*[.,\s]*.*[.,\s]*{@([\w-:]+)@}/g
const customFields = require("./src/config/customFields")


const typedoc = {
  "entryPointStrategy": "Expand",
  "entryPoints": [
    "./src/api",
    "./src/utils",
    "./src/controllers",
    "./src/structures",
    "./src/connect",
    "./src/logging",
  ],
  "out": "docs",
  "exclude": [
    "**.config",
    "**/**ignore**",
    "**/**browser.ts",
    "**/popup/**",
    "**/utils/**",
    "**/**auth**",
    "**/**launch_checks**",
    "**/**preload**",
  ],
  "excludeExternals": false,
  "includeVersion": true,
  "excludeInternal": true,
  "disableSources": true,
  "excludeTags": true,
  "categorizeByGroup": true,
  "hideGenerator": true,
  "defaultCategory": "api",
  "readme": "./README.md",
  "excludePrivate": true,
}

const parseMD = (md) =>unified()
.use(remarkParse)
.use(remarkGfm)
.parse(md)

const iterate = (obj) => {
  Object.keys(obj).forEach(key => {

  if(obj[key]?.includes && obj[key] == ("]")) console.log(`key: ${key}, value: ${obj[key]}`)

  if (typeof obj[key] === 'object' && obj[key] !== null) {
          iterate(obj[key])
      }
  })
}


const nodeReplace = (node, rawMd) => {
  Object.assign(node, parseMD(rawMd))
}

function variable() {
  const getVariable = (full, partial) => 
    partial ? customFields[partial] : full
  
  const getLabel = (full, partial) => partial ? customFields.labels[partial] : full


  function textVisitor(node, vfile) {
    if(!["text","code"].includes(node.type)) return
    const matches = node.value.match(RE_VAR)
    if(matches){
      //check if it's meant to be a table
      if(matches.find(match=>match.toLowerCase().includes("table"))) {
        const field = matches[0].replace(RE_VAR,(_,x)=>x)
        const resss = parseMD(customFields[field]).children[0]
        Object.assign(node, resss)
      }
      else node.value = node.value.replace(RE_VAR, getVariable)
    } else if(node.value==="]") {
      // console.log("EMPTY NODE", node)
      Object.assign(node, parseMD(``).children[0])
    } else if(node.value.match(RE_LABEL)) {
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
    if(! node.url ) console.log("🚀 ~ file: docusaurus.config.js ~ line 47 ~ linkVisitor ~ node", node)
    if (node.title) {
      node.title = node.title.replace(RE_VAR, getVariable)
      if(node.title?.includes("ConfigObject.")){ 
        console.log('xxxxx', node)
      }
    }
  }
  function linkReferenceVisitor(node){
    const linkRefReplace = (node, rawMd) => Object.assign(node, parseMD(rawMd).children[0].children[0])
    if(node.label.startsWith("ConfigObject.")){
      // linkRefReplace(node,`[\`${node.label}\`](/docs/api/interfaces/api.ConfigObject#${node.label.replace("ConfigObject.", "")})`)
    } else if(node.label.startsWith("create")){
      // linkRefReplace(node,`[\`${node.label.replace("api.","")}\`](/docs/api/modules/controllers#create)`)
    } else if(node.label.startsWith("Client.")){
      // linkRefReplace(node,`[\`${node.label.replace("api.","")}\`](/docs/api/classes/api.client/${node.label})`)
    }
    Object.assign(node, parseMD(node.value))
  }

  function paraVisitor(node){
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


/** @type {import('@docusaurus/types').Config} */
async function createConfig(){
  unified = (await import('unified')).default;
  remarkGfm = (await import('remark-gfm')).default;
  remarkParse = (await import('remark-parse')).default;
  console.log("🚀 ~ file: docusaurus.config.js ~ line 104 ~ createConfig ~ unified", unified())
  return {
    title: '@open-wa/wa-automate-nodejs',
    tagline: 'The most advanced NodeJS WhatsApp library for chatbots with advanced features.',
    url: `https://${consts.domain}`,
    baseUrl: '/',
    customFields: customFields,
    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon.ico',
    organizationName: 'open-wa',
    projectName: 'wa-automate-nodejs',
    trailingSlash: false,
    scripts: [  {
      src: '/js/gumroad_docusaurus_cart_fix.js',
      async: true,
      defer: true
      },
      "https://gumroad.com/js/gumroad.js"
    ],
    // deploymentBranch: 'main',
    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    // i18n: {
    //   defaultLocale: 'en',
    //   locales: ['en'],
    // },
    presets: [
      [
        'classic',
        /** @type {import('@docusaurus/preset-classic').Options} */
        ({
          docs: {
            sidebarPath: require.resolve('./sidebars.js'),
            // admonitions: {
            //   tag: ':::',
            //   keywords: ['license', 'note', 'tip', 'info', 'caution', 'danger'],
            // },
            remarkPlugins: [variable],
            // Please change this to your repo.
            editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          },
          blog: {
            showReadingTime: true,
            // beforeDefaultRemarkPlugins: [variable],
            // remarkPlugins: [variable],
            // Please change this to your repo.
            editUrl:
              'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          },
          theme: {
            customCss: [
              require.resolve('./src/css/custom.css'),
              // require.resolve('./src/css/custom-sass.scss')
            ],
          },
        }),
      ],
    ],
  
    themeConfig:
      /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        navbar: {
          title: 'open-wa/wa-automate',
          // tagline: "The most reliable WhatsApp tool for chatbots with advanced features",
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
                  label: 'Docker',
                  to: "/docs/get-started/docker/",
                },
                {
                  label: 'NodeJS',
                  href: '/docs/get-started/installation',
                }
              ],
            },
            {
              type: 'dropdown',
              position: 'left',
              label: 'Resources',
              items: [
                { to: '/customers', label: 'Customers' },
                { to: '/enterprise', label: 'Enterprise' },
                { to: '/blog', label: 'Blog' },
                { to: '/cloud', label: 'Cloud' },
                { to: '/tutorials', label: 'Tutorials' },
                { to: '/licensing', label: 'Licenses' }
              ],
            },
            {
              type: 'dropdown',
              position: 'left',
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
            to: 'docs/intro',  // 'api' is the 'out' directory
            activeBasePath: 'docs',
            label: 'Documentation',
            position: 'left',
          },
            {
            to: 'docs/api/classes/api_Client.Client',  // 'api' is the 'out' directory
            activeBasePath: 'docs',
            label: 'The Client',
            position: 'left',
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
                  label : "Get A License",
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
        // prism: {
        //   theme: lightCodeTheme,
        //   darkTheme: darkCodeTheme,
        // },
      }),
  
    plugins: [
      // 'docusaurus-plugin-sass',
      [
        'docusaurus-plugin-typedoc',
        // Plugin / TypeDoc options
        typedocOptions,
      ],
      [
        '@docusaurus/plugin-client-redirects',
        {
          createRedirects(existingPath) {
            if(existingPath.includes("/docs/api/classes")) {
              return [
                existingPath.replace("/docs/api/classes", "/classes")
              ]
            }
            return undefined; // Return a falsy value: no redirect created
          },
        },
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
               replace.sync({
                files: './docs/api/**/*.md',
                from: BLOCK_REGEX,
                to: (match) => {
                      const labelMatch = match.match(RE_LABEL)
                      if(!labelMatch) return match
                      const initLabelText = labelMatch[0]
                      const [type, subtype] = labelMatch[1].split(":")
                      const heading = match.match(/#{3}.*/) && match.match(/#{3}.*/)[0] || ""
                      match = match.replace(heading, `${heading} <div class="label ${type} ${subtype}">${subtype}</div>`)
                      const variant = subtype == "restricted" ? '1%20Restricted%20License' : 'Insiders%20Program'
                      match = match.replace(initLabelText,  `:::${type} May require ${subtype} license\nUse this link to get the [correct license](https://gum.co/open-wa?wanted=true&tier=${variant}).\n:::`)
                      return match;
                }
               })
            },
            async contentLoaded({content, actions}) {
              // console.log("🚀 ~ file: docusaurus.config.js ~ line 458 ~ contentLoaded ~ content", content)
              // process.exit()
              // actions.addRoute(conf)
              // ...
            },
          };
        },
    ],
  }
}

module.exports = createConfig;
