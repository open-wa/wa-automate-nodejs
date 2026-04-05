import type { CliLocalFlags } from '../config/cli-flags-schema';

export type OutputModeKind = 'interactive' | 'plain';

export interface OutputModeContract {
  kind: OutputModeKind;
  interactive: boolean;
  reason:
    | 'flag.interactive'
    | 'flag.plain'
    | 'stdin-not-tty'
    | 'stdout-not-tty'
    | 'stderr-not-tty'
    | 'term-dumb'
    | 'ci'
    | 'no-color'
    | 'env.non-interactive'
    | 'tty-ready';
}

export interface DetectOutputModeOptions {
  flags?: CliLocalFlags;
  env?: NodeJS.ProcessEnv;
  stdin?: Pick<NodeJS.ReadStream, 'isTTY'>;
  stdout?: Pick<NodeJS.WriteStream, 'isTTY'>;
  stderr?: Pick<NodeJS.WriteStream, 'isTTY'>;
}

export function detectOutputMode(options: DetectOutputModeOptions = {}): OutputModeContract {
  const env = options.env ?? process.env;
  const stdin = options.stdin ?? process.stdin;
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const forcedMode = options.flags?.outputMode;

  if (forcedMode === 'plain') {
    return { kind: 'plain', interactive: false, reason: 'flag.plain' };
  }

  if (!stdin.isTTY) {
    return { kind: 'plain', interactive: false, reason: 'stdin-not-tty' };
  }

  if (!stdout.isTTY) {
    return { kind: 'plain', interactive: false, reason: 'stdout-not-tty' };
  }

  if (!stderr.isTTY) {
    return { kind: 'plain', interactive: false, reason: 'stderr-not-tty' };
  }

  if (env.TERM === 'dumb') {
    return { kind: 'plain', interactive: false, reason: 'term-dumb' };
  }

  if (env.OPEN_WA_NON_INTERACTIVE === '1') {
    return { kind: 'plain', interactive: false, reason: 'env.non-interactive' };
  }

  if (env.CI) {
    return { kind: 'plain', interactive: false, reason: 'ci' };
  }

  if (env.NO_COLOR) {
    return { kind: 'plain', interactive: false, reason: 'no-color' };
  }

  if (forcedMode === 'interactive') {
    return { kind: 'interactive', interactive: true, reason: 'flag.interactive' };
  }

  return { kind: 'interactive', interactive: true, reason: 'tty-ready' };
}
