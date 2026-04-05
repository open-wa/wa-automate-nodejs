export interface ShutdownControllerOptions {
  timeoutMs?: number;
  gracefulShutdown: (signal: NodeJS.Signals) => Promise<void>;
  cleanup?: () => void | Promise<void>;
  exit?: (code: number) => never | void;
}

export class ShutdownController {
  private readonly timeoutMs: number;
  private readonly gracefulShutdown: (signal: NodeJS.Signals) => Promise<void>;
  private readonly cleanup?: () => void | Promise<void>;
  private readonly exit: (code: number) => never | void;
  private installed = false;
  private shuttingDown = false;
  private cleanupStarted = false;
  private readonly boundSignals = new Map<NodeJS.Signals, () => void>();

  constructor(options: ShutdownControllerOptions) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.gracefulShutdown = options.gracefulShutdown;
    this.cleanup = options.cleanup;
    this.exit = options.exit ?? ((code: number) => process.exit(code));
  }

  install(signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']): void {
    if (this.installed) {
      return;
    }

    for (const signal of signals) {
      const handler = () => {
        void this.handleSignal(signal);
      };
      this.boundSignals.set(signal, handler);
      process.on(signal, handler);
    }

    this.installed = true;
  }

  dispose(): void {
    for (const [signal, handler] of this.boundSignals.entries()) {
      process.off(signal, handler);
    }
    this.boundSignals.clear();
    this.installed = false;
  }

  async handleSignal(signal: NodeJS.Signals): Promise<void> {
    if (this.shuttingDown) {
      await this.runCleanup();
      this.exit(1);
      return;
    }

    this.shuttingDown = true;

    try {
      await Promise.race([
        this.gracefulShutdown(signal),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Graceful shutdown timed out after ${this.timeoutMs}ms`)), this.timeoutMs);
        }),
      ]);

      await this.runCleanup();
      this.exit(0);
    } catch {
      await this.runCleanup();
      this.exit(1);
    }
  }

  private async runCleanup(): Promise<void> {
    if (this.cleanupStarted) {
      return;
    }

    this.cleanupStarted = true;
    await this.cleanup?.();
  }
}

export function createShutdownController(options: ShutdownControllerOptions): ShutdownController {
  return new ShutdownController(options);
}
