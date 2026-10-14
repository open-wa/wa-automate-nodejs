import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createAsyncApiDocument } from '../src/events/asyncapi';

const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const target = new URL('../src/generated/asyncapi.json', import.meta.url);
mkdirSync(new URL('../src/generated/', import.meta.url), { recursive: true });
writeFileSync(target, `${JSON.stringify(createAsyncApiDocument({ version }), null, 2)}\n`);
