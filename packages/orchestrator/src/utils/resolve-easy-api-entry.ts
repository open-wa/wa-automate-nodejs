import fs from 'fs';
import path from 'path';

const CANDIDATE_PATHS = [
  './packages/wa-automate/dist/cli.cjs',
  './node_modules/@open-wa/wa-automate/dist/cli.cjs',
  '/usr/src/app/node_modules/@open-wa/wa-automate/dist/cli.cjs',
  './node_modules/@open-wa/wa-automate/bin/server.js',
  '/usr/src/app/node_modules/@open-wa/wa-automate/bin/server.js',
];

export function resolveEasyApiEntryPath() {
  if (process.env.EASY_API_PATH) {
    return process.env.EASY_API_PATH;
  }

  const resolved = CANDIDATE_PATHS.map((candidate) => path.resolve(process.cwd(), candidate)).find((candidate) =>
    fs.existsSync(candidate)
  );

  if (resolved) {
    return resolved;
  }

  return process.env.NODE_ENV === 'dev'
    ? './node_modules/@open-wa/wa-automate/dist/cli.cjs'
    : '/usr/src/app/node_modules/@open-wa/wa-automate/dist/cli.cjs';
}
