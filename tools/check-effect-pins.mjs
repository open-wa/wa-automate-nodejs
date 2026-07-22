import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url).pathname;
const expected = '4.0.0-beta.100';
const family = [
  'effect',
  '@effect/platform-node',
  '@effect/platform-bun',
  '@effect/platform-browser',
];
const workspace = await readFile(`${root}/pnpm-workspace.yaml`, 'utf8');
const lockfile = await readFile(`${root}/pnpm-lock.yaml`, 'utf8');
const failures = [];

for (const dependency of family) {
  const escaped = dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const catalogPin = new RegExp(`['"]?${escaped}['"]?:\\s*${expected.replaceAll('.', '\\.')}(?:\\s|$)`);
  if (!catalogPin.test(workspace)) {
    failures.push(`${dependency} is not pinned to ${expected} in the workspace catalog`);
  }

  const versionPattern = new RegExp(`${escaped.replace('/', '\\/')}@4\\.0\\.0-beta\\.(\\d+)`, 'g');
  const versions = new Set([...lockfile.matchAll(versionPattern)].map((match) => match[1]));
  if (versions.size !== 1 || !versions.has('100')) {
    failures.push(`${dependency} resolves to beta versions: ${[...versions].join(', ') || 'none'}`);
  }
}

if (failures.length > 0) {
  console.error('Effect version contract failed:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Effect package family is pinned to ${expected}.`);
}
