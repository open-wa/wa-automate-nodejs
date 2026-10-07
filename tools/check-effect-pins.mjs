import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url).pathname;
const expected = '4.0.2';
const family = [
  'effect',
  '@effect/platform-node',
  '@effect/platform-node-shared',
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

  const versionPattern = new RegExp(`(?<![\\w/-])${escaped}@([0-9]+\\.[0-9]+\\.[0-9]+(?:-[a-zA-Z0-9.-]+)?)`, 'g');
  const versions = new Set([...lockfile.matchAll(versionPattern)].map((match) => match[1]));
  if (versions.size !== 1 || !versions.has(expected)) {
    failures.push(`${dependency} resolves to versions: ${[...versions].join(', ') || 'none'}`);
  }
}

if (failures.length > 0) {
  console.error('Effect version contract failed:\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Effect package family is pinned to ${expected}.`);
}
