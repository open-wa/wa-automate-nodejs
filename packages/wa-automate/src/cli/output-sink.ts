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
    | 'launch.auth'
    | 'launch.helpers'
    | 'launch.patch'
    | 'launch.license'
    | 'launch.finalize'
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
  promptChoice?(question: string, choices: readonly string[]): Promise<number>;
}

export async function promptChoice(question: string, choices: readonly string[]): Promise<number> {
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    throw new Error('No browser is installed. Choose --use-chrome, --use-chromium or --use-lightpanda to download one without a prompt.');
  }
  const { createInterface } = await import('node:readline/promises');
  const readline = createInterface({ input: process.stdin, output: process.stderr });
  const abort = new AbortController();
  readline.on('SIGINT', () => abort.abort());
  readline.on('close', () => abort.abort());
  try {
    process.stderr.write(`\n${question}\n${choices.map((choice, index) => `  ${index + 1}. ${choice}`).join('\n')}\n`);
    while (true) {
      const answer = (await readline.question('Choose a browser [1]: ', { signal: abort.signal })).trim();
      const choice = answer === '' ? 0 : Number(answer) - 1;
      if (Number.isInteger(choice) && choice >= 0 && choice < choices.length) return choice;
      process.stderr.write(`Enter a number from 1 to ${choices.length}.\n`);
    }
  } catch (cause) {
    throw new Error('Browser selection cancelled.', { cause });
  } finally {
    readline.close();
  }
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
    promptChoice,
    write(entry) {
      writeToConsole(entry.level, entry.message);
    },
    status() {
      // Status updates are semantic signals for richer presenters.
    },
    qr(payload) {
      qrcode.generate(payload.qr, { small: true }, (terminalQrCode) => {
        console.log(`WhatsApp login: ${payload.sessionId}\n${terminalQrCode}`);
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
