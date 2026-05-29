import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..');
const contentRoot = path.join(docsRoot, 'content/docs');
const mascotDir = path.join(docsRoot, 'public/mascots');
const pngSignature = '89504e470d0a1a0a';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isDivider(item) {
  return /^---.*---$/.test(item);
}

function sourceFileForMetaItem(dirPath, item) {
  if (typeof item !== 'string' || isDivider(item)) return null;

  const link = item.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) {
    const href = link[2];
    if (!href.startsWith('/docs/')) return null;
    const filePath = path.join(contentRoot, href.replace(/^\/docs\//, '') + '.mdx');
    return fs.existsSync(filePath) ? filePath : null;
  }

  const candidate = path.join(dirPath, item);
  const directPage = candidate + '.mdx';
  const indexPage = path.join(candidate, 'index.mdx');

  if (fs.existsSync(directPage)) return directPage;
  if (fs.existsSync(indexPage)) return indexPage;
  return null;
}

function routeForFile(filePath) {
  let relativePath = path
    .relative(contentRoot, filePath)
    .replace(/\.mdx$/, '')
    .split(path.sep)
    .join('/');

  if (relativePath === 'index') return '/docs';
  if (relativePath.endsWith('/index')) relativePath = relativePath.slice(0, -6);
  return '/docs/' + relativePath;
}

function collectRoutesFromMeta(dirPath, seen, routes) {
  const metaPath = path.join(dirPath, 'meta.json');
  if (!fs.existsSync(metaPath)) return;

  const pages = readJson(metaPath).pages ?? [];
  for (const item of pages) {
    const sourceFile = sourceFileForMetaItem(dirPath, item);
    if (sourceFile) {
      const route = routeForFile(sourceFile);
      if (!seen.has(route)) {
        seen.add(route);
        routes.push(route);
      }
    }

    if (typeof item === 'string' && !item.startsWith('[') && !isDivider(item)) {
      const childDir = path.join(dirPath, item);
      if (fs.existsSync(path.join(childDir, 'meta.json'))) {
        collectRoutesFromMeta(childDir, seen, routes);
      }
    }
  }
}

function collectAllMetaRoutes() {
  const seen = new Set();
  const routes = [];
  collectRoutesFromMeta(contentRoot, seen, routes);

  const pending = [contentRoot];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(child);
        continue;
      }
      if (entry.name !== 'meta.json') continue;

      const pages = readJson(child).pages ?? [];
      for (const item of pages) {
        const sourceFile = sourceFileForMetaItem(current, item);
        if (!sourceFile) continue;

        const route = routeForFile(sourceFile);
        if (!seen.has(route)) {
          seen.add(route);
          routes.push(route);
        }
      }
    }
  }

  return routes;
}

function parseMascotMap() {
  const source = fs.readFileSync(path.join(docsRoot, 'src/components/mascot-callout.tsx'), 'utf8');
  const entries = new Map();
  const pattern = /'([^']+)':\s*\{\s*\n\s*src:\s*'\/mascots\/([^']+)'/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    entries.set(match[1], match[2]);
  }

  return entries;
}

function assertPng(filename, failures) {
  const filePath = path.join(mascotDir, filename);
  if (!fs.existsSync(filePath)) {
    failures.push('Missing mascot file: ' + filename);
    return;
  }

  const file = fs.readFileSync(filePath);
  if (file.subarray(0, 8).toString('hex') !== pngSignature) {
    failures.push('Not a PNG: ' + filename);
    return;
  }

  const width = file.readUInt32BE(16);
  const height = file.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    failures.push('Expected 1024x1024 PNG for ' + filename + ', got ' + width + 'x' + height);
  }
}

const homepage = fs.readFileSync(path.join(docsRoot, 'src/components/homepage.tsx'), 'utf8');
const route = fs.readFileSync(path.join(docsRoot, 'src/routes/docs/$.tsx'), 'utf8');
const docsPageHeader = fs.readFileSync(path.join(docsRoot, 'src/components/docs-page-header.tsx'), 'utf8');
const callout = fs.readFileSync(path.join(docsRoot, 'src/components/mascot-callout.tsx'), 'utf8');
const failures = [];

const mascotMap = parseMascotMap();
const requiredRoutes = collectAllMetaRoutes();

assertPng('wally-homepage-session-console.png', failures);

if (!homepage.includes('/mascots/wally-homepage-session-console.png')) {
  failures.push('Homepage hero does not reference /mascots/wally-homepage-session-console.png');
}

if (homepage.includes('src="/wally-typing.png"')) {
  failures.push('Homepage hero still references /wally-typing.png');
}

const requiredHomepageCopy = [
  'What are you trying to run?',
  'I need an API today',
  'I already have',
  'Best for',
  'Avoid if',
  'Wrong path symptom',
  'Blocked?',
  'After your first success',
  '1. Configure runtime and API key',
  'Confirm license-gated features',
];

for (const copy of requiredHomepageCopy) {
  if (!homepage.includes(copy)) {
    failures.push('Homepage routing copy missing: ' + copy);
  }
}

for (const routePath of requiredRoutes) {
  const filename = mascotMap.get(routePath);
  if (!filename) {
    failures.push('Mascot callout missing route mapping: ' + routePath);
    continue;
  }

  assertPng(filename, failures);
}

if (!route.includes('<DocsPageHeader')) {
  failures.push('Docs content route does not render the consolidated docs page header');
}

if (!docsPageHeader.includes('getMascotForPath')) {
  failures.push('DocsPageHeader does not resolve mapped page mascots');
}

if (!callout.includes('normalizeMascotPath')) {
  failures.push('Mascot path resolver does not normalize folder index routes');
}

if (!docsPageHeader.includes('https://github.com/open-wa/v5-shh/blob/main/apps/docs/content/docs/')) {
  failures.push('DocsPageHeader does not preserve the GitHub source URL base');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  'Validated homepage mascot plus ' +
    requiredRoutes.length +
    ' docs route mascots from meta.json coverage.',
);
