# Create an open-wa project

```bash
npm init @open-wa@latest my-bot
cd my-bot
npm start
```

Use Node.js 22.21.1 or newer. The wizard lets you choose Easy API or SDK,
JavaScript or TypeScript, a browser, and optional Voxtral, Webhook or Chatwoot
plugins. Missing choices are interactive; `--yes` uses defaults.

Configure the same options in the [project builder](https://openwa.dev/new) to
preview the exact generated files and copy a repeatable command:

```bash
npm init @open-wa@latest voice-bot -- --mode easy-api --language ts --browser chrome --plugins voxtral --voxtral-mode both --yes
```

Copy `.env.example` to `.env` when it is generated and fill in the selected
integrations' credentials. Browser and plugin downloads happen only when needed
at startup and are cached for reuse. The initializer never overwrites existing
destination files. `--no-install` generates the project without running npm.

The CLI, builder and file preview share `src/options.js` and `src/templates.js`.
The existing `wa-automate init` command delegates to this package.

See the [setup guide](https://openwa.dev/docs/getting-started/initializer) for
all flags and generated files.
