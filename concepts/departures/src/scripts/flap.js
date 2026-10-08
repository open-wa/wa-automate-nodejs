// Split-flap engine. Each tile is four halves:
//   t  (static top)    shows the NEXT character, revealed as the leaf falls
//   b  (static bottom) shows the CURRENT character until the leaf lands on it
//   lt (top leaf)      carries the CURRENT character, folds 0 -> -90deg
//   lb (bottom leaf)   carries the NEXT character, swings 90 -> 0deg
// Like a Solari module, a tile can only advance through its drum in order,
// so every character takes its own number of flips to arrive.

export const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ'&!#/:.-→●·0123456789";
const DRUM_INDEX = new Map([...DRUM].map((c, i) => [c, i]));

const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => rm.matches;

const FALL = 'cubic-bezier(.55,.05,.9,.45)'; // gravity: slow release, fast drop
const LAND = 'cubic-bezier(.15,.6,.35,1)';

const T = 0, B = 1, LT = 2, LB = 3;

export class Tile {
  constructor(el) {
    this.el = el;
    this.halves = [...el.children];
    this.glyphs = this.halves.map((h) => h.firstElementChild);
    this.cur = el.dataset.c ?? ' ';
    this.target = this.cur;
    this.path = null;
    this.running = false;
    this.timer = 0;
    this.cap = 8;
    // every module has its own motor: a slightly different flap rate
    this.speed = 54 + Math.random() * 22;
  }

  write(i, c) {
    this.glyphs[i].textContent = c;
  }

  snap(c) {
    clearTimeout(this.timer);
    this.path = null;
    this.cur = this.target = c;
    for (let i = 0; i < 4; i++) this.write(i, c);
    this.el.classList.toggle('sp', c === ' ');
  }

  /** Flip to `c`. `path` forces the characters passed on the way. */
  go(c, { delay = 0, path = null } = {}) {
    if (reduced()) return this.snap(c);
    this.target = c;
    this.path = path ? [...path] : null;
    // how many drum positions this module audibly hunts through before
    // landing; the rest of the drum spins past in one blur
    this.cap = 3 + Math.floor(Math.random() * 8);
    if (this.running) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.run(), delay);
  }

  next() {
    if (this.path && this.path.length) return this.path.shift();
    const a = DRUM_INDEX.get(this.cur);
    const z = DRUM_INDEX.get(this.target);
    if (a === undefined || z === undefined) return this.target;
    const L = DRUM.length;
    const dist = (z - a + L) % L;
    if (dist > this.cap) return DRUM[(z - this.cap + L) % L];
    return DRUM[(a + 1) % L];
  }

  async run() {
    this.running = true;
    this.el.classList.remove('sp');
    try {
      while (this.cur !== this.target || (this.path && this.path.length)) {
        if (reduced()) { this.snap(this.target); break; }
        const n = this.next();
        const last = n === this.target && !(this.path && this.path.length);
        const t0 = performance.now();
        await this.flip(this.cur, n, last);
        this.cur = n;
        // on a struggling device, hunt through fewer flaps rather than
        // letting the board crawl
        if (performance.now() - t0 > this.speed * 2.5) this.cap = Math.max(1, this.cap >> 1);
      }
    } finally {
      this.running = false;
      this.el.classList.toggle('sp', this.cur === ' ');
    }
  }

  async flip(c, n, last) {
    const d = last ? this.speed * 1.5 : this.speed;
    const [, , lt, lb] = this.halves;
    this.write(T, n);
    this.write(LT, c);
    this.write(LB, n);
    const fall = lt.animate(
      [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }],
      { duration: d * 0.5, easing: FALL, fill: 'forwards' },
    );
    // the leaf turns away from the light as it falls, and the incoming
    // leaf lands into the light
    lt.animate([{ opacity: 0 }, { opacity: 0.6 }], { duration: d * 0.5, easing: FALL, pseudoElement: '::after' });
    const land = lb.animate(
      last
        ? [
            { transform: 'rotateX(90deg)' },
            { transform: 'rotateX(0deg)', offset: 0.55 },
            { transform: 'rotateX(16deg)', offset: 0.74 },
            { transform: 'rotateX(0deg)', offset: 0.9 },
            { transform: 'rotateX(3deg)', offset: 0.95 },
            { transform: 'rotateX(0deg)' },
          ]
        : [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }],
      { duration: last ? d * 1.4 : d * 0.5, delay: d * 0.45, easing: last ? 'ease-out' : LAND, fill: 'forwards' },
    );
    await fall.finished;
    this.write(LT, n);
    fall.cancel();
    await land.finished;
    this.write(B, n);
    land.cancel();
  }

  /** A loose flap: the settled bottom leaf lifts a little and drops back. */
  flutter() {
    if (this.running || reduced() || this.cur === ' ') return;
    const lb = this.halves[LB];
    this.write(LB, this.cur);
    lb.animate(
      [
        { transform: 'rotateX(0deg)' },
        { transform: 'rotateX(24deg)' },
        { transform: 'rotateX(0deg)' },
        { transform: 'rotateX(7deg)' },
        { transform: 'rotateX(0deg)' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
  }
}

/** Markup identical to Flaps.astro, for tiles built at runtime. */
export function tileEl(c = ' ') {
  const f = document.createElement('span');
  f.className = c === ' ' ? 'f sp' : 'f';
  f.dataset.c = c;
  for (const k of ['t', 'b', 'lt', 'lb']) {
    const h = document.createElement('span');
    h.className = `h ${k}`;
    const g = document.createElement('span');
    g.textContent = c;
    h.append(g);
    f.append(h);
  }
  return f;
}

/** Write `text` across a row of tiles, left to right with a little stagger. */
export function setRow(tiles, text, { delay = 0, stagger = 22, jitter = 30 } = {}) {
  const chars = [...text.toUpperCase()];
  tiles.forEach((tile, i) => {
    const c = chars[i] ?? ' ';
    if (c === tile.target && !tile.path) return;
    tile.go(c, { delay: delay + i * stagger + Math.random() * jitter });
  });
}
