import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOutputBroker } from '../runtime/output-broker';

describe('OutputBroker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('intercepts console output and keeps a bounded buffer', () => {
    const broker = createOutputBroker({ interactive: true, maxEntries: 2, passthrough: false });
    broker.install();
    const interceptedLog = console.log;

    console.log('alpha');
    console.warn('beta');
    console.error('gamma');

    const entries = broker.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.message)).toEqual(['beta', 'gamma']);

    broker.dispose();
    expect(console.log).not.toBe(interceptedLog);
  });

  it('passes through to the original console in plain mode', () => {
    const forwarded: string[] = [];
    const originalLog = console.log;
    console.log = ((...args: unknown[]) => {
      forwarded.push(args.join(' '));
    }) as typeof console.log;

    const broker = createOutputBroker({ interactive: false, maxEntries: 5, passthrough: true });
    broker.install();

    console.log('plain-text');

    broker.dispose();
    console.log = originalLog;

    expect(forwarded).toEqual(['plain-text']);
    expect(broker.getEntries()).toHaveLength(1);
  });

  it('restores stdout writes after cleanup', () => {
    const broker = createOutputBroker({ interactive: true, passthrough: false });
    broker.install();
    const interceptedWrite = process.stdout.write;
    broker.dispose();

    expect(process.stdout.write).not.toBe(interceptedWrite);
  });

  it('can leave stdout and stderr untouched for Ink rendering compatibility', () => {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    const broker = createOutputBroker({ interactive: true, passthrough: false, interceptStreams: false });

    broker.install();

    expect(process.stdout.write).toBe(originalStdoutWrite);
    expect(process.stderr.write).toBe(originalStderrWrite);

    broker.dispose();
  });
});
