import { vi } from 'vitest';

(globalThis as any).jest = Object.assign({}, vi, {
  setTimeout: (_timeout: number) => {},
});
