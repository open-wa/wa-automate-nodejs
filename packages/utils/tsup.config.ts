import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    external: [],
    esbuildOptions(options) {
        options.banner = {
            js: '// @open-wa/utils - Shared generic utilities for open-wa',
        };
    },
});
