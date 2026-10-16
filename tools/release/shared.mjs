import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const repo = process.env.GITHUB_REPOSITORY || 'open-wa/wa-automate-nodejs';
export const source = resolve(process.env.RELEASE_SOURCE_DIR || '.');
export const runUrl = `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
export function command(binary, args, options = {}) {
  return execFileSync(binary, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options })?.trim() || '';
}
export function git(...args) { return command('git', args); }
export function api(path, body, method) {
  const args = ['api', path];
  if (body !== undefined) args.push('--method', method || 'POST', '--input', '-');
  else if (method) args.push('--method', method);
  const result = command('gh', args, body === undefined ? {} : { input: JSON.stringify(body) });
  return result ? JSON.parse(result) : null;
}
export function version(value = process.env.RELEASE_VERSION) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value || '')) throw new Error('A release version such as 5.6.3 is required');
  return value;
}
export function packages(root = source, includePrivate = false) {
  return ['packages', 'integrations', 'sdks', 'apps'].flatMap(workspace => {
    const path = join(root, workspace);
    if (!existsSync(path)) return [];
    return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
      const directory = `${workspace}/${entry.name}`;
      const manifest = join(root, directory, 'package.json');
      if (!entry.isDirectory() || !existsSync(manifest)) return [];
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      return pkg.private && !includePrivate ? [] : [{ name: pkg.name, version: pkg.version, directory }];
    });
  });
}
export function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${typeof value === 'string' ? value : JSON.stringify(value)}\n`);
}
export function summary(text) {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}
export function tagRelease(tag, required = true) {
  let found;
  try {
    // gh resolves draft releases as well as published releases.
    found = JSON.parse(command('gh', ['release', 'view', tag, '--repo', repo, '--json', 'databaseId'], { stdio: ['pipe', 'pipe', 'pipe'] }));
  } catch (error) {
    if (!required && /release not found|HTTP 404|Not Found/i.test(String(error.stderr))) return null;
    throw error;
  }
  return api(`repos/${repo}/releases/${found.databaseId}`);
}
export function release(v, required = true) { return tagRelease(`v${version(v)}`, required); }
export function asset(v, name) {
  const found = release(v).assets.find(item => item.name === name);
  if (!found) return null;
  return command('gh', ['api', `repos/${repo}/releases/assets/${found.id}`, '-H', 'Accept: application/octet-stream']);
}
export function upload(v, name, text) {
  const temp = mkdtempSync(join(tmpdir(), 'openwa-release-'));
  try {
    const path = join(temp, name);
    writeFileSync(path, text);
    command('gh', ['release', 'upload', `v${version(v)}`, path, '--clobber', '--repo', repo]);
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
export function state(v) {
  const content = asset(v, 'release-state.json');
  return content ? JSON.parse(content) : { version: version(v) };
}
function merge(left, right) {
  const result = { ...left };
  for (const [key, value] of Object.entries(right)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(left?.[key] || {}, value) : value;
  }
  return result;
}
export function checkpoint(v, patch) {
  const next = merge(state(v), patch);
  upload(v, 'release-state.json', `${JSON.stringify(next, null, 2)}\n`);
  return next;
}
export async function request(url, options = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), ...options });
  // Webhook credentials can live in the URL path. Never include that path.
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${new URL(url).origin}`);
  return response;
}
export async function mapLimit(values, worker, limit = 6) {
  let cursor = 0;
  const result = new Array(values.length);
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) { const i = cursor++; result[i] = await worker(values[i]); }
  }));
  return result;
}
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
