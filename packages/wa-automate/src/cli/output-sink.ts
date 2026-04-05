import boxen from 'boxen';
import qrcode from 'qrcode-terminal';

export type CliOutputLevel = 'debug' | 'info' | 'warn' | 'error';

export interface CliOutputEntry {
  level: CliOutputLevel;
  message: string;
  meta?: Record<string, unknown>;
}

export interface CliStatusUpdate {
  phase:
    | 'boot'
    | 'config.resolved'
    | 'server.starting'
    | 'server.started'
    | 'client.starting'
    | 'auth.qr'
    | 'client.ready'
    | 'shutdown.starting'
    | 'shutdown.complete'
    | 'error';
  detail?: string;
  sessionId?: string;
}

export interface CliQrPayload {
  qr: string;
  sessionId: string;
}

export interface CliOutputSink {
  write(entry: CliOutputEntry): void;
  status(update: CliStatusUpdate): void;
  qr(payload: CliQrPayload): void;
}

function writeToConsole(level: CliOutputLevel, message: string): void {
  if (level === 'warn') {
    console.warn(message);
    return;
  }

  if (level === 'error') {
    console.error(message);
    return;
  }

  console.log(message);
}

export function createConsoleOutputSink(): CliOutputSink {
  return {
    write(entry) {
      writeToConsole(entry.level, entry.message);
    },
    status() {
      // Status updates are semantic signals for richer presenters.
    },
    qr(payload) {
      qrcode.generate(payload.qr, { small: true }, (terminalQrCode) => {
        console.log(
          boxen(terminalQrCode, {
            title: payload.sessionId,
            padding: 1,
            titleAlignment: 'center',
          })
        );
      });
    },
  };
}

let activeSink: CliOutputSink = createConsoleOutputSink();

export function getCliOutputSink(): CliOutputSink {
  return activeSink;
}

export function setCliOutputSink(sink: CliOutputSink): void {
  activeSink = sink;
}

export function resetCliOutputSink(): void {
  activeSink = createConsoleOutputSink();
}
