import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'cli/index': './src/cli/index.ts',
  },
  format: ['cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
});
