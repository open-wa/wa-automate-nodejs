import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/__tests__/**/*.ts'],
    setupFiles: ['../../tools/vitest-jest-compat.ts'],
  },
});
