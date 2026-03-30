import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: process.env.SOCKET_CLIENT_INTEGRATION === 'true' ? ['test/**/*.test.ts'] : [],
    setupFiles: ['../../tools/vitest-jest-compat.ts'],
    testTimeout: 30000,
    passWithNoTests: true,
  },
});
