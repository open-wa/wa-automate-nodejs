import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'nodes/listen/listen': './src/nodes/listen/listen.ts',
    'nodes/cmd/cmd': './src/nodes/cmd/cmd.ts',
    'nodes/owa-server/owa-server': './src/nodes/owa-server/owa-server.ts',
  },
  format: ['cjs'],
  dts: false,
  sourcemap: true,
  clean: false,
});
