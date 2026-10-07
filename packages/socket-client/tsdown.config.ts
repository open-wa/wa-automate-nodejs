import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: ['src/index.ts', 'src/calling-platform.ts', 'src/calling-platform.browser.ts'],
  format: ['cjs', 'esm'],
  // Keep this conditional export for the consumer's browser/Node resolver.
  external: ['@open-wa/socket-client/calling-platform'],
  dts: true,
});
