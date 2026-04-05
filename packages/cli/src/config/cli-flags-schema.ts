import { z } from 'zod';

const OutputModeOverrideSchema = z.enum(['interactive', 'plain']);

export const CliLocalFlagsSchema = z.object({
  outputMode: OutputModeOverrideSchema.optional(),
});

export type CliLocalFlags = z.infer<typeof CliLocalFlagsSchema>;

export interface ParsedCliLocalFlags {
  flags: CliLocalFlags;
  forwardedArgs: string[];
}

export function parseCliLocalFlags(argv: string[]): ParsedCliLocalFlags {
  const forwardedArgs: string[] = [];
  let outputMode: CliLocalFlags['outputMode'];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--interactive') {
      outputMode = 'interactive';
      continue;
    }

    if (arg === '--non-interactive') {
      outputMode = 'plain';
      continue;
    }

    if (arg === '--output-mode') {
      const value = argv[index + 1];
      outputMode = OutputModeOverrideSchema.parse(value);
      index += 1;
      continue;
    }

    const match = arg.match(/^--output-mode=(interactive|plain)$/);
    if (match) {
      outputMode = OutputModeOverrideSchema.parse(match[1]);
      continue;
    }

    forwardedArgs.push(arg);
  }

  return {
    flags: CliLocalFlagsSchema.parse({ outputMode }),
    forwardedArgs,
  };
}
