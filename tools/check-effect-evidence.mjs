import { readFile } from 'node:fs/promises';

const report = JSON.parse(await readFile(
  new URL('../architecture/benchmarks/effect-replacements.json', import.meta.url),
  'utf8',
));
if (report.effect !== '4.0.0-beta.100') {
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
