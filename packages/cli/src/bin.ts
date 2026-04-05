#!/usr/bin/env node
import { resetCliOutputSink, runCli, setCliOutputSink, type CliRuntimeResult } from '@open-wa/wa-automate';
import { TunnelClient } from './tunnel-client';
import { parseCliLocalFlags } from './config/cli-flags-schema';
import { performGracefulShutdown, writeVisibleFatalError } from './runtime/cli-termination';
import type { OutputBroker } from './runtime/output-broker';
import { detectOutputMode } from './runtime/output-mode';
import { createInteractiveCliSession } from './runtime/interactive-session';
import { createShutdownController } from './runtime/shutdown-controller';
import type { EventProjectionStore } from './state/event-projection-store';

async function main() {
  const parsedLocalFlags = parseCliLocalFlags(process.argv.slice(2));
  const outputMode = detectOutputMode({ flags: parsedLocalFlags.flags });

  let broker: OutputBroker | undefined;
  let store: EventProjectionStore | undefined;
  let detachEvents: (() => void) | undefined;
  let interactiveCleanup: ((options?: { clearPresenter?: boolean }) => void) | undefined;

  const cleanupCliResources = (options: { clearPresenter?: boolean } = {}) => {
    const clearPresenter = options.clearPresenter ?? true;
    detachEvents?.();
    detachEvents = undefined;
    resetCliOutputSink();
    interactiveCleanup?.({ clearPresenter });
    interactiveCleanup = undefined;
    broker = undefined;
    store = undefined;
  };

  if (outputMode.interactive) {
    const session = await createInteractiveCliSession();
    broker = session.broker;
    store = session.store;
    interactiveCleanup = session.cleanup;
    setCliOutputSink(session.sink);
  }

  let runtime: CliRuntimeResult | undefined;
  let tunnelClient: TunnelClient | undefined;

  const shutdownController = createShutdownController({
    timeoutMs: 10_000,
    gracefulShutdown: async (signal) => {
      await performGracefulShutdown({ runtime, tunnelClient, store }, signal);
    },
    cleanup: async () => {
      cleanupCliResources();
    },
  });

  shutdownController.install();

  try {
    const result = await runCli(parsedLocalFlags.forwardedArgs);
    runtime = result as CliRuntimeResult | undefined;

    if (!runtime) {
      shutdownController.dispose();
      cleanupCliResources();
      return;
    }

    if (store) {
      detachEvents = store.attachEmitter(runtime.events);
    }
    
    // If pm2 is used, result is void
    if (runtime?.config.proxyHost && runtime.config.proxyToken) {
      const log = (level: 'info' | 'warn' | 'error', message: string) => {
        if (broker) {
          broker.write(level, message);
          return;
        }

        if (level === 'warn') {
          console.warn(message);
          return;
        }

        if (level === 'error') {
          console.error(message);
          return;
        }

        console.log(message);
      };

      log('info', `[CLI] Starting TunnelClient connecting to ${runtime.config.proxyHost}...`);
      tunnelClient = new TunnelClient({
        proxyHost: runtime.config.proxyHost,
        proxyToken: runtime.config.proxyToken,
        sessionId: runtime.config.sessionId,
        localSessionPort: runtime.config.port,
        log,
      });
      tunnelClient.connect();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? `${err.message}${err.stack ? `\n${err.stack}` : ''}` : String(err);
    store?.projectStatus({ phase: 'error', detail: message });
    shutdownController.dispose();
    if (broker) {
      broker.write('error', `Fatal error: ${message}`);
      writeVisibleFatalError(message, (rawMessage) => broker?.writeRawStderr(rawMessage));
      cleanupCliResources({ clearPresenter: false });
    } else {
      console.error('Fatal error:', err);
    }
    process.exit(1);
  }
}

main();
