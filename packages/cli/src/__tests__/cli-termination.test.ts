import { describe, expect, it, vi } from 'vitest';
import { CliShutdownError, performGracefulShutdown, writeVisibleFatalError } from '../runtime/cli-termination';

describe('CLI termination helpers', () => {
  it('attempts all teardown steps even when one rejects', async () => {
    const order: string[] = [];
    const store = {
      projectStatus: vi.fn((update: { phase: string }) => {
        order.push(`status:${update.phase}`);
      }),
    };
    const runtime = {
      server: {
        stop: vi.fn(async () => {
          order.push('server.stop');
          throw new Error('server breach');
        }),
      },
      client: {
        stop: vi.fn(async () => {
          order.push('client.stop');
        }),
      },
    } as any;
    const tunnelClient = {
      disconnect: vi.fn(() => {
        order.push('tunnel.disconnect');
      }),
    };

    const result = performGracefulShutdown({ runtime, tunnelClient, store: store as any }, 'SIGTERM');

    await expect(result).rejects.toBeInstanceOf(CliShutdownError);
    expect(order).toEqual([
      'status:shutdown.starting',
      'server.stop',
      'tunnel.disconnect',
      'client.stop',
      'status:shutdown.complete',
    ]);
  });

  it('writes fatal errors directly to raw stderr for visibility', () => {
    const writeRawStderr = vi.fn();

    writeVisibleFatalError('reactor offline', writeRawStderr);

    expect(writeRawStderr).toHaveBeenCalledWith('\nFatal error: reactor offline\n');
  });
});
