import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);

type Track = { id: string; line: number; len: number; stops: [string, number][]; after: [string, string] | null };
type St = { id: string; x: number; y: number; lines: number[] };
const data: { tracks: Track[]; stations: St[]; W: number; H: number } = JSON.parse(
  document.getElementById('net-data')!.textContent || '{}',
);

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 900px)');
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll(s)) as T[];

const SPEED = 520; // viewBox units per second: the network's "line speed"
const trains: gsap.core.Timeline[] = [];

/* ---------------- Draw-in ---------------- */
function drawIn() {
  (window as any).__netDrawn = true;
  const tl = gsap.timeline({ defaults: { ease: 'none' }, onComplete: startTrains });
  const start: Record<string, number> = {};
  const arrive = new Map<string, number>();
  const t0 = 0.55;

  tl.fromTo('.hero-copy > *', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' }, 0);

  for (const t of data.tracks) {
    let s = t0;
    if (t.after) {
      const parent = data.tracks.find((p) => p.id === t.after![0])!;
      const f = parent.stops.find((x) => x[0] === t.after![1])![1];
      s = start[parent.id] + (f * parent.len) / SPEED;
    }
    start[t.id] = s;
    const dur = t.len / SPEED;
    tl.fromTo(`#draw-${t.id}`, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: dur }, s);
    for (const [id, f] of t.stops) {
      const at = s + f * dur;
      if (!arrive.has(id) || arrive.get(id)! > at) arrive.set(id, at);
    }
  }
  for (const [id, at] of arrive) {
    tl.fromTo(`#mk-${id}`, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.6)' }, at - 0.04);
    tl.fromTo(
      `#st-${id} .stn-lbl`,
      { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' },
      { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power3.out', clearProps: 'clipPath' },
      at + 0.02,
    );
    const pulse = $(`#mk-${id} .pulse`);
    if (pulse) tl.fromTo(pulse, { opacity: 0.7, scale: 1, transformOrigin: '50% 50%' }, { opacity: 0, scale: 2.4, duration: 1, ease: 'power2.out' }, at);
  }
  tl.fromTo('.here', { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.4, ease: 'back.out(2)' }, (arrive.get('start') ?? 0) + 0.25);
  const last = Math.max(...arrive.values());
  tl.fromTo('.map-title', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.6);
  tl.fromTo('.key', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, Math.min(last, 2.2));
}

function settleStatic() {
  root.classList.remove('anim');
}

/* ---------------- Trains (ambient service) ---------------- */
function startTrains() {
  root.classList.remove('anim');
  if (reduce.matches) return;
  data.tracks.forEach((t, k) => {
    const el = document.getElementById(`train-${t.id}`);
    const path = document.getElementById(`base-${t.id}`);
    if (!el || !path) return;
    const fr = t.stops.map((s) => s[1]);
    if (fr[0] !== 0) fr.unshift(0);
    if (fr[fr.length - 1] !== 1) fr.push(1);
    const tl = gsap.timeline({ repeat: -1, yoyo: true, delay: 0.2 + k * 0.35 });
    tl.set(el, { opacity: 1 });
    for (let i = 0; i < fr.length - 1; i++) {
      const seg = (fr[i + 1] - fr[i]) * t.len;
      tl.to(el, {
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5], autoRotate: true, start: fr[i], end: fr[i + 1] },
        duration: Math.max(0.7, seg / 95),
        ease: 'sine.inOut',
      });
      tl.to({}, { duration: 0.9 }); // dwell at the platform
    }
    trains.push(tl);
  });
  const stage = $('#stage');
  if (stage && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => trains.forEach((tl) => (e.isIntersecting ? tl.resume() : tl.pause()))).observe(stage);
  }
}

/* ---------------- Line selection ---------------- */
let selected: number[] = [];
function select(lines: number[], opts: { phone?: number } = {}) {
  selected = lines;
  const any = lines.length > 0;
  $$('.trk').forEach((g) => g.classList.toggle('is-dim', any && !lines.includes(+g.dataset.line!)));
  $$('.mk').forEach((g) => {
    const ls = g.dataset.lines!.split(' ').map(Number);
    g.classList.toggle('is-dim', any && !ls.some((n) => lines.includes(n)));
  });
  $$('.stn').forEach((b) => {
    const ls = b.dataset.lines!.split(' ').map(Number);
    b.classList.toggle('is-dim', any && !ls.some((n) => lines.includes(n)));
  });
  $$('.line-btn').forEach((b) => b.setAttribute('aria-pressed', String(lines.length === 1 && lines[0] === +b.dataset.line!)));
  const phoneLine = opts.phone ?? (lines.length ? lines[lines.length - 1] : 1);
  showPhoneLine(phoneLine);
}

function showPhoneLine(n: number) {
  $$('.line-btn').forEach((b) => {
    if (!desktop.matches) b.setAttribute('aria-pressed', String(+b.dataset.line! === n));
  });
  $$<HTMLElement>('.pline').forEach((p) => {
    const on = +p.dataset.line! === n;
    if (on && p.hidden) {
      p.hidden = false;
      p.classList.remove('run');
      void p.offsetWidth;
      p.classList.add('run');
    } else if (!on) p.hidden = true;
  });
}

$$('.line-btn').forEach((b) =>
  b.addEventListener('click', () => {
    const n = +b.dataset.line!;
    if (desktop.matches) select(selected.length === 1 && selected[0] === n ? [] : [n]);
    else select([n]);
  }),
);
$('.line-all')?.addEventListener('click', () => select([]));
document.addEventListener('click', (e) => {
  const go = (e.target as HTMLElement).closest<HTMLElement>('[data-goto-line]');
  if (!go) return;
  const n = +go.dataset.gotoLine!;
  select([n]);
  const head = document.getElementById(`plh-${n}`);
  if (head) {
    head.setAttribute('tabindex', '-1');
    head.focus({ preventScroll: true });
    document.getElementById(`pl-${n}`)!.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
  }
});

/* ---------------- Station cards (desktop map) ---------------- */
const stage = $('.mapbox')!;
let openId: string | null = null;
let pinned = false;
let closeTimer = 0;

function cardFor(id: string) {
  return document.getElementById(`card-${id}`)!;
}
function place(id: string) {
  const st = data.stations.find((s) => s.id === id)!;
  const card = cardFor(id);
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const px = (st.x / data.W) * w;
  const py = (st.y / data.H) * h;
  const cw = card.offsetWidth;
  const ch = card.offsetHeight;
  const gap = Math.max(26, w * 0.022);
  const right = px + gap + cw < w - 8 && st.x < data.W * 0.66;
  const left = right ? px + gap : Math.max(8, px - gap - cw);
  let top = py - Math.min(70, ch * 0.3);
  top = Math.max(8, Math.min(top, h - ch - 8));
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.style.setProperty('--ox', right ? '0%' : '100%');
  card.style.setProperty('--oy', `${py - top}px`);
}
function open(id: string, pin = false) {
  clearTimeout(closeTimer);
  if (openId && openId !== id) close(true);
  const card = cardFor(id);
  const btn = document.getElementById(`st-${id}`)!;
  if (openId !== id) {
    card.hidden = false;
    place(id);
    card.classList.remove('is-in');
    void card.offsetWidth;
    card.classList.add('is-in');
  }
  btn.setAttribute('aria-expanded', 'true');
  openId = id;
  pinned = pinned || pin;
}
function close(force = false) {
  if (!openId) return;
  if (pinned && !force) return;
  cardFor(openId).hidden = true;
  document.getElementById(`st-${openId}`)!.setAttribute('aria-expanded', 'false');
  openId = null;
  pinned = false;
}
function closeSoon() {
  clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => close(), 260);
}

$$<HTMLButtonElement>('.stn').forEach((btn) => {
  const id = btn.dataset.st!;
  const card = cardFor(id);
  btn.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType === 'mouse') open(id); });
  btn.addEventListener('pointerleave', (e) => { if ((e as PointerEvent).pointerType === 'mouse') closeSoon(); });
  card.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  card.addEventListener('pointerleave', (e) => { if ((e as PointerEvent).pointerType === 'mouse') closeSoon(); });
  btn.addEventListener('click', () => {
    if (openId === id && pinned) close(true);
    else open(id, true);
  });
  btn.addEventListener('focus', () => open(id));
  const leave = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && (btn.contains(to) || card.contains(to))) return;
    if (openId === id) close(true);
  };
  btn.addEventListener('blur', leave);
  card.addEventListener('focusout', leave);
  btn.addEventListener('keydown', (e) => {
    const dir = ({ ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key];
    if (!dir) return;
    e.preventDefault();
    const me = data.stations.find((s) => s.id === id)!;
    let best: St | null = null;
    let bestScore = Infinity;
    for (const s of data.stations) {
      if (s.id === id) continue;
      const dx = s.x - me.x;
      const dy = s.y - me.y;
      const along = dx * dir[0] + dy * dir[1];
      if (along <= 0) continue;
      const across = Math.abs(dx * dir[1] - dy * dir[0]);
      const score = along + across * 2.2;
      if (score < bestScore) { bestScore = score; best = s; }
    }
    if (best) document.getElementById(`st-${best.id}`)!.focus();
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !openId) return;
  const id = openId;
  close(true);
  document.getElementById(`st-${id}`)?.focus({ preventScroll: true });
  // focusing reopens the hover card; Escape means closed
  close(true);
});
document.addEventListener('pointerdown', (e) => {
  if (!openId) return;
  const t = e.target as Node;
  if (cardFor(openId).contains(t) || document.getElementById(`st-${openId}`)!.contains(t)) return;
  close(true);
});
window.addEventListener('resize', () => { if (openId) place(openId); });

/* ---------------- Phone diagram rows ---------------- */
$$<HTMLButtonElement>('.pr-btn').forEach((btn) =>
  btn.addEventListener('click', () => {
    const card = document.getElementById(btn.getAttribute('aria-controls')!)!;
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(willOpen));
    card.hidden = !willOpen;
  }),
);

/* ---------------- Journey planner ---------------- */
$$<HTMLButtonElement>('.jr-opt').forEach((b) =>
  b.addEventListener('click', () => {
    $$('.jr-opt').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    $$<HTMLElement>('.jr').forEach((j) => {
      const on = j.id === `jr-${b.dataset.j}`;
      j.hidden = !on;
      if (on) { j.classList.remove('is-in'); void j.offsetWidth; j.classList.add('is-in'); }
    });
  }),
);
$$<HTMLButtonElement>('.jr-show').forEach((b) =>
  b.addEventListener('click', () => {
    const lines = b.dataset.show!.split(' ').map(Number);
    select(lines, { phone: lines[lines.length - 1] });
    const target = desktop.matches ? $('#map') : document.getElementById(`pl-${lines[lines.length - 1]}`);
    target?.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
  }),
);

/* ---------------- Copy ---------------- */
$$<HTMLButtonElement>('[data-copy]').forEach((b) =>
  b.addEventListener('click', async () => {
    const code = b.parentElement?.querySelector('code')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
      b.textContent = 'Copied';
    } catch {
      b.textContent = 'Select';
    }
    setTimeout(() => (b.textContent = 'Copy'), 1600);
  }),
);

/* ---------------- Logo: a train runs through the interchange ---------------- */
$$<HTMLAnchorElement>('.logo').forEach((a) => {
  const train = $<SVGCircleElement>('.mark-train', a);
  const track = $<SVGPathElement>('.mark-track', a);
  if (!train || !track) return;
  let run: gsap.core.Timeline | null = null;
  const go = () => {
    if (reduce.matches || (run && run.isActive())) return;
    run = gsap.timeline()
      .set(train, { opacity: 1 })
      .fromTo(train, { motionPath: { path: track, align: track, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: track, align: track, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.1, ease: 'power1.inOut' })
      .set(train, { opacity: 0 });
  };
  a.addEventListener('pointerenter', go);
  a.addEventListener('focus', go);
});

/* ---------------- Boot ---------------- */
function boot() {
  select([]);
  if (!desktop.matches) document.getElementById('pl-1')?.classList.add('run');
  if (root.classList.contains('anim') && desktop.matches && !reduce.matches) drawIn();
  else {
    settleStatic();
    if (desktop.matches) startTrains();
  }
}
boot();
desktop.addEventListener('change', () => {
  if (desktop.matches && !trains.length && !reduce.matches) startTrains();
  if (openId) close(true);
});
