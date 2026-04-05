export type BrokerLevel = 'debug' | 'info' | 'warn' | 'error';
export type BrokerSource = 'console' | 'stdout' | 'stderr' | 'runtime';

export interface BrokerEntry {
  level: BrokerLevel;
  message: string;
  source: BrokerSource;
  timestamp: number;
}

export interface OutputBrokerOptions {
  interactive: boolean;
  maxEntries?: number;
  passthrough?: boolean;
  interceptStreams?: boolean;
}

type Subscriber = (entry: BrokerEntry) => void;
type ConsoleMethod = (...args: unknown[]) => void;
type StreamWrite = (chunk: any, encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => boolean;

function stringifyArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') {
        return arg;
      }

      if (arg instanceof Error) {
        return arg.stack ?? arg.message;
      }

      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }

      return String(arg);
    })
    .join(' ');
}

export class OutputBroker {
  private readonly interactive: boolean;
  private readonly maxEntries: number;
  private readonly passthrough: boolean;
  private readonly interceptStreams: boolean;
  private readonly entries: BrokerEntry[] = [];
  private readonly subscribers = new Set<Subscriber>();
  private installed = false;
  private originalConsole?: {
    log: ConsoleMethod;
    warn: ConsoleMethod;
    error: ConsoleMethod;
  };
  private originalWrites?: {
    stdout: StreamWrite;
    stderr: StreamWrite;
  };

  constructor(options: OutputBrokerOptions) {
    this.interactive = options.interactive;
    this.maxEntries = options.maxEntries ?? 200;
    this.passthrough = options.passthrough ?? !options.interactive;
    this.interceptStreams = options.interceptStreams ?? true;
  }

  install(): void {
    if (this.installed) {
      return;
    }

    this.installed = true;
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
    this.originalWrites = {
      stdout: process.stdout.write.bind(process.stdout),
      stderr: process.stderr.write.bind(process.stderr),
    };

    console.log = (...args: unknown[]) => {
      this.forward('info', 'console', stringifyArgs(args), () => this.originalConsole?.log(...args));
    };
    console.warn = (...args: unknown[]) => {
      this.forward('warn', 'console', stringifyArgs(args), () => this.originalConsole?.warn(...args));
    };
    console.error = (...args: unknown[]) => {
      this.forward('error', 'console', stringifyArgs(args), () => this.originalConsole?.error(...args));
    };

    if (this.interceptStreams) {
      process.stdout.write = ((chunk: any, encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => {
        const message = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
        this.forward('info', 'stdout', message, () => this.originalWrites?.stdout(chunk, encoding as any, callback));
        if (this.interactive && !this.passthrough) {
          if (typeof encoding === 'function') {
            encoding(undefined);
          } else {
            callback?.(undefined);
          }
        }
        return true;
      }) as StreamWrite;

      process.stderr.write = ((chunk: any, encoding?: BufferEncoding | ((error?: Error | null) => void), callback?: (error?: Error | null) => void) => {
        const message = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
        this.forward('error', 'stderr', message, () => this.originalWrites?.stderr(chunk, encoding as any, callback));
        if (this.interactive && !this.passthrough) {
          if (typeof encoding === 'function') {
            encoding(undefined);
          } else {
            callback?.(undefined);
          }
        }
        return true;
      }) as StreamWrite;
    }
  }

  dispose(): void {
    if (!this.installed) {
      return;
    }

    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
    }

    if (this.originalWrites && this.interceptStreams) {
      process.stdout.write = this.originalWrites.stdout as typeof process.stdout.write;
      process.stderr.write = this.originalWrites.stderr as typeof process.stderr.write;
    }

    this.installed = false;
  }

  subscribe(listener: Subscriber): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  getEntries(): BrokerEntry[] {
    return [...this.entries];
  }

  writeRawStdout(message: string): void {
    this.originalWrites?.stdout(message);
  }

  writeRawStderr(message: string): void {
    this.originalWrites?.stderr(message);
  }

  write(level: BrokerLevel, message: string, source: BrokerSource = 'runtime'): void {
    this.forward(level, source, message);
  }

  private forward(level: BrokerLevel, source: BrokerSource, message: string, passthroughWriter?: () => void): void {
    const entry: BrokerEntry = {
      level,
      source,
      message,
      timestamp: Date.now(),
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }

    for (const subscriber of this.subscribers) {
      subscriber(entry);
    }

    if (!this.interactive || this.passthrough) {
      passthroughWriter?.();
    }
  }
}

export function createOutputBroker(options: OutputBrokerOptions): OutputBroker {
  return new OutputBroker(options);
}
