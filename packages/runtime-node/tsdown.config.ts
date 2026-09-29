import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  shims: true,
  deps: {
    // These prerelease adapters use a caret for their shared implementation.
    // Ship the matched pair so downstream installs cannot select a newer ABI.
    alwaysBundle: [/^@effect\/platform-node(?:-shared)?(?:\/|$)/],
  },
});
