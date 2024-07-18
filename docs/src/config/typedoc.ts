module.exports = {
    "entryPoints": [
        "../src/api",
        "../src/utils",
        "../src/controllers",
        "../src/structures",
        "../src/connect",
        "../src/logging",
      ],
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
// Markdown plugin settings

// "out": "./docs/api",
"hidePageHeader": true,
"entryFileName": "index.md",

hideBreadcrumbs: true,
// hideInPageTOC: true, //TODO: REPLACE WITH `typedoc-plugin-remark` and the `remark-toc` plugin.
// indexTitle: 'Exports', // The option `indexTitle` has been removed. Please use the `"title.indexPage"` key with option `--textContentMappings`.
publicPath: '/api/',
    //   out: "./api",
      tsconfig: '../_tsconfig.docs.json',
      readme:"none",
// allReflectionsHaveOwnDocument: true,
// entryFileName: 'reference', //TODO: The option `entryDocument` has been renamed to `entryFileName` to better reflect its purpose.
      watch: process.env.TYPEDOC_WATCH,
      sidebar: {
        categoryLabel: 'API Reference',
        position: 0,
        fullNames: false
      },
  }