import type { CliRuntimeResult } from '@open-wa/wa-automate';
import type { EventProjectionStore } from '../state/event-projection-store';

export interface ShutdownRuntimeState {
  runtime?: CliRuntimeResult;
  tunnelClient?: {
    disconnect(): void;
  };
  store?: EventProjectionStore;
}

export class CliShutdownError extends AggregateError {
  constructor(errors: Error[], signal: NodeJS.Signals) {
    super(errors, `Graceful shutdown completed with ${errors.length} teardown error(s) after ${signal}`);
    this.name = 'CliShutdownError';
  }
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(`${fallback}: ${String(error)}`);
}

export async function performGracefulShutdown(state: ShutdownRuntimeState, signal: NodeJS.Signals): Promise<void> {
  const { runtime, tunnelClient, store } = state;
  const errors: Error[] = [];

  store?.projectStatus({ phase: 'shutdown.starting', detail: `Received ${signal}` });

  if (runtime) {
    try {
      await runtime.server.stop();
    } catch (error) {
      errors.push(normalizeError(error, 'server.stop failed'));
    }
  }

  if (tunnelClient) {
    try {
      tunnelClient.disconnect();
    } catch (error) {
      errors.push(normalizeError(error, 'tunnel.disconnect failed'));
    }
  }

  if (runtime) {
    try {
      await runtime.client.stop(`signal:${signal}`);
    } catch (error) {
      errors.push(normalizeError(error, 'client.stop failed'));
    }
  }

  store?.projectStatus({ phase: 'shutdown.complete', detail: `Shutdown completed after ${signal}` });

  if (errors.length > 0) {
    throw new CliShutdownError(errors, signal);
  }
}

export function writeVisibleFatalError(message: string, writeRawStderr: (message: string) => void): void {
  writeRawStderr(`\nFatal error: ${message}\n`);
}
