import { existsSync, readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { command, git, api, repo, packages, output, summary, runUrl } from './shared.mjs';
import { unregisteredPackages } from './onboard-packages.mjs';

const publishing = process.argv.includes('--publishing');
const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
const prs = api(`repos/${repo}/pulls?state=open&base=release&head=${repo.split('/')[0]}:master`);
const pr = prs[0];
if (!publishing && process.env.GITHUB_EVENT_NAME === 'push' && !pr) {
  summary('No release PR is open; pending bumps will be prepared when /release is requested.');
  process.exit(0);
}
git('fetch', 'origin', 'master', 'release');
git('config', 'user.name', 'github-actions[bot]');
git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
const pending = readdirSync('.bumpy').some(name => name.endsWith('.md') && name !== 'README.md');
if (pending) {
  command('pnpm', ['exec', 'bumpy', 'version'], { stdio: 'inherit' });
  command('node', ['tools/release/align-fixed-versions.mjs'], { stdio: 'inherit' });
  const paths = ['.bumpy/', 'pnpm-lock.yaml'];
  for (const pkg of packages('.', true)) {
    paths.push(`${pkg.directory}/package.json`);
    if (existsSync(`${pkg.directory}/CHANGELOG.md`)) paths.push(`${pkg.directory}/CHANGELOG.md`);
  }
  git('add', '--', ...paths);
  let changed = true;
  try { git('diff', '--cached', '--quiet'); changed = false; } catch {}
  if (changed) {
    git('commit', '-m', '🔖 chore(release): version packages');
    git('push', 'origin', `HEAD:${publishing ? 'release' : 'master'}`);
    if (publishing) {
      // A bump arriving just before merge is versioned here, without another PR.
      const temp = mkdtempSync(join(tmpdir(), 'openwa-version-sync-'));
      const sha = git('rev-parse', 'HEAD');
      try {
        git('worktree', 'add', '--detach', temp, 'origin/master');
        command('git', ['-C', temp, 'merge', '--no-edit', '-m', '🔖 chore(release): sync published versions to master', sha]);
        command('git', ['-C', temp, 'push', 'origin', 'HEAD:master']);
      } finally {
        git('worktree', 'remove', '--force', temp);
        rmSync(temp, { recursive: true, force: true });
      }
    }
  }
}
if (publishing) { output('sha', git('rev-parse', 'HEAD')); process.exit(0); }

const changed = packages().filter(pkg => {
  try { return JSON.parse(git('show', `origin/release:${pkg.directory}/package.json`)).version !== pkg.version; }
  catch { return true; }
});
if (!changed.length) {
  const message = 'No pending package release. Versions already match release; no release PR was created.';
  summary(message);
  if (event.issue) api(`repos/${repo}/issues/${event.issue.number}/comments`, { body: message });
  process.exit(0);
}
const previousMetadata = pr?.body?.match(/<!-- openwa-release\s+([\s\S]*?)-->/)?.[1];
const metadata = previousMetadata ? JSON.parse(previousMetadata) : {};
if (event.issue) metadata.issue = event.issue.number;
const current = JSON.parse(readFileSync('packages/core/package.json', 'utf8')).version;
const title = `🔖 chore(release): publish open-wa ${current}`;
let onboarding = '';
try {
  const missing = await unregisteredPackages(changed);
  if (missing.length) onboarding = `\n\n## New package onboarding\n\nThese names are not registered on npm: ${missing.map(pkg => `\`${pkg.name}\``).join(', ')}.\n\nRun \`pnpm packages:onboard ${missing.map(pkg => pkg.name).join(' ')}\` from master to create their initial versions and configure direct OIDC publishing. This is one-time package setup; normal releases stay on OIDC. See [package onboarding](https://github.com/${repo}/blob/master/tools/release/README.md#new-package-onboarding).`;
} catch (error) {
  onboarding = `\n\nPackage onboarding discovery was unavailable: ${error.message} Run \`pnpm packages:onboard --status\` to list new names.`;
}
if (onboarding) summary(onboarding.trim());
const details = `<!-- openwa-release-start -->\n## Packages\n\n${changed.map(pkg => `- \`${pkg.name}@${pkg.version}\``).join('\n')}\n\nVersions and package changelogs are committed on master. Merge this PR to publish. Availability tracking and commit-based release notes run separately afterward.${onboarding}\n\n[Preparation run](${runUrl})\n<!-- openwa-release ${JSON.stringify(metadata)} -->\n<!-- openwa-release-end -->`;
const body = pr?.body?.includes('<!-- openwa-release-start -->')
  ? pr.body.replace(/<!-- openwa-release-start -->[\s\S]*?<!-- openwa-release-end -->/, details)
  : `${pr?.body || 'Promote master to release.'}\n\n${details}`;
const result = pr
  ? api(`repos/${repo}/pulls/${pr.number}`, { title, body }, 'PATCH')
  : api(`repos/${repo}/pulls`, { base: 'release', head: 'master', title, body });
output('url', result.html_url);
summary(`## Release prepared\n\n[Merge the release PR](${result.html_url}) to publish.`);
if (event.issue) api(`repos/${repo}/issues/${event.issue.number}/comments`, { body: `Versions and changelogs are prepared on master. [Merge the release PR](${result.html_url}) to publish.` });
