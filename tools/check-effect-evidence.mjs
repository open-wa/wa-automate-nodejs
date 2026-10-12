import { readFile } from 'node:fs/promises';

const report = JSON.parse(await readFile(
  new URL('../architecture/benchmarks/effect-replacements.json', import.meta.url),
  'utf8',
));
const workspace = await readFile(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8');
const expectedVersion = workspace.match(/^  effect:\s*(\S+)$/m)?.[1];
if (!expectedVersion || report.effect !== expectedVersion) {
  throw new Error(`Effect replacement evidence is stale: ${report.effect}`);
}
for (const path of [
  ['performance', 'schemaDecode', 'effect', 'operationsPerSecond'],
  ['performance', 'eventFanout', 'effectPubSub', 'operationsPerSecond'],
  ['bundles', 'schema', 'effectBytes'],
  ['bundles', 'events', 'effectBytes'],
  ['bundles', 'declaration', 'effectHttpRpcBytes'],
]) {
  const value = path.reduce((current, key) => current?.[key], report);
  if (!(typeof value === 'number' && value > 0)) {
    throw new Error(`Missing Effect evidence: ${path.join('.')}`);
  }
}
console.log('Effect replacement evidence is current and complete.');
