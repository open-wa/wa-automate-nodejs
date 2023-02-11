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
hideBreadcrumbs: true,
hideInPageTOC: true,
indexTitle: 'Exports',
publicPath: '/api/',
      out: "./api",
      tsconfig: '../_tsconfig.docs.json',
      readme:"none",
allReflectionsHaveOwnDocument: true,
entryDocument: 'reference',
      watch: process.env.TYPEDOC_WATCH,
      sidebar: {
        categoryLabel: 'API Reference',
        position: 0,
        fullNames: false
      },
  }