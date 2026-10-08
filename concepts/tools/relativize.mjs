// Copy concepts/_site to concepts/_artifact with absolute /<slug>/ URLs made relative,
// so the set works when served from an unknown sub-path.
import { cpSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '_site');
const out = join(root, '_artifact');
if (!existsSync(join(site, 'index.html'))) {
  console.error('Run build-all.sh first: _site/index.html is missing.');
  process.exit(1);
}
rmSync(out, { recursive: true, force: true });
cpSync(site, out, { recursive: true });

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

const textTypes = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.webmanifest', '.xml', '.txt']);
let rewritten = 0;

for (const slug of readdirSync(out)) {
  const slugRoot = join(out, slug);
  if (!statSync(slugRoot).isDirectory() || slug.startsWith('_') || slug === 'gallery-assets') continue;
  const needle = `/${slug}/`;
  for (const file of walk(slugRoot)) {
    const ext = extname(file);
    if (!textTypes.has(ext)) continue;
    const src = readFileSync(file, 'utf8');
    if (!src.includes(needle)) continue;
    // CSS resolves url() against the stylesheet; everything else against the document,
    // and each concept is a single page at <slug>/index.html.
    const prefix = ext === '.css' || ext === '.svg'
      ? (relative(dirname(file), slugRoot) || '.') + '/'
      : './';
    const next = src.replace(new RegExp(`(^|[\\s"'\`(=,])${needle.replace(/[/]/g, '\\/')}`, 'g'), (_, lead) => lead + prefix);
    if (next !== src) { writeFileSync(file, next); rewritten++; }
  }
}

// The artifact host wraps its entry page in its own document skeleton.
const indexPath = join(out, 'index.html');
const entry = readFileSync(indexPath, 'utf8')
  .replace(/<!doctype html>/i, '')
  .replace(/<\/?html[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<\/?body[^>]*>/gi, '')
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
writeFileSync(indexPath, entry.trim() + '\n');

console.log(`relativized ${rewritten} files into ${relative(process.cwd(), out) || out}`);
