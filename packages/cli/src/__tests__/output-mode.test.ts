import { describe, expect, it } from 'vitest';
import { detectOutputMode } from '../runtime/output-mode';

describe('detectOutputMode', () => {
  it('selects interactive mode when stdio is fully tty-capable', () => {
    const result = detectOutputMode({
      env: {},
      stdin: { isTTY: true },
      stdout: { isTTY: true },
      stderr: { isTTY: true },
    });

    expect(result).toEqual({
      kind: 'interactive',
      interactive: true,
      reason: 'tty-ready',
    });
  });

  it('refuses interactive mode when stdout is not a tty', () => {
    const result = detectOutputMode({
      env: {},
      stdin: { isTTY: true },
      stdout: { isTTY: false },
      stderr: { isTTY: true },
    });

    expect(result.reason).toBe('stdout-not-tty');
    expect(result.interactive).toBe(false);
  });

  it('refuses interactive mode when TERM is dumb', () => {
    const result = detectOutputMode({
      env: { TERM: 'dumb' },
      stdin: { isTTY: true },
      stdout: { isTTY: true },
      stderr: { isTTY: true },
    });

    expect(result.reason).toBe('term-dumb');
    expect(result.kind).toBe('plain');
  });

  it('honors explicit non-interactive overrides', () => {
    const result = detectOutputMode({
      env: { OPEN_WA_NON_INTERACTIVE: '1' },
      stdin: { isTTY: true },
      stdout: { isTTY: true },
      stderr: { isTTY: true },
    });

    expect(result.reason).toBe('env.non-interactive');
    expect(result.kind).toBe('plain');
  });

  it('honors explicit interactive flag when tty checks pass', () => {
    const result = detectOutputMode({
      flags: { outputMode: 'interactive' },
      env: {},
      stdin: { isTTY: true },
      stdout: { isTTY: true },
      stderr: { isTTY: true },
    });

    expect(result.reason).toBe('flag.interactive');
    expect(result.kind).toBe('interactive');
  });
});
