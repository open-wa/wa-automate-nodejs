// apps/docs/scripts/copy-openapi.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(__dirname, '../../../packages/schema/src/generated/openapi.json');
const destDir = path.resolve(__dirname, '../public');
const dest = path.join(destDir, 'openapi.json');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(source, dest);
console.log(`Copied openapi.json to ${dest}`);