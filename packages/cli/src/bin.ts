#!/usr/bin/env node
import { runCli } from '@open-wa/wa-automate';

runCli(process.argv.slice(2)).catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
