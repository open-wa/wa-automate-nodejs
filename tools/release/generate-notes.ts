#!/usr/bin/env node
/** Build concise release notes from the same deduplicated changes as the images. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { collectChanges, groupChanges, previousReleaseTag } = require('./image-content.cjs');
const editorial = require('./image-highlights.json');
const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '../..');
const repo = 'https://github.com/open-wa/wa-automate-nodejs';

type Change = { markdown: string; severity: string; packages: string[] };

function options() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const version = get('--version') || JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version;
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) throw new Error('Invalid release version');
  return { version, output: resolve(get('--output') || join(root, 'RELEASE_BODY.md')), compare: get('--compare') };
}

function bullet(change: Change): string {
  const text = change.markdown.trim();
  const emoji = change.severity === 'major' ? '💥' : change.severity === 'minor' ? '✨' : '🐛';
  // Preserve migration notes and limitations; never cut an entry mid-sentence.
  const content = /^\p{Extended_Pictographic}/u.test(text) ? text : `${emoji} ${text}`;
  return `- ${content.replace(/\n/g, '\n  ')}`;
}

function commitFallback(previous: string | undefined): Change[] {
  if (!previous) return [];
  const log = execFileSync('git', ['log', `${previous}..HEAD`, '--format=%s', '--no-merges'], { cwd: root, encoding: 'utf8' });
  const seen = new Set<string>();
  return log.split('\n').flatMap(subject => {
    const match = subject.replace(/^[^\p{L}\d]+/u, '').match(/^(feat|fix|perf)(?:\([^)]+\))?(!)?:\s*(.+)$/);
    if (!match || seen.has(match[3])) return [];
    seen.add(match[3]);
    return [{ markdown: `${match[1] === 'perf' ? '⚡️ ' : ''}${match[3]}`, severity: match[2] ? 'major' : match[1] === 'feat' ? 'minor' : 'patch', packages: [] }];
  });
}

function main() {
  const { version, output, compare } = options();
  const legacyEditorial: Record<string, string> = { '5.0.0': 'v5-release-notes.md', '5.1.0': 'v5.1-release-notes.md' };
  const curatedFile = editorial[version]?.notesFile || legacyEditorial[version];
  let notes: string;
  if (curatedFile) {
    notes = readFileSync(join(directory, curatedFile), 'utf8');
  } else {
    const previous = compare || previousReleaseTag(version);
    const changes = collectChanges(version);
    const { ranked, maintenance }: { ranked: Change[]; maintenance: string[] } = groupChanges(version, changes);
    const highlights = changes.length ? ranked : commitFallback(previous);
    const config = editorial[version] || {};
    const lines = [`# ✨ OpenWA ${version}${config.headline ? ` — ${config.headline}` : ''}`, ''];
    if (config.summary) lines.push(config.summary, '');
    if (highlights.length) {
      lines.push("## ✨ What's new", '', ...highlights.slice(0, 6).map(bullet), '');
      if (highlights.length > 6) {
        lines.push('<details>', `<summary>${highlights.length - 6} more changes</summary>`, '', ...highlights.slice(6).map(bullet), '', '</details>', '');
      }
    }
    // Coordinated bumps are bookkeeping, not headline features.
    if (maintenance.length) lines.push('## 🔖 Version alignment', '', `${maintenance.length} companion packages receive version or dependency updates. No separate feature changes.`, '');
    lines.push(`[Full diff](${previous ? `${repo}/compare/${previous}...v${version}` : `${repo}/releases/tag/v${version}`})`, '');
    notes = lines.join('\n');
  }
  writeFileSync(output, notes, 'utf8');
  // Both consumers receive the same editorial copy, never a duplicated commit dump.
  writeFileSync(join(root, 'release-notes-detailed.md'), notes, 'utf8');
  console.log(`Wrote concise OpenWA ${version} release notes.`);
}

try { main(); } catch (error) { console.error('Release notes generation failed:', error); process.exitCode = 1; }
