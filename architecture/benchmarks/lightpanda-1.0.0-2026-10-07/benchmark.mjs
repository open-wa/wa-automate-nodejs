import { createRequire } from 'node:module';
import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir, cpus, totalmem, release } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../..');
const require = createRequire(join(repo, 'packages/driver-puppeteer/package.json'));
const puppeteer = require('puppeteer');
const { WebSocketServer } = require('ws');
const exec = promisify(execFile);
const lp = process.env.LIGHTPANDA_EXECUTABLE_PATH || '/tmp/openwa-lightpanda-v1-benchmark/lightpanda-1.0.0';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay = ms => new Promise(r => setTimeout(r, ms));
const mode = process.argv[2] || 'all';
const resultsPath = join(here, 'results.json');
const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Message ${i}`, amount: i * 3 }));
const fixture = `<!doctype html><html><head><title>OpenWA browser workload</title></head><body>
<input id="input"><button id="button" onclick="window.clicked=(window.clicked||0)+1">Click</button>
<div id="editable" contenteditable="true"></div><main id="messages"></main>
<script>window.fixtureBoot=true;fetch('/api').then(r=>r.json()).then(rows=>{
const frag=document.createDocumentFragment();for(const row of rows){const el=document.createElement('article');
el.className='message';el.dataset.id=row.id;el.dataset.amount=row.amount;el.textContent=row.text;frag.appendChild(el)}
document.querySelector('#messages').appendChild(frag);window.fixtureReady=true});</script></body></html>`;

const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('Cache-Control', 'no-store');
  if (path === '/api') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); }
  else if (path === '/worker.js') { res.setHeader('Content-Type', 'text/javascript'); res.end('onmessage=e=>postMessage(e.data*2)'); }
  else if (path === '/module.js') { res.setHeader('Content-Type', 'text/javascript'); res.end('export const answer=42;'); }
  else if (path === '/sw.js') { res.setHeader('Content-Type', 'text/javascript'); res.end("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));"); }
  else if (path === '/frame') { res.setHeader('Content-Type', 'text/html'); res.end('<body>iframe-ready</body>'); }
  else if (path === '/cors-allow') { res.setHeader('Access-Control-Allow-Origin', '*'); res.end('allowed'); }
  else if (path === '/cors-deny') { res.end('denied'); }
  else { res.setHeader('Content-Type', 'text/html'); res.end(fixture); }
});
const wsServer = new WebSocketServer({ server, path: '/socket' });
wsServer.on('connection', socket => socket.on('message', msg => socket.send(msg.toString())));
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;

async function freePort() {
  const s = createServer(); await new Promise(r => s.listen(0, '127.0.0.1', r));
  const p = s.address().port; await new Promise(r => s.close(r)); return p;
}

const owned = new Set();
async function launch(engine, resources = false) {
  if (engine === 'chrome') {
    const profile = await mkdtemp(join(tmpdir(), 'openwa-chrome-bench-'));
    let browser;
    try {
      browser = await puppeteer.launch({ executablePath: chrome, headless: true, userDataDir: profile,
        defaultViewport: { width: 1280, height: 720 }, timeout: 15000,
        args: ['--disable-gpu', '--disable-extensions', '--disable-background-networking', '--no-first-run'] });
    } catch (error) { await rm(profile, { recursive: true, force: true }); throw error; }
    const entry = { browser, close: async () => { await browser.close(); await rm(profile, { recursive: true, force: true }); owned.delete(entry); } };
    owned.add(entry); return entry;
  }
  const p = await freePort();
  const args = ['serve', '--host', '127.0.0.1', '--port', String(p), '--log-level', 'error'];
  if (resources) for (const resource of ['worker', 'iframe', 'stylesheet']) args.push('--load-resources', resource);
  const child = spawn(lp, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = ''; child.stderr.on('data', b => { stderr = (stderr + b).slice(-6000); });
  let browser;
  const entry = { child, get stderr() { return stderr; }, close: async () => {
    browser?.disconnect();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(r => child.once('exit', r)); child.kill('SIGTERM');
      await Promise.race([exited, delay(2000)]);
      if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited; }
    }
    owned.delete(entry);
  } };
  owned.add(entry);
  try {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Lightpanda exited: ${stderr}`);
      try { const r = await fetch(`http://127.0.0.1:${p}/json/version`); if (r.ok) break; } catch {}
      await delay(10);
    }
    browser = await puppeteer.connect({ browserWSEndpoint: `ws://127.0.0.1:${p}`, protocolTimeout: 8000,
      defaultViewport: { width: 1280, height: 720 } });
    entry.browser = browser; return entry;
  } catch (error) { await entry.close(); throw error; }
}

function seconds(time) {
  const parts = time.split(':').map(Number);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function sampler() {
  let running = true, peak = 0, last = 0, count = 0;
  const cpu = new Map();
  async function snapshot() {
    const { stdout } = await exec('ps', ['-axo', 'pid=,ppid=,rss=,time=,comm=']);
    const rows = stdout.trim().split('\n').map(line => {
      const m = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
      return m && { pid: +m[1], ppid: +m[2], rss: +m[3], cpu: seconds(m[4]), command: m[5] };
    }).filter(Boolean);
    const children = new Map();
    for (const row of rows) { const list = children.get(row.ppid) || []; list.push(row); children.set(row.ppid, list); }
    const pending = [...(children.get(process.pid) || [])]; let rss = 0;
    while (pending.length) {
      const row = pending.pop();
      if (row.command === 'ps' || row.command.endsWith('/ps')) continue;
      rss += row.rss; cpu.set(row.pid, Math.max(cpu.get(row.pid) || 0, row.cpu));
      pending.push(...(children.get(row.pid) || []));
    }
    last = rss / 1024; peak = Math.max(peak, last); count++;
  }
  const loop = (async () => { while (running) { await snapshot(); await delay(50); } })();
  return { snapshot, get cpuSeconds() { return [...cpu.values()].reduce((a,b)=>a+b,0); },
    get lastRssMiB() { return last; }, async stop() { running = false; await loop;
      return { peakTreeRssMiB: peak, lastTreeRssMiB: last, sampledBrowserCpuSeconds: this.cpuSeconds, samples: count }; } };
}

async function loadAndExtract(page) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
  await page.waitForFunction('window.fixtureReady === true', { polling: 10, timeout: 8000 });
  const value = await page.evaluate(() => { const rows = [...document.querySelectorAll('.message')];
    return { count: rows.length, sum: rows.reduce((a,r)=>a+Number(r.dataset.amount),0), last: rows.at(-1)?.textContent }; });
  if (value.count !== 1000 || value.sum !== 1498500 || value.last !== 'Message 999') throw new Error(`Wrong extraction: ${JSON.stringify(value)}`);
  return value;
}

async function measure(engine, concurrency, repeat, navigations = 20) {
  const stats = sampler(); const sessions = []; const started = performance.now();
  try {
    await Promise.all(Array.from({ length: concurrency }, async () => {
      const entry = await launch(engine); sessions.push(entry);
      entry.page = await entry.browser.newPage(); await loadAndExtract(entry.page);
    }));
    const coldReadyMs = performance.now() - started;
    await stats.snapshot(); const coldCpu = stats.cpuSeconds;
    const workStart = performance.now();
    const outputs = await Promise.all(sessions.map(async entry => {
      let value; for (let i = 0; i < navigations; i++) value = await loadAndExtract(entry.page); return value;
    }));
    const warmWorkloadMs = performance.now() - workStart;
    await stats.snapshot(); const warmCpu = stats.cpuSeconds - coldCpu;
    const cpuBeforeIdle = stats.cpuSeconds; await delay(1000); await stats.snapshot();
    const idleCpu = stats.cpuSeconds - cpuBeforeIdle;
    const resources = await stats.stop();
    return { engine, concurrency, repeat, navigationsPerSession: navigations, coldReadyMs, warmWorkloadMs,
      coldBrowserCpuSeconds: coldCpu, warmBrowserCpuSeconds: warmCpu, idleBrowserCpuSecondsOver1s: idleCpu, ...resources, outputs };
  } finally { await stats.stop(); for (const entry of sessions) await entry.close(); }
}

async function compatibility(engine, resources) {
  const entry = await launch(engine, resources); const page = await entry.browser.newPage();
  const checks = [];
  async function check(name, fn, expected) {
    const start = performance.now();
    try { const value = await fn(); const passed = expected ? expected(value) : value === true;
      checks.push({ name, passed, value, durationMs: performance.now()-start }); }
    catch (error) { checks.push({ name, passed: false, error: error.message, durationMs: performance.now()-start }); }
    console.log('compat', engine, resources ? 'resources' : 'default', name, checks.at(-1).passed);
  }
  const bounded = async (fn) => page.evaluate(async source => {
    const run = (0,eval)(`(${source})`);
    return await Promise.race([run(), new Promise((_,r)=>setTimeout(()=>r(new Error('browser feature timeout after 2000ms')),2000))]);
  }, String(fn));
  try {
    await check('CDP version/newPage/navigation/DOM/fetch', async () => { const v=await entry.browser.version(); const x=await loadAndExtract(page); return {version:v,...x}; }, v=>v.count===1000);
    await check('evaluateOnNewDocument before page script', async () => { await page.evaluateOnNewDocument(()=>{window.preloadSawBoot=typeof window.fixtureBoot;}); await loadAndExtract(page); return page.evaluate(()=>window.preloadSawBoot==='undefined'); });
    await check('exposeFunction node bridge', async()=>{await page.exposeFunction('nodeDouble',n=>n*2);return page.evaluate(async()=>await window.nodeDouble(21)===42);});
    await check('CDP user agent override used by OpenWA', async()=>{await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36');return page.evaluate(()=>navigator.userAgent.includes('Chrome/146'));});
    await check('localStorage survives navigation',async()=>{await page.evaluate(()=>localStorage.setItem('bench','persist'));await loadAndExtract(page);return page.evaluate(()=>localStorage.getItem('bench')==='persist');});
    await check('IndexedDB write/read',()=>bounded(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('bench',1);q.onupgradeneeded=()=>q.result.createObjectStore('messages');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});await new Promise((r,j)=>{const tx=db.transaction('messages','readwrite');tx.objectStore('messages').put({text:'hello'},'key');tx.oncomplete=r;tx.onerror=()=>j(tx.error);});const v=await new Promise((r,j)=>{const q=db.transaction('messages').objectStore('messages').get('key');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});db.close();return v.text==='hello';}));
    await check('IndexedDB survives navigation',async()=>{await loadAndExtract(page);return bounded(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('bench',1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});const v=await new Promise((r,j)=>{const q=db.transaction('messages').objectStore('messages').get('key');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});db.close();return v?.text==='hello';});});
    await check('WebCrypto SHA256 and AES-GCM',()=>bounded(async()=>{const b=new TextEncoder().encode('openwa');const h=await crypto.subtle.digest('SHA-256',b);const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);const iv=new Uint8Array(12);const enc=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,b);const dec=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,enc);return h.byteLength===32&&new TextDecoder().decode(dec)==='openwa';}));
    await check('WebSocket echo',()=>bounded(async()=>{const socket=new WebSocket(location.origin.replace('http','ws')+'/socket');return await new Promise((r,j)=>{socket.onopen=()=>socket.send('echo');socket.onmessage=e=>{socket.close();r(e.data==='echo');};socket.onerror=()=>j(new Error('socket failed'));});}));
    await check('dedicated Worker message roundtrip',()=>bounded(async()=>{const w=new Worker('/worker.js');return await new Promise((r,j)=>{w.onmessage=e=>{w.terminate();r(e.data===42);};w.onerror=()=>{w.terminate();j(new Error('worker failed'));};w.postMessage(21);});}));
    await check('ES module dynamic import',()=>bounded(async()=>{const m=await import('/module.js');return m.answer===42;}));
    await check('ES module dynamic import absolute URL',()=>bounded(async()=>{const m=await import(location.origin+'/module.js');return m.answer===42;}));
    await check('MutationObserver DOM mutation',()=>bounded(async()=>{const el=document.createElement('div');document.body.append(el);return await new Promise(r=>{const observer=new MutationObserver(()=>{observer.disconnect();el.remove();r(true);});observer.observe(el,{childList:true});el.textContent='changed';});}));
    await check('Shadow DOM selection',()=>page.evaluate(()=>{const el=document.createElement('div');document.body.append(el);el.attachShadow({mode:'open'}).innerHTML='<span>shadow</span>';const ok=el.shadowRoot.querySelector('span').textContent==='shadow';el.remove();return ok;}));
    await check('cookie CDP export/import',async()=>{await page.evaluate(()=>document.cookie='bench=value;path=/');const cookies=await page.cookies();await page.setCookie({name:'cdp',value:'cookie',url});return cookies.some(c=>c.name==='bench'&&c.value==='value')&&await page.evaluate(()=>document.cookie.includes('cdp=cookie'));});
    await check('CORS blocked without permission',()=>bounded(async()=>{try{await fetch(location.origin.replace('127.0.0.1','localhost')+'/cors-deny');return false;}catch{return true;}}));
    await check('CORS allowed with permission',()=>bounded(async()=>await (await fetch(location.origin.replace('127.0.0.1','localhost')+'/cors-allow')).text()==='allowed'));
    await check('request interception abort',async()=>{let seen=false;await page.setRequestInterception(true);const handler=req=>{if(req.url().endsWith('/intercept')){seen=true;void req.abort();}else void req.continue();};page.on('request',handler);let failed=false;try{await page.evaluate(()=>fetch('/intercept'));}catch{failed=true;}page.off('request',handler);await page.setRequestInterception(false);return seen&&failed;});
    await check('Puppeteer input typing and click',async()=>{await page.type('#input','hello');await page.click('#button');return page.evaluate(()=>document.querySelector('#input').value==='hello'&&window.clicked===1);});
    await check('contenteditable keyboard entry',async()=>{await page.click('#editable');await page.keyboard.type('message');return page.evaluate(()=>document.querySelector('#editable').textContent==='message');});
    await check('Canvas 2D pixel roundtrip',()=>page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=4;const ctx=c.getContext('2d');if(!ctx)return false;ctx.fillStyle='rgb(255,0,0)';ctx.fillRect(0,0,4,4);const d=ctx.getImageData(0,0,1,1).data;return d[0]===255&&d[1]===0&&d[2]===0&&d[3]===255;}));
    await check('CDP screenshot returns PNG bytes',async()=>{const png=await page.screenshot({type:'png',path:join(here,`fixture-${engine}-${resources?'resources':'default'}.png`)});return png.length;},v=>v>1000);
    await check('service worker activation',()=>bounded(async()=>{if(!navigator.serviceWorker)return false;await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;return true;}));
    await check('iframe load and DOM',()=>bounded(async()=>{const f=document.createElement('iframe');f.src='/frame';document.body.append(f);return await new Promise(r=>{f.onload=()=>{const ok=f.contentDocument.body.textContent==='iframe-ready';f.remove();r(ok);};});}));
    await check('separate browser context storage isolation',async()=>{const c=await entry.browser.createBrowserContext();try{const p=await c.newPage();await loadAndExtract(p);return await p.evaluate(()=>localStorage.getItem('bench')===null&&!document.cookie.includes('bench=value'));}finally{await c.close();}});
    return {engine,resources,checks,stderr:entry.stderr};
  } finally { await entry.close(); }
}

async function whatsapp(engine, resources) {
  const entry=await launch(engine,resources);const stats=sampler();const page=await entry.browser.newPage();
  const errors=[], requestFailures=[];page.on('pageerror',e=>{if(errors.length<15)errors.push(e.message);});
  page.on('requestfailed',r=>{if(requestFailures.length<15)requestFailures.push({url:r.url().split('?')[0],error:r.failure()?.errorText});});
  const started=performance.now();let navigationError,snapshot;
  try {
    try {await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36');}
    catch(error){errors.push('setUserAgent: '+error.message);}
    try{await page.goto('https://web.whatsapp.com/',{waitUntil:'domcontentloaded',timeout:30000});}catch(error){navigationError=error.message;}
    const deadline=Date.now()+30000;
    while(Date.now()<deadline){
      try {snapshot=await page.evaluate(()=>({title:document.title,text:document.body?.innerText?.slice(0,2500),
        qrDataRef:!!document.querySelector('canvas[aria-label]')?.parentElement?.getAttribute('data-ref'),
        canvasCount:document.querySelectorAll('canvas').length,require:typeof window.require,worker:typeof Worker,
        indexedDB:typeof indexedDB,serviceWorker:typeof navigator.serviceWorker,readyState:document.readyState}));}
      catch(error){errors.push(error.message);break;}
      if(snapshot.qrDataRef||/browser.*(not supported|unsupported)|update.*browser/i.test(snapshot.text||''))break;
      await delay(500);
    }
    if(engine==='chrome')await page.screenshot({path:join(here,'whatsapp-chrome.png')});
    return {engine,resources,durationMs:performance.now()-started,navigationError,snapshot,errors,requestFailures,
      ...(await stats.stop()),stderr:entry.stderr};
  }finally{await stats.stop();await entry.close();}
}

let report;
try{report=JSON.parse(await readFile(resultsPath,'utf8'));}catch{report={recordedAt:new Date().toISOString(),host:{cpu:cpus()[0].model,cpuCount:cpus().length,memoryMiB:totalmem()/1048576,os:release(),arch:process.arch,node:process.version},versions:{lightpanda:(await exec(lp,['version'])).stdout.trim(),chrome:(await exec(chrome,['--version'])).stdout.trim(),puppeteer:require('puppeteer/package.json').version},methodology:{scope:'Unauthenticated browser capabilities and controlled JavaScript workload; no account login or message sending',rss:'Sum of RSS of benchmark-owned browser process trees only, sampled every ~50ms; excludes Node controller and ps. Shared pages may be counted more than once.',cpu:'Sum of maximum observed cumulative CPU time per browser PID; sampled estimate, can miss short-lived processes. Excludes Node controller and ps.',workload:'1000 messages fetched from local HTTP server, inserted into DOM, extracted and checked; 20 warm navigations per fresh process; one browser process per session; 5 alternating-order repeats at 1 and 3 sessions.',lightpandaFlags:'serve --host 127.0.0.1 --port <free> --log-level error; capability and WhatsApp variants also enable worker,iframe,stylesheet resources; no experimental features',chromeFlags:'headless, --disable-gpu --disable-extensions --disable-background-networking --no-first-run; fresh temporary user-data directory per process; 1280x720 viewport',limitations:'M1 Pro macOS only; local workload is not authenticated WhatsApp workload or full WPT; no persistent restart/session restore acceptance.'},compatibility:[],benchmarks:[],whatsapp:[]};}
async function save(){await writeFile(resultsPath,JSON.stringify(report,null,2)+'\n');}
try{
  if(mode==='all'||mode==='compatibility'){
    report.compatibility=[];
    for(const [engine,resources] of [['chrome',false],['lightpanda',false],['lightpanda',true]]){
      try{report.compatibility.push(await compatibility(engine,resources));}catch(error){report.compatibility.push({engine,resources,error:error.message});}await save();
    }
  }
  if(mode==='all'||mode==='benchmark'){
    report.benchmarks=[];
    for(const concurrency of [1,3])for(let repeat=0;repeat<5;repeat++)for(const engine of (repeat%2?['lightpanda','chrome']:['chrome','lightpanda'])){
      try{const sample=await measure(engine,concurrency,repeat);report.benchmarks.push(sample);console.log('resource',engine,concurrency,repeat,JSON.stringify({coldMs:sample.coldReadyMs,warmMs:sample.warmWorkloadMs,rss:sample.peakTreeRssMiB,cpu:sample.sampledBrowserCpuSeconds}));}
      catch(error){report.benchmarks.push({engine,concurrency,repeat,error:error.message});console.error(error.message);}await save();
    }
  }
  if(mode==='all'||mode==='whatsapp'){
    report.whatsapp=[];
    for(const [engine,resources]of [['chrome',false],['lightpanda',false],['lightpanda',true]]){
      try{const sample=await whatsapp(engine,resources);report.whatsapp.push(sample);console.log('whatsapp',engine,resources,JSON.stringify(sample));}catch(error){report.whatsapp.push({engine,resources,error:error.message});}await save();
    }
  }
}finally{for(const entry of [...owned])await entry.close().catch(()=>{});wsServer.close();await new Promise(r=>server.close(r));}
