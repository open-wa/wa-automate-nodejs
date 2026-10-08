// Build-time SVG renderer for the exploded drawing (static fallback and the
// small section-view key diagrams). Painter's algorithm, three visible faces.
import { LAYERS, CALLOUTS, CART, project, partWorld, bounds, type V3, type Part } from './parts';

interface Opts {
  prefix: string;
  scale?: number;
  highlight?: string[]; // part ids drawn in redline
  cutLayer?: number; // layer index to hatch as a section cut
  labels?: boolean;
  balloons?: boolean;
  title?: string;
}

const f = (n: number) => Math.round(n * 10) / 10;

function wrap(text: string, max: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function isoSVG(o: Opts): string {
  const s = o.scale ?? 30;
  const P = o.prefix;
  const b = bounds(1, 0);
  const labelW = o.labels ? 250 : 0;
  const gap = o.labels || o.balloons ? 40 : 14;
  const drawW = b.w * s;
  const W = Math.ceil(drawW + 2 * (labelW + gap));
  const H = Math.ceil(b.h * s + 2 * 24);
  const ox = labelW + gap - b.x0 * s;
  const oy = 24 + b.y1 * s;
  const pt = (v: V3): [number, number] => {
    const [x, y] = project(v);
    return [ox + x * s, oy - y * s];
  };
  const poly = (vs: V3[]) => vs.map(pt).map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

  type Item = { key: number; svg: string };
  const items: Item[] = [];
  const hl = new Set(o.highlight ?? []);

  LAYERS.forEach((L, li) => {
    for (const p0 of L.parts) {
      let p: Part = p0;
      let hidden = '';
      // Static state: Puppeteer docked, so only its protruding end is visible.
      if (p.kind === 'cartridge' && p.pos[0] === CART.dock[0]) {
        const plateEdge = 5;
        const x1 = p.pos[0] + p.size[0] / 2;
        const x0 = p.pos[0] - p.size[0] / 2;
        const c = partWorld(L, p, 1);
        const y = c[1] + p.size[1] / 2;
        const z0 = c[2] - p.size[2] / 2, z1 = c[2] + p.size[2] / 2;
        hidden = `<polyline class="hid" points="${poly([[plateEdge, y, z0], [x0, y, z0], [x0, y, z1], [plateEdge, y, z1]])}"/>`;
        p = { ...p, size: [x1 - plateEdge, p.size[1], p.size[2]], pos: [(x1 + plateEdge) / 2, p.pos[1], p.pos[2]] };
      }
      const c = partWorld(L, p, 1);
      const [sx, sy, sz] = p.size;
      const x0 = c[0] - sx / 2, x1 = c[0] + sx / 2;
      const y0 = c[1] - sy / 2, y1 = c[1] + sy / 2;
      const z0 = c[2] - sz / 2, z1 = c[2] + sz / 2;
      const isHl = hl.has(p.id);
      const isCut = o.cutLayer === li;
      const cls = `${isHl ? 'hl' : ''} ${isCut ? 'cut' : ''}`.trim();
      const top = poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]);
      const right = poly([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]]);
      const left = poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]);
      const hatch = isHl || isCut ? `url(#${P}-hr)` : `url(#${P}-h)`;
      const svg = `<g${cls ? ` class="${cls}"` : ''}>${hidden}<polygon class="ft" points="${top}"/><polygon class="fl" points="${left}"/><polygon class="fr" points="${right}"/><polygon class="hz" fill="${hatch}" points="${right}"/>${isCut ? `<polygon class="hz" fill="${hatch}" points="${left}"/>` : ''}</g>`;
      const plateFirst = p.kind === 'plate' ? 0 : 100;
      items.push({ key: li * 1000 + plateFirst + (c[0] + c[2]) + c[1] * 0.05, svg });
    }
  });
  items.sort((a, b) => a.key - b.key);

  let labels = '';
  let anchorsSvg = '';
  if (o.labels || o.balloons) {
    type Lab = { c: (typeof CALLOUTS)[number]; ax: number; ay: number; y: number; h: number; lines: string[] };
    const labs: Lab[] = CALLOUTS.map((c) => {
      const L = LAYERS[c.layer];
      const p = L.parts.find((q) => q.id === c.part)!;
      const w = partWorld(L, p, 1);
      const a: V3 = [w[0] + c.at[0] * p.size[0], w[1] + c.at[1] * p.size[1], w[2] + c.at[2] * p.size[2]];
      const [ax, ay] = pt(a);
      const lines = wrap(c.note, 36);
      return { c, ax, ay, y: ay, h: 26 + lines.length * 15, lines };
    });
    for (const side of ['left', 'right'] as const) {
      const col = labs.filter((l) => l.c.side === side).sort((a, b) => a.ay - b.ay);
      let last = 10;
      for (const l of col) { l.y = Math.max(l.ay - 14, last); last = l.y + l.h + 12; }
      const over = last - (H - 6);
      if (over > 0) for (const l of col) l.y -= over;
    }
    for (const l of labs) {
      const left = l.c.side === 'left';
      if (o.balloons) {
        anchorsSvg += `<g class="bal bal-a"><circle class="dot" cx="${f(l.ax)}" cy="${f(l.ay)}" r="2.4"/><line x1="${f(l.ax)}" y1="${f(l.ay)}" x2="${f(l.ax + (left ? -14 : 14))}" y2="${f(l.ay - 12)}"/><circle cx="${f(l.ax + (left ? -22 : 22))}" cy="${f(l.ay - 18)}" r="10"/><text x="${f(l.ax + (left ? -22 : 22))}" y="${f(l.ay - 14)}" text-anchor="middle">${l.c.n}</text></g>`;
        continue;
      }
      const lx = left ? labelW + 4 : W - labelW - 4;
      const knee = left ? lx + 22 : lx - 22;
      labels += `<g class="sv-callout"><polyline class="ldr" points="${f(l.ax)},${f(l.ay)} ${f(knee)},${f(l.y + 9)} ${f(lx)},${f(l.y + 9)}"/><circle class="dot" cx="${f(l.ax)}" cy="${f(l.ay)}" r="2.6"/>`;
      const bx = left ? labelW - 8 : W - labelW + 14;
      labels += `<g class="bal"><circle cx="${bx}" cy="${f(l.y + 9)}" r="11"/><text x="${bx}" y="${f(l.y + 13)}" text-anchor="middle">${l.c.n}</text></g>`;
      const textX = left ? 8 : W - labelW + 34;
      const anchor = 'start';
      labels += `<text class="lt" x="${textX}" y="${f(l.y + 14)}" text-anchor="${anchor}">${esc(l.c.title.toUpperCase())}</text>`;
      l.lines.forEach((line, i) => {
        labels += `<text class="ln" x="${textX}" y="${f(l.y + 32 + i * 15)}" text-anchor="${anchor}">${esc(line)}</text>`;
      });
      labels += `</g>`;
    }
  }

  const defs = `<defs><pattern id="${P}-h" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" class="hl-ink"/></pattern><pattern id="${P}-hr" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" class="hl-red"/></pattern></defs>`;
  const title = o.title ? `<title>${esc(o.title)}</title>` : '';
  return `<svg class="iso" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(o.title ?? 'Exploded drawing')}">${title}${defs}<g class="parts">${items.map((i) => i.svg).join('')}</g>${labels}${anchorsSvg}</svg>`;
}
