import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { command, git, packages, repo } from './shared.mjs';

const registry = 'https://registry.npmjs.org';
const workflow = 'release.yml';
const environment = 'Release';

export async function unregisteredPackages(candidates = packages()) {
  const missing = [];
  for (const pkg of candidates) {
    const response = await fetch(`${registry}/${encodeURIComponent(pkg.name)}`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 404) missing.push(pkg);
    else if (!response.ok) throw new Error(`npm returned HTTP ${response.status} for ${pkg.name}; this is not an unregistered package.`);
    await response.body?.cancel();
  }
  return missing;
}

function npm(args, interactive = false) {
  const result = spawnSync('npm', [...args, `--registry=${registry}`], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = result.stderr || '';
    const error = new Error(`npm ${args.slice(0, 2).join(' ')} failed. ${detail.trim()}`);
    error.code = detail.match(/npm (?:error|ERR!) code (\S+)/)?.[1];
    throw error;
  }
  return result.stdout?.trim() || '';
}

function trustConfigurations(name) {
  // npm trust list emits one pretty-printed JSON object per connection,
  // separated by blank lines, and no JSON when there are no connections.
  const output = npm(['trust', 'list', name, '--json']);
  return output ? output.split(/\r?\n\s*\r?\n/).map(item => JSON.parse(item)) : [];
}

function matchingTrust(config) {
  return config.type === 'github' && config.repository === repo
    && config.file === workflow && config.environment === environment
    && config.permissions?.includes('createPackage');
}

function artifactHash(pkg, tarball) {
  const manifest = JSON.parse(command('tar', ['-xOf', tarball, 'package/package.json']));
  if (manifest.name !== pkg.name || manifest.version !== pkg.version || manifest.private) {
    throw new Error(`Artifact does not contain the public package ${pkg.name}@${pkg.version}.`);
  }
  return createHash('sha1').update(readFileSync(tarball)).digest('hex');
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { status: { type: 'boolean' }, 'stage-only': { type: 'boolean' }, tarball: { type: 'string' }, help: { type: 'boolean' } },
  });
  if (values.help) {
    console.log(`Usage: pnpm packages:onboard [package names] [--status | --stage-only] [--tarball path]

With no names, discover unregistered public workspace packages and resume saved onboarding.
--status      Report unregistered names without staging or configuring trust.
--stage-only  Create first staged versions using the current npm credential; suitable for CI.
--tarball     Use an existing publication artifact instead of building (one package only).

The default completes staging, package-specific OIDC trust, and first-version approval.
Trust and approval use npm's interactive maintainer 2FA. Normal releases stay on OIDC.`);
    return;
  }
  if (values.status && values['stage-only']) throw new Error('Choose --status or --stage-only.');
  const all = packages();
  for (const name of positionals) {
    if (!all.some(pkg => pkg.name === name)) throw new Error(`Not a public workspace package: ${name}`);
  }
  const selected = positionals.length ? all.filter(pkg => positionals.includes(pkg.name)) : all;
  if (values.tarball && selected.length !== 1) throw new Error('--tarball requires exactly one package name.');
  const missing = await unregisteredPackages(selected);
  if (values.status) {
    console.log(missing.length ? `New npm packages:\n${missing.map(pkg => `  ${pkg.name}@${pkg.version}`).join('\n')}\n\nRun pnpm packages:onboard ${missing.map(pkg => pkg.name).join(' ')}` : 'All selected package names exist on npm.');
    return;
  }

  const directory = resolve('.open-wa/package-onboarding');
  const statePath = join(directory, 'state.json');
  const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
  const pending = selected.filter(pkg => state[pkg.name] && !state[pkg.name].completedAt);
  const candidates = positionals.length ? selected : [...new Map([...missing, ...pending].map(pkg => [pkg.name, pkg])).values()];
  if (!candidates.length) { console.log('No new package names need onboarding. Normal releases use OIDC.'); return; }
  if (!values['stage-only'] && (!process.stdin.isTTY || !process.stdout.isTTY)) {
    throw new Error('Maintainer onboarding needs an interactive terminal for npm 2FA. Use --stage-only in CI, then run this command in a terminal to finish.');
  }
  const [major, minor] = command('npm', ['--version']).split('.').map(Number);
  if (major < 11 || (major === 11 && minor < 15)) throw new Error('Package onboarding requires npm 11.15 or newer.');
  try { npm(['whoami', '--json']); }
  catch (error) {
    if (!values['stage-only'] && ['E401', 'ENEEDAUTH'].includes(error.code)) {
      console.log('npm needs a maintainer session for new-package onboarding. Normal release publishing remains OIDC.');
      npm(['login', '--auth-type=web'], true);
      npm(['whoami', '--json']);
    } else {
      throw new Error(`npm credential lookup failed (${error.code || 'see npm error'}). ${error.message} For CI, supply a credential with package/scope write access; organization-management access alone cannot create packages.`);
    }
  }

  mkdirSync(directory, { recursive: true, mode: 0o700 });
  function save() {
    writeFileSync(`${statePath}.tmp`, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    renameSync(`${statePath}.tmp`, statePath);
  }
  // Always reconcile the account's pending stages before attempting an upload,
  // including after an interrupted/uncertain previous submission.
  let staged = JSON.parse(npm(['stage', 'list', '--json']));
  const entries = [];
  for (const pkg of candidates) {
    let entry = state[pkg.name];
    if (entry && entry.version !== pkg.version && !entry.completedAt) {
      throw new Error(`Finish saved onboarding for ${pkg.name}@${entry.version} before onboarding ${pkg.version}.`);
    }
    entry = entry?.version === pkg.version ? entry : { version: pkg.version };
    state[pkg.name] = entry;
    entries.push({ pkg, entry });
    if (values.tarball) {
      const tarball = resolve(values.tarball);
      const shasum = artifactHash(pkg, tarball);
      if (entry.shasum && entry.shasum !== shasum) throw new Error(`Provided artifact differs from saved onboarding for ${pkg.name}.`);
      entry.tarball = tarball;
      entry.shasum = shasum;
    }
    const queued = staged.filter(item => item.packageName === pkg.name && item.version === pkg.version);
    if (queued.length > 1) throw new Error(`Multiple stages found for ${pkg.name}@${pkg.version}; inspect npm stage list before continuing.`);
    if (queued.length) {
      if (!entry.shasum) throw new Error(`A stage already exists for ${pkg.name}@${pkg.version}. Supply its expected publication artifact with --tarball to reconcile it before approval.`);
      if (queued[0].shasum !== entry.shasum) throw new Error(`The staged artifact for ${pkg.name} differs from the saved artifact.`);
      entry.stageId = queued[0].id;
      save();
      console.log(`Resume ${pkg.name}@${pkg.version}, stage ${entry.stageId}`);
      continue;
    }
    if (entry.stageId && !entry.approvedAt) {
      const response = await fetch(`${registry}/${encodeURIComponent(pkg.name)}/${pkg.version}`, { signal: AbortSignal.timeout(30_000) });
      if (response.ok) {
        const published = await response.json();
        if (published.dist?.shasum !== entry.shasum) throw new Error(`Published artifact differs from the saved stage for ${pkg.name}.`);
        entry.approvedAt = new Date().toISOString();
        save();
      } else {
        await response.body?.cancel();
        throw new Error(`Stage ${entry.stageId} is no longer pending and npm returned HTTP ${response.status} for its version. Inspect npm stage view ${entry.stageId}; no duplicate upload or approval was attempted.`);
      }
    }
    if (entry.approvedAt || !missing.some(item => item.name === pkg.name)) {
      console.log(`${pkg.name} already exists; configure its OIDC trust without uploading another version.`);
      continue;
    }
    if (entry.stageId || entry.submittedAt) {
      throw new Error(`Saved stage for ${pkg.name} is no longer pending and the name is not publicly visible. Inspect npm stage view ${entry.stageId || '<stage-id>'}; no duplicate upload was attempted.`);
    }
    let tarball = values.tarball ? resolve(values.tarball) : entry.tarball;
    if (!tarball) {
      const artifactDirectory = join(directory, pkg.name.replaceAll('/', '-').replace(/^@/, ''), pkg.version);
      mkdirSync(artifactDirectory, { recursive: true, mode: 0o700 });
      // These are the actual publication artifacts, not a separate build check.
      command('pnpm', ['-r', '--filter', `${pkg.name}...`, '--if-present', 'run', 'build'], { stdio: 'inherit' });
      command('pnpm', ['pack', '--pack-destination', artifactDirectory], { cwd: resolve(pkg.directory), stdio: 'inherit' });
      const files = readdirSync(artifactDirectory).filter(name => name.endsWith('.tgz'));
      if (files.length !== 1) throw new Error(`Expected one publication artifact in ${artifactDirectory}.`);
      tarball = join(artifactDirectory, files[0]);
    }
    entry.tarball = tarball;
    entry.shasum = artifactHash(pkg, tarball);
    entry.sourceSha = values.tarball ? null : git('rev-parse', 'HEAD');
    save();
    console.log(`Stage first version: ${pkg.name}@${pkg.version}`);
    npm(['stage', 'publish', tarball, '--access', 'public', '--tag', pkg.version.includes('-') ? 'next' : 'latest', '--ignore-scripts'], true);
    entry.submittedAt = new Date().toISOString();
    save();
    staged = JSON.parse(npm(['stage', 'list', '--json']));
    const created = staged.find(item => item.packageName === pkg.name && item.version === pkg.version && item.shasum === entry.shasum);
    if (!created) throw new Error(`npm accepted staging for ${pkg.name}, but its stage is not listed yet. Rerun to reconcile; do not upload it again.`);
    entry.stageId = created.id;
    save();
  }
  if (values['stage-only']) {
    console.log(`Initial artifacts staged. Finish maintainer 2FA with:\n  pnpm packages:onboard ${candidates.map(pkg => pkg.name).join(' ')}`);
    return;
  }

  console.log(`Configure direct OIDC publication: ${repo}, ${workflow}, environment ${environment}.\nUse npm's optional five-minute 2FA window to configure the batch together.`);
  let createdTrust = false;
  for (const { pkg, entry } of entries) {
    const configs = trustConfigurations(pkg.name);
    if (!configs.some(matchingTrust)) {
      if (configs.length) throw new Error(`${pkg.name} has different trusted-publisher settings. Existing trust was left unchanged; inspect npm trust list ${pkg.name}.`);
      if (createdTrust) await new Promise(resolve => setTimeout(resolve, 2000));
      npm(['trust', 'github', pkg.name, '--repo', repo, '--file', workflow, '--env', environment, '--allow-publish', '--yes'], true);
      createdTrust = true;
    }
    entry.trustedAt = new Date().toISOString();
    save();
  }
  for (const { pkg, entry } of entries) {
    if (entry.stageId && !entry.approvedAt) {
      npm(['stage', 'approve', entry.stageId], true);
      entry.approvedAt = new Date().toISOString();
      save();
    }
    const configs = trustConfigurations(pkg.name);
    if (!configs.some(matchingTrust)) throw new Error(`Direct OIDC trust was not confirmed for ${pkg.name}.`);
    entry.completedAt = new Date().toISOString();
    save();
    console.log(`Onboarded ${pkg.name}@${pkg.version}. Subsequent releases use OIDC. npm availability is tracked separately.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
