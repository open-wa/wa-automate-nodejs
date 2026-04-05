import type { CliOutputEntry, CliOutputSink, CliQrPayload, CliStatusUpdate } from '@open-wa/wa-automate';
import type { OutputBroker } from './output-broker';
import { createOutputBroker } from './output-broker';
import type { EventProjectionStore } from '../state/event-projection-store';
import { createEventProjectionStore } from '../state/event-projection-store';
import { InteractiveTerminalPresenter } from '../presenter/interactive-terminal';

export interface InteractiveCliSession {
  broker: OutputBroker;
  store: EventProjectionStore;
  presenter: InteractiveTerminalPresenter;
  sink: CliOutputSink;
  cleanup: (options?: { clearPresenter?: boolean }) => void;
}

function createBrokeredSink(broker: OutputBroker, store: EventProjectionStore): CliOutputSink {
  return {
    write(entry: CliOutputEntry) {
      broker.write(entry.level, entry.message);
    },
    status(update: CliStatusUpdate) {
      store.projectStatus(update);
    },
    qr(payload: CliQrPayload) {
      store.projectQr(payload);
      broker.write('info', `QR code generated for session ${payload.sessionId}`);
    },
  };
}

export async function createInteractiveCliSession(): Promise<InteractiveCliSession> {
  const broker = createOutputBroker({
    interactive: true,
    maxEntries: 200,
    passthrough: false,
    interceptStreams: false,
  });
  broker.install();

  const store = createEventProjectionStore({ maxLogs: 200, eventDebounceMs: 100 });
  const detachLogs = broker.subscribe((entry) => {
    store.projectLog(entry);
  });

  const presenter = new InteractiveTerminalPresenter({
    store,
    stdout: process.stdout,
    stderr: process.stderr,
  });

  await presenter.start();

  return {
    broker,
    store,
    presenter,
    sink: createBrokeredSink(broker, store),
    cleanup: (options = {}) => {
      detachLogs();
      presenter.stop({ clear: options.clearPresenter ?? true });
      broker.dispose();
    },
  };
}
