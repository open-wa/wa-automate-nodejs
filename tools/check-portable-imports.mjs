import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const portableRoots = [
  'packages/runtime-core/src',
  'packages/runtime-browser/src',
  'packages/runtime-edge/src',
];
const forbidden = [
  [/from\s+['"]node:/, 'Node built-in import'],
  [/import\s*\(\s*['"]node:/, 'dynamic Node built-in import'],
  [/\b(?:process|Buffer)\s*(?:\.|\[|\()|\b(?:__dirname|__filename)\b/, 'Node global'],
  [/\brequire\s*\(/, 'CommonJS require'],
  [/\b(?:Bun|Deno)\s*(?:\.|\[|\()/, 'runtime-specific global'],
];

const sourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (['.ts', '.tsx', '.js', '.mjs'].includes(extname(path)) && !path.includes('.test.')) files.push(path);
  }
  return files;
};

const v5RuntimeFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const relativePath = relative(root, path);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name.startsWith('dist') ||
        relativePath.startsWith('packages/legacy-documented')
      ) continue;
      files.push(...await v5RuntimeFiles(path));
    } else if (
      ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'].includes(extname(path)) &&
      !entry.name.endsWith('lock.json')
    ) {
      files.push(path);
    }
  }
  return files;
};

const violations = [];
for (const portableRoot of portableRoots) {
  for (const file of await sourceFiles(join(root, portableRoot))) {
    const source = await readFile(file, 'utf8');
    source.split('\n').forEach((line, index) => {
      for (const [pattern, label] of forbidden) {
        if (pattern.test(line)) {
          violations.push(`${relative(root, file)}:${index + 1}: ${label}: ${line.trim()}`);
        }
      }
    });
  }
}

for (const runtimeRoot of ['packages', 'integrations']) {
  for (const file of await v5RuntimeFiles(join(root, runtimeRoot))) {
    const source = await readFile(file, 'utf8');
    source.split('\n').forEach((line, index) => {
      if (/\bPQueue\b|['"]p-queue['"]/.test(line)) {
        violations.push(`${relative(root, file)}:${index + 1}: v5 PQueue dependency: ${line.trim()}`);
      }
    });
  }
}

if (violations.length > 0) {
  console.error('Portable runtime boundary violations:\n' + violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Portable runtime imports are clean and v5 has no PQueue dependency.');
}
