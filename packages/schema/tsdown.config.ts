import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: './src/index.ts',
    'calling-media': './src/calling-media.ts',
    interactive: './src/interactive.ts',
    implementor: './src/implementor.ts',
    'http-manifest': './src/http-manifest.ts',
    'methods/index': './src/methods/index.ts',
    'generated/index': './src/generated/index.ts',
    'method-parameters': './src/generated/methodParameters.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
