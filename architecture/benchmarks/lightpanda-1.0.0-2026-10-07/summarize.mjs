import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const base = new URL('./', import.meta.url);
const results = JSON.parse(await readFile(new URL('results.json', base), 'utf8'));
const probe = JSON.parse(await readFile(new URL('repository-probe.json', base), 'utf8'));
const median = xs => [...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
const fmt = (n, digits=1) => n.toFixed(digits);
const summaries = [];
for (const concurrency of [1,3]) for (const engine of ['chrome','lightpanda']) {
  const samples = results.benchmarks.filter(x => x.engine===engine && x.concurrency===concurrency && !x.error);
  const summary = { engine, concurrency, completedSamples: samples.length };
  for (const key of ['coldReadyMs','warmWorkloadMs','peakTreeRssMiB','lastTreeRssMiB','sampledBrowserCpuSeconds','warmBrowserCpuSeconds','idleBrowserCpuSecondsOver1s']) {
    const values = samples.map(s=>s[key]);
    summary[key] = { median: median(values), min: Math.min(...values), max: Math.max(...values) };
  }
  summaries.push(summary);
}
results.summaries = summaries;
results.completedAt = new Date().toISOString();
results.host.macOS = execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim();
results.lightpandaRelease = { tag: '1.0.0', url: 'https://github.com/lightpanda-io/browser/releases/tag/1.0.0',
  asset: 'lightpanda-aarch64-macos', sha256: '955440053a84754dd64c62f970449a56a2b350cdf43ea5f2e809a73047b8173d',
  verifiedAgainstGitHubAssetDigest: true,
  note: 'The installed ~/.local/bin/lightpanda is a nightly and was not used. Lightpanda CDP reports Chrome/124.0.6367.29; identify the engine by binary version and digest, not Browser.getVersion.' };
results.repository = { commit: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), workingTreeWasDirty: true,
  sourceGuard: probe.sourceGuard, probe: 'repository-probe.json' };
await writeFile(new URL('results.json',base),JSON.stringify(results,null,2)+'\n');

const resourceRows = summaries.map(s => `| ${s.concurrency} | ${s.engine} | ${fmt(s.coldReadyMs.median,0)} | ${fmt(s.warmWorkloadMs.median,0)} | ${fmt(s.peakTreeRssMiB.median)} | ${fmt(s.sampledBrowserCpuSeconds.median,2)} |`).join('\n');
const comparisons = [1,3].map(n=>{
  const c=summaries.find(s=>s.concurrency===n&&s.engine==='chrome');
  const p=summaries.find(s=>s.concurrency===n&&s.engine==='lightpanda');
  return `At ${n} session${n===1?'':'s'}, Lightpanda used ${fmt(c.peakTreeRssMiB.median/p.peakTreeRssMiB.median)}x less summed peak RSS, reached the first checked extraction ${fmt(c.coldReadyMs.median/p.coldReadyMs.median)}x faster, completed repeat loading ${fmt(c.warmWorkloadMs.median/p.warmWorkloadMs.median)}x faster, and used ${fmt(c.sampledBrowserCpuSeconds.median/p.sampledBrowserCpuSeconds.median)}x less sampled browser CPU time.`;
}).join('\n\n');
const chromeChecks=results.compatibility.find(x=>x.engine==='chrome').checks;
const lpDefault=results.compatibility.find(x=>x.engine==='lightpanda'&&!x.resources).checks;
const lpResources=results.compatibility.find(x=>x.engine==='lightpanda'&&x.resources).checks;
const cell=c=>c.passed?'Pass':c.error?'Fail: '+c.error.replaceAll('|','/').slice(0,120):'Fail';
const capabilityRows=chromeChecks.map((c,i)=>`| ${c.name} | ${cell(c)} | ${cell(lpDefault[i])} | ${cell(lpResources[i])} |`).join('\n');
const passCount=cs=>cs.filter(c=>c.passed).length;

const report = `# Lightpanda 1.0.0 versus Chrome 154 — 7 October 2026

Lightpanda is substantially cheaper on this controlled JavaScript workload, but it cannot currently replace Chrome for OpenWA. Chrome reached WhatsApp Web's QR login screen; Lightpanda reached a “Browser not supported” page in both configurations. The current OpenWA source also limits compact authentication to Puppeteer and Playwright.

## Resource results

These are medians of five runs per engine and concurrency level, with engine order alternated. Every session uses a separate fresh browser process. The workload fetches 1,000 message-shaped records from a local HTTP server, creates 1,000 DOM nodes, and verifies their count, sum and final text. After the first load it repeats that workload 20 times per session, then observes one second of idle time. All 20 resource runs returned the expected extraction.

| Sessions | Engine | Launch to first extraction, ms | 20 repeat loads per session, ms | Peak browser-tree RSS, MiB | Browser CPU time, seconds (estimate) |
| --- | --- | ---: | ---: | ---: | ---: |
${resourceRows}

${comparisons}

CPU time covers launch, first load, repeat work and the one-second idle period. For warm work alone, the single-session medians were ${fmt(summaries[1].warmBrowserCpuSeconds.median,2)} seconds for Lightpanda and ${fmt(summaries[0].warmBrowserCpuSeconds.median,2)} seconds for Chrome. Single-session RSS after the idle observation was ${fmt(summaries[1].lastTreeRssMiB.median)} MiB versus ${fmt(summaries[0].lastTreeRssMiB.median)} MiB.

The host is an Apple M1 Pro with 8 CPU cores and 16 GiB RAM, running macOS ${results.host.macOS} (Darwin ${results.host.os}), Node ${results.host.node}, and Puppeteer ${results.versions.puppeteer}. Chrome is ${results.versions.chrome}; Lightpanda is the exact [1.0.0 release](https://github.com/lightpanda-io/browser/releases/tag/1.0.0). Its ARM64 macOS binary SHA256 matched the GitHub asset digest: \`${results.lightpandaRelease.sha256}\`.

## Compatibility

Chrome passed ${passCount(chromeChecks)}/${chromeChecks.length} focused probes, Lightpanda's default configuration passed ${passCount(lpDefault)}/${lpDefault.length}, and Lightpanda with worker, iframe and stylesheet loading passed ${passCount(lpResources)}/${lpResources.length}. This is a focused sample of browser behavior, not a general compatibility percentage or a full WPT run.

| Probe | Chrome | Lightpanda default | Lightpanda with resources |
| --- | --- | --- | --- |
${capabilityRows}

The user-agent override returns successfully but leaves \`navigator.userAgent\` as \`Lightpanda/1.0\`; the current OpenWA source driver produced the same result. The relative dynamic import fails from \`page.evaluate\`, while an absolute URL succeeds. Workers and iframes are opt-in and start working with their resource flags. Service workers are absent under stable/default settings; the [v1 release notes](https://github.com/lightpanda-io/browser/releases/tag/1.0.0) describe an experimental flag, which was not enabled here.

The screenshot-byte probe only establishes that CDP returns a PNG. Visual inspection shows that Lightpanda produces a text representation, omitting the actual input field and styled button, while Chrome captures the page. It does not establish graphical screenshot compatibility. The separate Canvas check verifies actual red pixel data and fails on Lightpanda. See [Chrome fixture](fixture-chrome-default.png) and [Lightpanda fixture](fixture-lightpanda-default.png). Lightpanda's [v1 announcement](https://lightpanda.io/blog/posts/lightpanda-1-0) describes the lack of a graphical rendering pipeline.

Multiple contexts in one Lightpanda process were rejected with “Cannot have more than one browser context at a time.” This does not block the one-process-per-session model used by this benchmark and OpenWA's driver.

## Actual WhatsApp Web navigation

Each engine used a fresh unauthenticated session and attempted the same OpenWA Chrome/146 user-agent override before navigation. The probe waited for either QR login or a browser rejection; it did not log in or send messages.

| Engine | Outcome | Time to outcome | Peak RSS |
| --- | --- | ---: | ---: |
${results.whatsapp.map(s=>`| ${s.engine}${s.resources?' with resources':''} | ${s.snapshot?.qrDataRef?'QR login screen':'Browser not supported; no QR'} | ${fmt(s.durationMs/1000,2)} s | ${fmt(s.peakTreeRssMiB)} MiB |`).join('\n')}

Lightpanda's smaller memory use on this live URL is not comparable workload performance: it never loaded the same WhatsApp application state. The resource comparison above deliberately uses the identical successful local workload instead. [Chrome's login screenshot](whatsapp-chrome.png) records the QR milestone.

## Current OpenWA integration

The current TypeScript Lightpanda driver launched the pinned binary, connected over CDP, opened a page and returned 42 through an exposed Node callback. The engine's CDP version string was \`Chrome/124.0.6367.29\`, so the binary CLI version and digest are the version authority.

Source inspection at \`packages/core/src/createClient.ts:228\` shows the compact-authentication guard rejecting every driver name except \`puppeteer\` and \`playwright\`. This is working-tree evidence at commit \`${results.repository.commit}\`; pre-existing runtime edits were present. A full current-source \`createClient\` execution could not be evaluated through Bun because importing core failed first: \`${probe.createClient.error}\`. That import failure is recorded separately and is not presented as execution of the driver guard.

## Limits and rerunning

The RSS sampler sums benchmark-owned browser process trees approximately every 50 ms and excludes the Node controller and sampler process. Summed RSS can count shared physical pages more than once; these values are not private-memory or container-capacity measurements. CPU is the sum of maximum observed cumulative CPU time per browser PID, which can miss short-lived processes. It excludes controller/server work and is not a utilization percentage.

This was an ordinary active desktop, not an isolated machine. Single-session Chrome launch-to-ready ranged from ${fmt(summaries[0].coldReadyMs.min,0)} to ${fmt(summaries[0].coldReadyMs.max,0)} ms; Lightpanda ranged from ${fmt(summaries[1].coldReadyMs.min,0)} to ${fmt(summaries[1].coldReadyMs.max,0)} ms. The raw samples preserve that variability. No authenticated WhatsApp resource measurement, session restart/restore, long-duration memory growth, Linux comparison, media handling or message delivery was established.

Run from the repository root with the v1 binary at the recorded path, or set \`LIGHTPANDA_EXECUTABLE_PATH\` to an exact 1.0.0 binary:

\`\`\`sh
node architecture/benchmarks/lightpanda-1.0.0-2026-10-07/benchmark.mjs all
LIGHTPANDA_EXECUTABLE_PATH=/tmp/openwa-lightpanda-v1-benchmark/lightpanda-1.0.0 bun architecture/benchmarks/lightpanda-1.0.0-2026-10-07/repository-probe.ts
node architecture/benchmarks/lightpanda-1.0.0-2026-10-07/summarize.mjs
\`\`\`

Modes \`compatibility\`, \`benchmark\` and \`whatsapp\` rerun only that part. The current installed Lightpanda nightly was left unchanged. The benchmark uses temporary Chrome profiles and cleans up its browser processes. [Raw results](results.json), [source-driver probe](repository-probe.json) and the harness are kept beside this report; no product source files were changed by this work.
`;
await writeFile(new URL('report.md',base),report);
console.log('Saved report.md and updated results.json');
