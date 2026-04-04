import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const sourceDir = resolve(packageRoot, 'src/transport/assets');
const targetDir = resolve(packageRoot, 'dist/transport/assets');

await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true });
