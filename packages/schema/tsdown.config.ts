import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    implementor: './src/implementor.ts',
    'http-manifest': './src/http-manifest.ts',
    'methods/index': './src/methods/index.ts',
    'generated/index': './src/generated/index.ts',
  },
  format: ['cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
