import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { command, git, api, repo, packages, output, summary, release, state, checkpoint, version, runUrl, request, mapLimit, sleep } from './shared.mjs';

const v = version(JSON.parse(readFileSync('packages/core/package.json', 'utf8')).version);
const mode = process.argv[2];
const alignVersions = process.env.RELEASE_ALIGN_VERSIONS === 'true';

/** Public packages grouped so that each layer depends only on earlier layers. */
function dependencyLayers() {
  const all = packages();
  const names = new Set(all.map(pkg => pkg.name));
  const needs = new Map(all.map(pkg => {
    const manifest = JSON.parse(readFileSync(`${pkg.directory}/package.json`, 'utf8'));
    const listed = { ...manifest.dependencies, ...manifest.optionalDependencies, ...manifest.peerDependencies };
    return [pkg.name, Object.keys(listed).filter(name => names.has(name))];
  }));
  const done = new Set(), layers = [];
  while (done.size < all.length) {
    const layer = all.filter(pkg => !done.has(pkg.name) && needs.get(pkg.name).every(name => done.has(name)));
    if (!layer.length) throw new Error('Public packages depend on each other in a cycle, so they cannot be published in order.');
    for (const pkg of layer) done.add(pkg.name);
    layers.push(layer);
  }
  return layers;
}

/**
 * Ask npm whether it accepts this workflow as a trusted publisher for a package. npm's own client
 * hides the answer: when the exchange is refused it carries on without a token and the publish
 * ends in ENEEDAUTH. Returns undefined when npm accepts, or npm's reason when it refuses.
 */
async function trustRefusal(name) {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) return undefined; // not in a job that can use trusted publishing
  try {
    const url = new URL(requestUrl);
    url.searchParams.append('audience', 'npm:registry.npmjs.org');
    const id = await (await fetch(url, { headers: { Accept: 'application/json', Authorization: `Bearer ${requestToken}` } })).json();
    if (!id.value) return undefined;
    const response = await fetch(`https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/${name.replace('/', '%2f')}`, {
      method: 'POST', headers: { Authorization: `Bearer ${id.value}`, 'Content-Type': 'application/json' },
    });
    if (response.ok) return undefined;
    let reason = '';
    try { reason = (await response.json()).message || ''; } catch { /* the status is enough */ }
    return `${response.status}${reason ? ` ${reason}` : ''}`;
  } catch { return undefined; } // a failed check must never stop a release that would have worked
}

async function isServed(pkg) {
  try {
    const query = `?openwa_release=${Date.now()}`;
    const manifest = await (await request(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${pkg.version}${query}`, { headers: { 'Cache-Control': 'no-cache' } })).json();
    if (manifest.version !== pkg.version || !manifest.dist?.tarball) return false;
    const tarball = new URL(manifest.dist.tarball);
    tarball.searchParams.set('openwa_release', String(Date.now()));
    await request(tarball, { method: 'HEAD', headers: { 'Cache-Control': 'no-cache' } });
    return true;
  } catch { return false; }
}

/** Wait until npm serves every package in the layer. Stop the release if it does not. */
async function served(layer) {
  const minutes = Number(process.env.RELEASE_LAYER_WAIT_MINUTES || 90);
  const deadline = Date.now() + minutes * 60_000;
  let waiting = layer;
  for (;;) {
    const results = await mapLimit(waiting, async pkg => ({ pkg, ok: await isServed(pkg) }));
    waiting = results.filter(item => !item.ok).map(item => item.pkg);
    if (!waiting.length) return;
    if (Date.now() >= deadline) break;
    console.log(`Waiting for npm to serve ${waiting.map(pkg => `${pkg.name}@${pkg.version}`).join(', ')}`);
    await sleep(20_000);
  }
  const held = waiting.map(pkg => `${pkg.name}@${pkg.version}`).join(', ');
  summary(`## open-wa ${v} is paused\n\nnpm accepted ${held} but has not served it after ${minutes} minutes. Nothing that depends on it was published, so the previous release still installs. Rerun this job when npm serves it. Do not upload it again.`);
  throw new Error(`npm has not served ${held}. Packages that depend on it were not published.`);
}

if (mode === 'open') {
  let existing = release(v, false);
  // A maintenance push with no new version must not announce an old release.
  if (existing && !existing.draft && !existing.assets.some(item => item.name === 'release-state.json')) {
    output('active', false);
    summary(`open-wa ${v} already has a release. No new package release was requested.`);
    process.exit(0);
  }
  if (!existing) {
    const sha = git('rev-parse', 'HEAD');
    let body = `# open-wa ${v}`;
    try {
      body = command('node', ['tools/release/generate-notes.ts', '--version', v, '--output', '-']);
    } catch (error) {
      console.warn(`Release notes could not be written yet; the Release notes action writes them later. ${error.message}`);
    }
    existing = api(`repos/${repo}/releases`, {
      tag_name: `v${v}`, target_commitish: sha, name: `open-wa ${v}`,
      draft: true, prerelease: v.includes('-'), body,
    });
  }
  if (!existing.assets.some(item => item.name === 'release-state.json')) {
    const sha = git('rev-parse', 'HEAD');
    const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
    const promotionSha = event.after || sha;
    const prs = api(`repos/${repo}/commits/${promotionSha}/pulls`);
    const promotion = prs.find(pr => pr.merged_at && pr.base.ref === 'release' && pr.head.ref === 'master');
    const metadata = promotion?.body?.match(/<!-- openwa-release\s+([\s\S]*?)-->/)?.[1];
    checkpoint(v, {
      sourceSha: sha, packages: packages().map(({ name, version }) => ({ name, version })),
      issue: metadata ? JSON.parse(metadata).issue : undefined,
      skipDiscord: git('show', '-s', '--format=%B', promotionSha).includes('[skip-discord]'),
      publisherRun: runUrl,
    });
  }
  let current = state(v);
  if (alignVersions) {
    const planned = packages().map(({ name, version }) => ({ name, version }));
    if (planned.some(pkg => pkg.version !== v)) throw new Error(`Version alignment requires every public package to be ${v}.`);
    const changed = planned.filter(pkg => !current.packages.some(previous => previous.name === pkg.name && previous.version === pkg.version));
    if (changed.length) {
      current = checkpoint(v, {
        alignment: { sourceSha: git('rev-parse', 'HEAD'), previousPackages: current.packages, packages: changed, publisherRun: runUrl },
        packages: planned, npmSubmittedAt: null, npmAvailableAt: null,
        availabilityCompletedAt: null, completedAt: null,
      });
    }
  }
  if (current.completedAt) {
    output('active', false);
    summary(`open-wa ${v} is already complete: ${existing.html_url}`);
    process.exit(0);
  }
  const publicationSha = alignVersions ? current.alignment?.sourceSha || current.sourceSha : current.sourceSha;
  if (publicationSha !== git('rev-parse', 'HEAD')) {
    git('checkout', '--detach', publicationSha);
    command('pnpm', ['install', '--frozen-lockfile'], { stdio: 'inherit' });
  }
  output('active', true);
  output('upload_npm', !current.npmSubmittedAt);
  output('packages', current.packages.map(pkg => pkg.name));
} else if (mode === 'npm') {
  if (!state(v).npmSubmittedAt) {
    // npm can accept a version and then hold it for validation, sometimes for hours. A version
    // that depends on a held one cannot be installed, and it is already `latest`. So publish in
    // dependency layers and wait for npm to serve each layer before publishing what depends on it.
    let pending = false;
    for (const [index, layer] of dependencyLayers().entries()) {
      console.log(`\nLayer ${index + 1}: ${layer.map(pkg => pkg.name).join(', ')}`);
      // A package that npm already serves needs no publisher. For the rest, find out now whether
      // npm will take them from this workflow, so a refusal is named with npm's reason.
      const refused = [];
      for (const pkg of layer) {
        if (await isServed(pkg)) continue;
        const reason = await trustRefusal(pkg.name);
        if (reason) refused.push({ pkg, reason });
      }
      const names = layer.filter(pkg => !refused.some(item => item.pkg === pkg)).map(pkg => pkg.name);
      const result = names.length
        ? spawnSync('pnpm', ['exec', 'bumpy', 'publish', '--filter', names.join(',')], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
        : { status: 0, stdout: '', stderr: '' };
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
      if (result.error) throw result.error;
      const log = `${result.stdout || ''}\n${result.stderr || ''}`.replace(/\x1b\[[0-9;]*m/g, '');
      const codes = [...log.matchAll(/npm (?:error|ERR!) code (\S+)/g)].map(match => match[1]);
      const staged = codes.length > 0 && codes.every(code => code === 'E409') && /previously staged version/i.test(log);
      if (result.status !== 0 && !staged) throw new Error('npm publishing failed; see the package errors above.');
      if (refused.length) {
        const list = refused.map(({ pkg, reason }) => `${pkg.name}@${pkg.version} (${reason})`).join(', ');
        summary(`## open-wa ${v} is paused\n\nnpm refuses trusted publishing for ${list}. The rest of the layer was published; nothing that depends on a refused package was, so the previous release still installs. Publish the refused package by hand from the \`release\` branch (\`pnpm build\`, \`pnpm pack\` in its folder, \`npm publish <file> --access public\`), wait until npm serves it, then rerun this job. If it is already published by hand, npm has not served it yet: wait and rerun.`);
        throw new Error(`npm refuses trusted publishing for ${list}. Publish it by hand, wait until npm serves it, then rerun this job.`);
      }
      pending ||= staged;
      await served(layer);
    }
    checkpoint(v, { npmSubmittedAt: new Date().toISOString(), npmValidationPending: pending });
    if (pending) summary('npm had already accepted some versions for validation. They were not uploaded again.');
  }
} else if (mode === 'finish') {
  const current = checkpoint(v, { githubPackagesPublishedAt: new Date().toISOString() });
  const entry = release(v);
  if (entry.draft) {
    api(`repos/${repo}/releases/${entry.id}`, { draft: false }, 'PATCH');
  }
  api(`repos/${repo}/actions/workflows/release-status.yml/dispatches`, { ref: 'master', inputs: { version: v } });
  summary(`## open-wa ${v} submitted\n\nnpm submission and GitHub Packages publishing finished. The availability action tracks installable packages and documentation, then starts the release notes action.\n\n[Release](https://github.com/${repo}/releases/tag/v${v})\n\n${current.packages.length} package versions are being tracked.`);
} else {
  throw new Error('Use open, npm, or finish.');
}
