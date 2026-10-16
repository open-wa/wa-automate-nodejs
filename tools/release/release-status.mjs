import { api, repo, state, checkpoint, tagRelease, request, mapLimit, sleep, summary, version, runUrl } from './shared.mjs';

const v = version();
let current = state(v);
if (!current.packages?.length) throw new Error(`No package publication record exists for ${v}.`);

function workflowRuns(workflow) {
  return api(`repos/${repo}/actions/workflows/${workflow}/runs?event=workflow_dispatch&per_page=100`).workflow_runs;
}

if (!current.docs?.requestId) {
  current = checkpoint(v, { docs: { requestId: `${v}-${process.env.GITHUB_RUN_ID}` } });
}
const title = `Docs ${v} / ${current.docs.requestId}`;
let docsRun = current.docs.runId
  ? api(`repos/${repo}/actions/runs/${current.docs.runId}`)
  : workflowRuns('docs-run.yml').find(run => run.display_title === title);
if (!docsRun && !current.docs.dispatchedAt) {
  api(`repos/${repo}/actions/workflows/docs-run.yml/dispatches`, {
    ref: 'release', inputs: { release_version: v, release_request_id: current.docs.requestId },
  });
  current = checkpoint(v, { docs: { dispatchedAt: new Date().toISOString() } });
}

function atLeast(actual, expected) {
  if (actual === expected) return true;
  if (!actual || actual.includes('-') || expected.includes('-')) return false;
  const a = actual.split('.').map(Number);
  const b = expected.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

async function availability(pkg) {
  try {
    const url = `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`;
    const query = `?openwa_release=${Date.now()}`;
    const manifest = await (await request(`${url}/${pkg.version}${query}`, { headers: { 'Cache-Control': 'no-cache' } })).json();
    if (manifest.version !== pkg.version || !manifest.dist?.tarball) throw new Error('Version manifest incomplete');
    const tags = await (await request(`${url}/dist-tags${query}`, { headers: { 'Cache-Control': 'no-cache' } })).json();
    const tag = pkg.version.includes('-') ? pkg.version.split('-')[1].split('.')[0] : 'latest';
    if (!atLeast(tags[tag], pkg.version)) throw new Error(`${tag} is ${tags[tag] || 'missing'}`);
    const tarball = new URL(manifest.dist.tarball);
    tarball.searchParams.set('openwa_release', String(Date.now()));
    await request(tarball, { method: 'HEAD', headers: { 'Cache-Control': 'no-cache' } });
    return { ...pkg, available: true, tag, taggedVersion: tags[tag] };
  } catch (error) {
    return { ...pkg, available: false, reason: error.message };
  }
}

// Bumpy's accepted upload can precede npm availability. Reconcile its existing
// package release status only after the public manifest and tarball work.
function reconcilePackage(pkg) {
  const entry = tagRelease(`${pkg.name}@${pkg.version}`, false);
  if (!entry) return;
  const match = entry.body?.match(/<!-- bumpy-metadata\s+([\s\S]*?)bumpy-metadata -->/);
  if (!match) return;
  const metadata = JSON.parse(match[1]);
  if (!metadata.targets?.npm) return;
  if (metadata.targets.npm.status === 'success') {
    if (entry.draft && Object.values(metadata.targets).every(target => target.status === 'success')) {
      api(`repos/${repo}/releases/${entry.id}`, { draft: false }, 'PATCH');
    }
    return;
  }
  metadata.targets.npm = {
    status: 'success', publishedAt: new Date().toISOString(),
    url: `https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`,
  };
  const rows = Object.entries(metadata.targets).map(([name, target]) => {
    const label = target.label || name;
    if (target.status === 'success') return `- ✅ ${target.url ? `[${label}](${target.url})` : label}`;
    if (target.status === 'pending') return `- ⏳ ${label}`;
    if (target.status === 'failed') return `- ❌ ${label} — will retry on next CI run`;
    return `- ⏭️ ${label}`;
  });
  const content = entry.body.split(/#### Published to|<!-- bumpy-metadata/)[0].trimEnd();
  api(`repos/${repo}/releases/${entry.id}`, {
    body: `${content}\n\n#### Published to\n${rows.join('\n')}\n\n<!-- bumpy-metadata\n${JSON.stringify(metadata, null, 2)}\nbumpy-metadata -->`,
    draft: !Object.values(metadata.targets).every(target => target.status === 'success'),
  }, 'PATCH');
}

const deadline = Date.now() + 120 * 60_000;
let remaining = [];
let registry = current.packages.map(pkg => ({ ...pkg, available: false }));
let reconciled = false;
while (Date.now() < deadline) {
  registry = await mapLimit(registry, pkg => pkg.available ? pkg : availability(pkg));
  remaining = registry.filter(pkg => !pkg.available);
  if (!remaining.length && !reconciled) {
    for (const pkg of registry) reconcilePackage(pkg);
    current = checkpoint(v, { npmAvailableAt: new Date().toISOString(), npmValidationPending: false, registry });
    reconciled = true;
  }
  docsRun = docsRun
    ? api(`repos/${repo}/actions/runs/${docsRun.id}`)
    : workflowRuns('docs-run.yml').find(run => run.display_title === title);
  if (docsRun && current.docs.runId !== docsRun.id) {
    current = checkpoint(v, { docs: { runId: docsRun.id, url: docsRun.html_url } });
  }
  if (docsRun?.status === 'completed' && docsRun.conclusion !== 'success') {
    throw new Error(`Documentation deployment ${docsRun.conclusion}: ${docsRun.html_url}. Rerun that action, then rerun Release availability for ${v}; package uploads are unaffected.`);
  }
  if (!remaining.length && docsRun?.conclusion === 'success') {
    current = checkpoint(v, {
      docs: { completedAt: new Date().toISOString() },
      availabilityRun: runUrl, availabilityCompletedAt: new Date().toISOString(), registry,
    });
    if (!current.completedAt) {
      api(`repos/${repo}/actions/workflows/release-notes.yml/dispatches`, { ref: 'release', inputs: { version: v } });
    }
    summary(`## OpenWA ${v} is available\n\nAll ${registry.length} package manifests, dist-tags and tarballs are public. [Documentation deployed](${docsRun.html_url}). Release notes and the announcement run in their own action.`);
    process.exit(0);
  }
  console.log(`${remaining.length ? `Waiting for npm: ${remaining.map(pkg => `${pkg.name}@${pkg.version} (${pkg.reason})`).join(', ')}` : 'All npm packages are available.'} Documentation: ${docsRun?.conclusion || docsRun?.status || 'queued'}.`);
  await sleep(30_000);
}
throw new Error(`Availability tracking timed out for ${v}. ${remaining.length} npm package(s) remain unavailable; docs: ${docsRun?.status || 'not started'}. Rerun Release availability for this version; do not upload accepted versions again.`);
