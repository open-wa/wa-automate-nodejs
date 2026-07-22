import { describe, expect, it } from 'vitest';
import { parseProcessMemoryRows, sumProcessTreeRssMb } from './memory-observability';

describe('browser process-tree memory', () => {
  it('includes the browser root and all descendants but excludes unrelated processes', () => {
    const rows = parseProcessMemoryRows(`
      100 1 10240
      101 100 5120
      102 101 2048
      200 1 99999
    `);

    expect(sumProcessTreeRssMb(100, rows)).toBe(17);
  });
});
