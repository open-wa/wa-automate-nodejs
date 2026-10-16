#!/usr/bin/env node
/** Generate grouped release notes directly from commit messages. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { command, api, repo, source, version as parseVersion } from './shared.mjs';

const args = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const manifest = JSON.parse(readFileSync(join(source, 'packages/core/package.json'), 'utf8'));
const version = parseVersion(option('--version') || manifest.version);
const output = resolve(option('--output') || join(source, 'RELEASE_BODY.md'));
const git = (...argv) => command('git', argv, { cwd: source });
const previous = option('--compare') || git('tag', '--merged', 'HEAD', '--sort=-version:refname', '--list', 'v*')
  .split('\n').find(tag => /^v\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(tag) && tag !== `v${version}`);
const range = previous ? [`${previous}..HEAD`] : ['HEAD'];
const log = git('log', ...range, '--no-merges', '--format=%H%x1f%aI%x1f%B%x1e');
const headings = {
  feat: 'Features', fix: 'Fixes', perf: 'Performance', refactor: 'Changes', style: 'Changes',
  revert: 'Changes', docs: 'Documentation', test: 'Tests', chore: 'Maintenance',
  build: 'Maintenance', ci: 'Maintenance',
};
const concerns = {
  api: 'API', dashboard: 'Dashboard', logger: 'Logging', session: 'Sessions',
  events: 'Events', release: 'Releases', core: 'Core', docs: 'Documentation',
  deps: 'Dependencies', plan: 'Planning', concepts: 'Concepts',
};
const defaultEmoji = { feat: '✨', fix: '🐛', perf: '⚡️', refactor: '♻️', style: '💄', revert: '⏪️', docs: '📝', test: '✅', chore: '🔧', build: '🔨', ci: '👷' };
const issueCache = new Map();
function issues(body) {
  const references = new Map();
  for (const match of body.matchAll(/(?:^|[\s(])#(\d+)\b/g)) references.set(`${repo}#${match[1]}`, [repo, match[1]]);
  for (const match of body.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)\b/g)) {
    references.set(`${match[1]}#${match[2]}`, [match[1], match[2]]);
  }
  return [...references].flatMap(([key, [repository, number]]) => {
    if (!issueCache.has(key)) {
      const item = api(`repos/${repository}/issues/${number}`);
      // GitHub shares the issue-number namespace with PRs. Only show issues.
      issueCache.set(key, item.pull_request ? null : {
        label: repository === repo ? `#${number}` : `${repository}#${number}`, url: item.html_url,
      });
    }
    return issueCache.get(key) ? [issueCache.get(key)] : [];
  });
}

const entries = new Map();
for (const record of log.split('\x1e')) {
  if (!record.trim()) continue;
  const [sha, date, body] = record.trim().split('\x1f');
  const subject = body.split('\n')[0];
  const match = subject.match(/^([^\p{L}\p{N}]*)(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/u);
  const [, prefix, type, scope, breaking, rawDescription] = match || ['', '', 'other', undefined, '', subject];
  const description = rawDescription.replace(/\s*\(#\d+\)/g, '').trim() || rawDescription.trim();
  if (type === 'chore' && scope === 'release' && /^(version packages|sync .* (?:back )?to master|publish OpenWA|promote )/i.test(description)) continue;
  const breakingNote = body.match(/(?:^|\n)BREAKING[ -]CHANGE:\s*([^\n]+(?:\n(?!\s*$)[^\n]+)*)/)?.[1];
  const heading = breaking || breakingNote ? 'Breaking changes' : headings[type] || 'Other changes';
  const concern = concerns[scope] || (scope ? scope.replace(/[-_]/g, ' ') : 'General');
  const key = `${heading}:${description.toLowerCase().replace(/[.!]+$/, '').replace(/\s+/g, ' ')}`;
  const related = issues(body);
  const existing = entries.get(key);
  if (existing) {
    existing.scopes.add(concern);
    existing.commits.add(sha);
    for (const issue of related) existing.issues.set(issue.url, issue);
    existing.time = Math.max(existing.time, Date.parse(date));
    if (breakingNote) existing.breakingNotes.add(breakingNote);
  } else {
    entries.set(key, {
      heading, description: description[0].toUpperCase() + description.slice(1),
      emoji: prefix.trim() || defaultEmoji[type] || '🔧', scopes: new Set([concern]),
      commits: new Set([sha]), issues: new Map(related.map(issue => [issue.url, issue])),
      time: Date.parse(date), breakingNotes: new Set(breakingNote ? [breakingNote] : []),
    });
  }
}
const lines = [`# OpenWA ${version}`, ''];
for (const heading of ['Breaking changes', 'Features', 'Fixes', 'Performance', 'Changes', 'Documentation', 'Tests', 'Maintenance', 'Other changes']) {
  const groups = new Map();
  for (const entry of entries.values()) {
    if (entry.heading !== heading) continue;
    const concern = [...entry.scopes].sort().join(' / ');
    if (!groups.has(concern)) groups.set(concern, []);
    groups.get(concern).push(entry);
  }
  if (!groups.size) continue;
  lines.push(`## ${heading}`, '');
  const ordered = [...groups].sort((a, b) => Math.max(...b[1].map(item => item.time)) - Math.max(...a[1].map(item => item.time)));
  for (const [concern, group] of ordered) {
    group.sort((a, b) => b.time - a.time);
    for (const entry of group) {
      const links = [
        ...[...entry.commits].map(sha => `[${sha.slice(0, 7)}](https://github.com/${repo}/commit/${sha})`),
        ...[...entry.issues.values()].map(issue => `[${issue.label}](${issue.url})`),
      ];
      lines.push(`- ${entry.emoji} **${concern}:** ${entry.description.replace(/[.!]+$/, '')}. (${links.join(' · ')})`);
      for (const note of entry.breakingNotes) lines.push(`\n  **Breaking change:** ${note.replace(/\n/g, '\n  ')}`);
    }
  }
  lines.push('');
}
if (!entries.size) lines.push('No user-facing commit entries in this release.', '');
if (previous) lines.push(`[Full diff](https://github.com/${repo}/compare/${previous}...v${version})`, '');
const notes = lines.join('\n');
writeFileSync(output, notes);
writeFileSync(join(source, 'release-notes-detailed.md'), notes);
console.log(`Wrote OpenWA ${version} release notes from ${entries.size} distinct commit messages.`);
