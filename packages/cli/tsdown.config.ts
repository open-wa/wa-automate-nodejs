import { defineConfig } from 'tsdown';

export default defineConfig({
  checks: { pluginTimings: false },
  deps: {
    neverBundle: ['winston']
  }
});
