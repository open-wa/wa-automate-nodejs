// Generate concepts/_site/index.html from each built concept's concept.json.
// Usage: node gallery.mjs <siteDir> <slug...>
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [site, ...slugs] = process.argv.slice(2);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const order = ['departures', 'shader', 'terminal', 'editorial', 'blueprint', 'explorer', 'scrollstory', 'transit'];
slugs.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

mkdirSync(join(site, '_gallery'), { recursive: true });
copyFileSync(join(root, '_shared/fonts/AnalogMonoPlus.ttf'), join(site, '_gallery/AnalogMonoPlus.ttf'));

const cards = slugs.map((slug, i) => {
  const c = JSON.parse(readFileSync(join(site, slug, 'concept.json'), 'utf8'));
  const thumb = existsSync(join(site, slug, '__thumb.jpg')) ? `${slug}/__thumb.jpg` : null;
  const icon = ['favicon.svg', 'favicon.png', 'favicon.ico'].find((f) => existsSync(join(site, slug, f)));
  return `
  <li class="card">
    <a class="shot" href="${slug}/index.html" aria-label="Open ${esc(c.name)}">
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy" width="1280" height="800">` : `<span class="noshot">${esc(c.name)}</span>`}
    </a>
    <div class="meta">
      <div class="row">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        ${icon ? `<img class="icon" src="${slug}/${icon}" alt="" width="24" height="24">` : ''}
        <h2><a href="${slug}/index.html">${esc(c.name)}</a></h2>
      </div>
      <p class="dir">${esc(c.direction)}${c.brandFont ? ' · <span class="chip">brand mono</span>' : ''}</p>
      <p class="tag">${esc(c.tagline)}</p>
      ${c.logo ? `<p class="logo"><strong>Logo</strong> ${esc(c.logo)}</p>` : ''}
      ${Array.isArray(c.stack) && c.stack.length ? `<p class="stack">${c.stack.map(esc).join(' · ')}</p>` : ''}
    </div>
  </li>`;
}).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>open-wa Concepts</title>
<style>
@font-face { font-family: "Analog Mono Plus"; src: url("_gallery/AnalogMonoPlus.ttf") format("truetype"); font-display: swap; }
:root { --bg: #F3F2EE; --fg: #16161A; --muted: #5E5D66; --line: #D9D7D0; --card: #FFFFFF; --accent: #214BE6; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #111114; --fg: #EDEBE6; --muted: #A09EA8; --line: #2A2A31; --card: #18181D; --accent: #8EA6FF; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #111114; --fg: #EDEBE6; --muted: #A09EA8; --line: #2A2A31; --card: #18181D; --accent: #8EA6FF; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
.wrap { max-width: 1320px; margin: 0 auto; padding-inline: 16px; padding-block: 40px 64px; }
@media (min-width: 720px) { .wrap { padding-inline: 32px; } }
header { display: grid; gap: 10px; padding-bottom: 28px; border-bottom: 1px solid var(--line); margin-bottom: 28px; }
h1 { margin: 0; font: 400 clamp(34px, 6vw, 64px)/1 "Analog Mono Plus", ui-monospace, monospace; letter-spacing: -0.02em; text-wrap: balance; }
header p { margin: 0; max-width: 62ch; color: var(--muted); }
ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 28px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); }
.card { display: grid; gap: 14px; min-width: 0; }
.shot { display: block; aspect-ratio: 16 / 10; border-radius: 10px; overflow: hidden; border: 1px solid var(--line); background: var(--card); }
.shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; transition: transform .5s cubic-bezier(.2,.7,.2,1); }
.shot:hover img { transform: scale(1.03); }
.noshot { display: grid; place-items: center; height: 100%; font-family: "Analog Mono Plus", ui-monospace, monospace; color: var(--muted); }
.meta { display: grid; gap: 6px; min-width: 0; }
.row { display: flex; align-items: center; gap: 10px; }
.num { font: 13px "Analog Mono Plus", ui-monospace, monospace; color: var(--muted); }
.icon { border-radius: 6px; }
h2 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
h2 a { color: inherit; text-decoration: none; }
h2 a:hover { color: var(--accent); }
.dir { margin: 0; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.chip { color: var(--accent); }
.tag { margin: 0; }
.logo, .stack { margin: 0; font-size: 13px; color: var(--muted); }
.logo strong { color: var(--fg); font-weight: 600; margin-right: 4px; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
@media (prefers-reduced-motion: reduce) { .shot img { transition: none; } }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>open-wa · ${slugs.length} landing concepts</h1>
    <p>Competing directions for the open-wa v5 landing page. Each one is its own world, logo and motion language. Open any of them on desktop and on a phone.</p>
  </header>
  <ul>
${cards}
  </ul>
  <footer>open-wa is unofficial and not affiliated with WhatsApp or Meta. Concepts only; nothing here is a published page.</footer>
</div>
</body>
</html>
`;
writeFileSync(join(site, 'index.html'), html);
console.log(`gallery: ${slugs.length} concepts`);
