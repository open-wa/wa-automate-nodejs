import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // The unit tests use a local stub of the Easy API. The other tests need a real one.
    include: process.env.SOCKET_CLIENT_INTEGRATION === 'true' ? ['test/**/*.test.ts'] : ['test/unit/**/*.test.ts'],
    setupFiles: ['../../tools/vitest-jest-compat.ts'],
    testTimeout: 30000,
    passWithNoTests: true,
  },
});
