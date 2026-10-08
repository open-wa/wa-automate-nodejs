import { Tile, tileEl, setRow, reduced } from './flap.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pad = (s, n) => (s.length > n ? s.slice(0, n) : s.padEnd(n, ' '));
const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/* ------------------------------------------------------------------ data */

// Every outgoing message is a departure. Destinations are kinds of message,
// "via" is the open-wa surface it leaves through, the session is the platform.
const POOL = [
  { dest: 'ORDER 4471 READY', short: 'ORDER 4471', via: 'EASY API', plat: 'SHOP' },
  { dest: 'BOOKING REMINDER', short: 'BOOKING', via: 'WEBHOOK', plat: 'SALON' },
  { dest: 'SUPPORT REPLY', short: 'SUPPORT', via: 'CHATWOOT', plat: 'DESK' },
  { dest: 'DELIVERY UPDATE', short: 'DELIVERY', via: 'SOCKET', plat: 'SHOP' },
  { dest: 'AGENT ANSWER', short: 'AI AGENT', via: 'MCP', plat: 'AGENT' },
  { dest: 'TABLE FOR 2 8PM', short: 'TABLE 8PM', via: 'NODE-RED', plat: 'CAFE' },
  { dest: 'PARCEL SHIPPED', short: 'PARCEL', via: 'EASY API', plat: 'STORE' },
  { dest: 'CLASS AT 6PM', short: 'CLASS 6PM', via: 'EMBEDDED', plat: 'GYM' },
  { dest: 'REPLY: HELLO!', short: 'HELLO!', via: 'SOCKET', plat: 'BOT' },
  { dest: 'APPOINTMENT 9:30', short: 'APPT 9:30', via: 'WEBHOOK', plat: 'CARE' },
  { dest: 'COMMUNITY DIGEST', short: 'DIGEST', via: 'SOCKET', plat: 'CLUB' },
  { dest: 'INVOICE SENT', short: 'INVOICE', via: 'EASY API', plat: 'SALES' },
];

const NOTICES = [
  'REQUIRES NODE.JS 22.21.1 OR NEWER',
  'LOG IN ONCE PER SESSION: QR OR LINK CODE',
  'MCP AT /MCP FOR CLAUDE, CURSOR, WINDSURF',
  'IN SERVICE SINCE AUGUST 2019',
  'UNOFFICIAL: NOT AFFILIATED WITH META',
];

// Column sets: the board is re-specified per width rather than squeezed.
const SETS = {
  wide: { rows: 6, cols: [['time', 5, 'Time'], ['dest', 16, 'Destination'], ['via', 8, 'Via'], ['plat', 5, 'Session'], ['status', 8, 'Remarks']] },
  mid: { rows: 6, cols: [['time', 5, 'Time'], ['dest', 16, 'Destination'], ['status', 8, 'Remarks']] },
  narrow: { rows: 5, cols: [['short', 10, 'Destination'], ['lamp', 1, '']] },
};
const GAP_UNITS = 0.7; // blank space between columns, in tiles
const STATUS_LAMP = { BOARDING: '●', DEPARTED: '→', 'ON TIME': '·' };

/* ----------------------------------------------------------------- board */

const board = document.querySelector('[data-board]');
const grid = board?.querySelector('[data-grid]');
const labels = board?.querySelector('[data-labels]');
const noticeEl = board?.querySelector('[data-notice]');
const caption = document.querySelector('[data-caption]');

let poolIdx = 0;
const clock = new Date();
let rows = [];
let set = null;
let tw = 0;
let tileRows = []; // [{el, cols: [Tile[]]}]
let noticeTiles = [];
let noticeIdx = 0;

function nextDeparture(prevTime) {
  const d = POOL[poolIdx++ % POOL.length];
  const t = new Date(prevTime.getTime() + Math.round(rand(1, 3)) * 60000);
  return { ...d, at: t, status: 'ON TIME' };
}

function seed() {
  let t = new Date(clock.getTime());
  for (let i = 0; i < 7; i++) {
    const d = nextDeparture(t);
    rows.push(d);
    t = d.at;
  }
  rows[0].status = 'BOARDING';
}

function fieldText(row, key, n) {
  if (key === 'time') return hhmm(row.at);
  if (key === 'lamp') return STATUS_LAMP[row.status];
  return pad(row[key] ?? '', n);
}

function chooseSet(width) {
  for (const name of ['wide', 'mid', 'narrow']) {
    const s = SETS[name];
    const units = s.cols.reduce((a, c) => a + c[1], 0) + (s.cols.length - 1) * GAP_UNITS;
    const w = Math.floor(width / units);
    if (name === 'narrow' || w >= (name === 'wide' ? 24 : 26)) return { name, w: Math.min(w, name === 'narrow' ? 40 : 34) };
  }
}

function build() {
  if (!grid) return;
  const width = grid.clientWidth;
  const choice = chooseSet(width);
  if (set === choice.name && tw === choice.w) return;
  set = choice.name;
  tw = choice.w;
  const s = SETS[set];
  const th = Math.round(tw * 1.52);
  board.style.setProperty('--tw', `${tw - 3}px`);
  board.style.setProperty('--th', `${th}px`);
  board.style.setProperty('--gapw', `${Math.round(tw * GAP_UNITS)}px`);
  board.dataset.set = set;

  labels.replaceChildren(
    ...s.cols.map(([, n, label]) => {
      const l = document.createElement('span');
      l.textContent = label;
      l.style.width = `${n * tw - 3}px`;
      return l;
    }),
  );

  const first = tileRows.length === 0;
  tileRows = [];
  grid.replaceChildren();
  rows.slice(0, s.rows).forEach((row) => {
    const r = document.createElement('div');
    r.className = 'row';
    r.dataset.status = row.status;
    const cols = s.cols.map(([key, n]) => {
      const c = document.createElement('span');
      c.className = `col col-${key}`;
      const text = first ? '' : fieldText(row, key, n);
      const tiles = Array.from({ length: n }, (_, i) => {
        const el = tileEl(text[i] ?? ' ');
        c.append(el);
        return new Tile(el);
      });
      r.append(c);
      return tiles;
    });
    grid.append(r);
    tileRows.push({ el: r, cols });
  });

  if (noticeEl) {
    const count = set === 'narrow' ? 0 : Math.floor(width / tw);
    noticeEl.replaceChildren();
    noticeTiles = Array.from({ length: count }, () => {
      const el = tileEl(' ');
      noticeEl.append(el);
      return new Tile(el);
    });
    if (!first) setRow(noticeTiles, NOTICES[noticeIdx], { stagger: 0, jitter: 0 });
  }
}

function render({ base = 0 } = {}) {
  const s = SETS[set];
  tileRows.forEach(({ el, cols }, r) => {
    const row = rows[r];
    el.dataset.status = row.status;
    let colOffset = 0;
    cols.forEach((tiles, ci) => {
      const [key, n] = s.cols[ci];
      setRow(tiles, fieldText(row, key, n), { delay: base + r * 70 + colOffset * 16, stagger: 16, jitter: 40 });
      colOffset += n;
    });
  });
  updateCaption();
}

function updateCaption() {
  if (!caption) return;
  const r = rows[0];
  const title = r.dest.charAt(0) + r.dest.slice(1).toLowerCase();
  caption.innerHTML = '';
  const lamp = document.createElement('span');
  lamp.className = `lamp ${r.status === 'BOARDING' ? 'on' : ''}`;
  caption.append(lamp, `${r.status === 'BOARDING' ? 'Boarding' : 'Departed'} ${hhmm(r.at)}: ${title}, via ${r.via.toLowerCase()} from session ${r.plat.toLowerCase()}`);
}

async function cycle() {
  for (;;) {
    await sleep(5600);
    rows[0].status = 'DEPARTED';
    render();
    await sleep(3400);
    const last = rows[rows.length - 1];
    rows.shift();
    rows.push(nextDeparture(last.at));
    rows[0].status = 'BOARDING';
    render();
  }
}

async function notices() {
  for (;;) {
    await sleep(7000);
    noticeIdx = (noticeIdx + 1) % NOTICES.length;
    if (noticeTiles.length) setRow(noticeTiles, NOTICES[noticeIdx], { stagger: 12, jitter: 20 });
  }
}

function flutterLoop() {
  setInterval(() => {
    const all = tileRows.flatMap((r) => r.cols.flat());
    if (!all.length) return;
    all[Math.floor(Math.random() * all.length)].flutter();
  }, 1700);
}

/* ----------------------------------------------------------------- clock */

function startClock() {
  const el = document.querySelector('[data-clock]');
  if (!el) return;
  const tiles = [...el.querySelectorAll('.f')].map((f) => new Tile(f));
  let shown = '';
  const tick = () => {
    const now = hhmm(new Date());
    if (now !== shown) {
      shown = now;
      setRow(tiles, now, { stagger: 60, jitter: 10 });
    }
  };
  tiles.forEach((t) => t.snap(' '));
  setTimeout(tick, 300);
  setInterval(tick, 1000);
}

/* ------------------------------------------------------------------ logo */

function logo() {
  document.querySelectorAll('[data-logo]').forEach((a) => {
    const tiles = [...a.querySelectorAll('.f')].map((f) => new Tile(f));
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const reveal = (base = 0) =>
      tiles.forEach((t, i) => {
        const target = t.el.dataset.c;
        const path = Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () => letters[Math.floor(Math.random() * 26)]);
        t.go(target, { delay: base + i * 55, path });
      });
    if (!reduced()) {
      tiles.forEach((t) => t.snap(' '));
      reveal(250);
    }
    let last = 0;
    const again = () => {
      const now = performance.now();
      if (now - last < 900) return;
      last = now;
      reveal(0);
    };
    a.addEventListener('pointerenter', again);
    a.addEventListener('focus', again);
  });
}

/* ------------------------------------------------- flip in on scroll */

function reveals() {
  const groups = [...document.querySelectorAll('.flaps[data-reveal="view"]')];
  if (reduced() || !('IntersectionObserver' in window)) return;
  const map = new Map();
  groups.forEach((g) => {
    const tiles = [...g.querySelectorAll('.f')].map((f) => new Tile(f));
    const text = tiles.map((t) => t.el.dataset.c).join('');
    tiles.forEach((t) => t.snap(' '));
    map.set(g, { tiles, text });
  });
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const { tiles, text } = map.get(e.target);
        tiles.forEach((t, i) => t.go(text[i], { delay: i * 35 + Math.random() * 40 }));
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  groups.forEach((g) => io.observe(g));
}

/* ------------------------------------------------------- tabs and copy */

function tabs() {
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const btns = [...list.querySelectorAll('[role="tab"]')];
    const select = (b, focus) => {
      btns.forEach((x) => {
        const on = x === b;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) b.focus();
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(b, false));
      b.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % btns.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + btns.length) % btns.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = btns.length - 1;
        if (j === null) return;
        e.preventDefault();
        select(btns[j], true);
      });
    });
  });
}

function copy() {
  const status = document.querySelector('[data-copy-status]');
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const src = document.getElementById(btn.dataset.copy);
      const text = src?.innerText.trim() ?? '';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const label = btn.querySelector('.copy-label');
      if (label) {
        label.textContent = 'Copied';
        setTimeout(() => (label.textContent = 'Copy'), 1600);
      }
      if (status) status.textContent = 'Copied to clipboard';
    });
  });
}

/* ------------------------------------------------------------------ init */

function init() {
  logo();
  reveals();
  startClock();
  tabs();
  copy();
  if (board) {
    seed();
    build();
    // first departure: the whole board riffles in from blank
    setTimeout(() => {
      render({ base: 0 });
      if (noticeTiles.length) setRow(noticeTiles, NOTICES[0], { delay: 900, stagger: 14, jitter: 20 });
    }, 350);
    cycle();
    notices();
    flutterLoop();
    let raf = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const before = set + tw;
        build();
        if (set + tw !== before) {
          // rebuilt at a new size: settle instantly, no riffle on resize
          tileRows.forEach(({ cols }, r) =>
            cols.forEach((tiles, ci) => {
              const [key, n] = SETS[set].cols[ci];
              const text = fieldText(rows[r], key, n);
              tiles.forEach((t, i) => t.snap(text[i] ?? ' '));
            }),
          );
          if (noticeTiles.length) noticeTiles.forEach((t, i) => t.snap(NOTICES[noticeIdx][i] ?? ' '));
        }
      });
    }).observe(grid);
  }
}

init();
