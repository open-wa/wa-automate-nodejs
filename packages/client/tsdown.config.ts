import { defineConfig } from 'tsdown';

export default defineConfig({
  checks: { pluginTimings: false },
  deps: {
    onlyBundle: false
  }
});
