import { describe, expect, it } from 'vitest';
import { createConsoleTransport } from '../transports/console';

describe('createConsoleTransport', () => {
  it('forces logs through console methods so interactive CLI mode can broker them', () => {
    const transport = createConsoleTransport({ type: 'console', format: 'pretty' }) as any;

    expect(transport.forceConsole).toBe(true);
  });
});
