// Screenshot every built concept for the gallery (and phone shots for review).
// Usage: node tools/thumbs.mjs [outDirForReviewShots]
import { createServer } from 'node:http';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, '_site');
const review = process.argv[2];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json', '.glb': 'model/gltf-binary', '.riv': 'application/octet-stream', '.wasm': 'application/wasm' };

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(site, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
  createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const slugs = readdirSync(site).filter((s) => !s.startsWith('_') && s !== 'gallery-assets' && existsSync(join(site, s, 'index.html')));
for (const slug of slugs) {
  for (const [name, viewport, mobile] of [['desktop', { width: 1280, height: 800 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`http://127.0.0.1:${port}/${slug}/`, { waitUntil: 'networkidle' }).catch((e) => errors.push(String(e)));
    await page.waitForTimeout(3000);
    if (name === 'desktop') await page.screenshot({ path: join(site, slug, 'gallery-thumb.jpg'), type: 'jpeg', quality: 72 });
    if (review) {
      await page.screenshot({ path: join(review, `${slug}-${name}.jpg`), type: 'jpeg', quality: 60, fullPage: true });
    }
    if (errors.length) console.log(`${slug} ${name} errors:\n  ${errors.slice(0, 5).join('\n  ')}`);
    await page.close();
  }
  console.log(`shot ${slug}`);
}
await browser.close();
server.close();
