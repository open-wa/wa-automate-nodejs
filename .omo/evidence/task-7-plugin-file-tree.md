# Task 7 plugin file tree

Result: pass.

Source evidence:
- `packages/core/src/plugins/PluginLoader.ts` uses dynamic `import(ref)` and accepts default or named `plugin` export.
- `packages/core/src/plugins/PluginHost.ts` looks up `pluginConfig[plugin.meta.name]` and logs `plugin_registered`.

Docs evidence:
- `plugins/getting-started.mdx` shows `my-openwa-app/wa.config.mjs` plus `plugins/greeting-bot.mjs`, uses `new URL(..., import.meta.url).href`, and says the local plugin should be loadable JavaScript at runtime.
