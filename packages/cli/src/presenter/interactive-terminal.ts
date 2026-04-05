import QRCode from 'qrcode';
import type { EventProjectionStore, ProjectionSnapshot } from '../state/event-projection-store';

export interface InteractiveTerminalPresenterOptions {
  store: EventProjectionStore;
  stdout?: NodeJS.WriteStream;
  stderr?: NodeJS.WriteStream;
}

type InkInstance = {
  clear?: () => void;
  rerender?: (tree: unknown) => void;
  unmount: () => void;
};

export class InteractiveTerminalPresenter {
  private readonly store: EventProjectionStore;
  private readonly stdout: NodeJS.WriteStream;
  private readonly stderr: NodeJS.WriteStream;
  private ink?: InkInstance;
  private unsubscribe?: () => void;
  private started = false;
  private stopped = false;
  private snapshot: ProjectionSnapshot;
  private qrAscii?: string;
  private qrValue?: string;
  private renderTree?: () => unknown;
  private qrSequence = 0;

  constructor(options: InteractiveTerminalPresenterOptions) {
    this.store = options.store;
    this.stdout = options.stdout ?? process.stdout;
    this.stderr = options.stderr ?? process.stderr;
    this.snapshot = this.store.getSnapshot();
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;

    const React = await import('react');
    const ink = await import('ink');

    await this.updateQrAscii(this.snapshot);

    const LogStream = ({ snapshot }: { snapshot: ProjectionSnapshot }) => {
      if (snapshot.recentLogs.length === 0) {
        return null;
      }

      return React.createElement(
        ink.Box,
        { flexDirection: 'column', marginTop: 1 },
        React.createElement(ink.Text, { color: 'cyan' }, 'Recent Logs'),
        ...snapshot.recentLogs.slice(-12).map((entry, index) =>
          React.createElement(
            ink.Text,
            {
              key: `${entry.timestamp}-${index}`,
              color: entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : 'white',
            },
            `[${entry.level}] ${entry.message}`
          )
        )
      );
    };

    const QrBlock = ({ snapshot, qrAscii }: { snapshot: ProjectionSnapshot; qrAscii?: string }) => {
      if (!snapshot.qr) {
        return null;
      }

      if (!qrAscii) {
        return React.createElement(ink.Text, { color: 'yellow' }, 'Generating QR view...');
      }

      const qrLines = qrAscii.split('\n');

      return React.createElement(
        ink.Box,
        { flexDirection: 'column', marginTop: 1 },
        React.createElement(ink.Text, { color: 'green' }, 'QR Code'),
        ...qrLines.map((line, index) => React.createElement(ink.Text, { key: `qr-${index}` }, line))
      );
    };

    const App = ({ snapshot, qrAscii }: { snapshot: ProjectionSnapshot; qrAscii?: string }) =>
      React.createElement(
        ink.Box,
        { flexDirection: 'column', paddingX: 1 },
        React.createElement(ink.Text, { color: 'greenBright' }, '[VT-OS] OPEN-WA CLI'),
        React.createElement(ink.Text, null, 'Mode: ink-interactive'),
        React.createElement(ink.Text, null, `Phase: ${snapshot.phase}`),
        React.createElement(ink.Text, null, `Session: ${snapshot.sessionId ?? 'pending'}`),
        React.createElement(ink.Text, null, `Ready: ${snapshot.ready ? 'yes' : 'no'}`),
        React.createElement(ink.Text, null, `Messages: ${snapshot.messageCount} | Ack updates: ${snapshot.ackCount}`),
        snapshot.detail
          ? React.createElement(ink.Text, { color: snapshot.phase === 'error' ? 'red' : 'yellow' }, `Detail: ${snapshot.detail}`)
          : null,
        React.createElement(QrBlock, { snapshot, qrAscii }),
        React.createElement(LogStream, { snapshot })
      );

    this.renderTree = () => React.createElement(App, { snapshot: this.snapshot, qrAscii: this.qrAscii });

    this.ink = ink.render(this.renderTree(), {
      stdout: this.stdout,
      stderr: this.stderr,
      patchConsole: false,
      exitOnCtrlC: false,
    }) as InkInstance;

    this.unsubscribe = this.store.subscribe((snapshot) => {
      void this.handleSnapshot(snapshot);
    });
  }

  stop(options: { clear?: boolean } = {}): void {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    const clear = options.clear ?? true;
    this.unsubscribe?.();
    this.unsubscribe = undefined;

    if (clear) {
      this.ink?.clear?.();
    }

    this.ink?.unmount();
    this.ink = undefined;
  }

  private async handleSnapshot(snapshot: ProjectionSnapshot): Promise<void> {
    if (this.stopped) {
      return;
    }

    this.snapshot = snapshot;
    await this.updateQrAscii(snapshot);
    this.rerender();
  }

  private rerender(): void {
    if (this.stopped || !this.renderTree) {
      return;
    }

    this.ink?.rerender?.(this.renderTree());
  }

  private async updateQrAscii(snapshot: ProjectionSnapshot): Promise<void> {
    if (!snapshot.qr?.qr) {
      this.qrValue = undefined;
      this.qrAscii = undefined;
      return;
    }

    if (snapshot.qr.qr === this.qrValue && this.qrAscii) {
      return;
    }

    this.qrValue = snapshot.qr.qr;
    const sequence = ++this.qrSequence;
    const qrAscii = await QRCode.toString(snapshot.qr.qr, { type: 'terminal', small: true });

    if (this.stopped || sequence !== this.qrSequence) {
      return;
    }

    this.qrAscii = qrAscii;
  }
}
