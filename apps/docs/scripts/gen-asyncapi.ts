import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAsyncAPI } from '@fumadocs/asyncapi/server';
import { generateFiles, type AsyncAPI } from '@fumadocs/asyncapi';
import { createAsyncApiDocument } from '../../../packages/schema/src/events/asyncapi';

const app = new URL('../', import.meta.url);
const version = JSON.parse(readFileSync(new URL('../../../packages/schema/package.json', import.meta.url), 'utf8')).version;
const document = createAsyncApiDocument({ version });
const json = `${JSON.stringify(document, null, 2)}\n`;
const schemaDir = new URL('src/generated/', app);
mkdirSync(schemaDir, { recursive: true });
mkdirSync(new URL('public/', app), { recursive: true });
writeFileSync(new URL('asyncapi.json', schemaDir), json);
writeFileSync(new URL('public/asyncapi.json', app), json);
const output = fileURLToPath(new URL('content/docs/reference/event-contracts/generated/', app));
// This directory is generator-owned; removing it prevents stale event pages.
rmSync(output, { recursive: true, force: true });
await generateFiles({
  input: createAsyncAPI({ input: { openwa: document as AsyncAPI.AsyncAPIObject } }),
  output, per: 'operation', groupBy: 'none', includeDescription: false,
});
writeFileSync(`${output}/meta.json`, `${JSON.stringify({ title: 'Payload reference', pages: Object.keys(document.operations) }, null, 2)}\n`);
console.log('Generated AsyncAPI reference pages and schema download');
