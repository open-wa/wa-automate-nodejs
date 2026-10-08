import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ── Motion language ────────────────────────────────────────────
   Outbound light is warm (ember), inbound light is cool (tide).
   Scenes are pinned and scrubbed; within a scene, things arrive on
   "film" easing (expo/power3 out), light travels linearly, and
   every scene ends by handing the light out of frame.            */
const FILM = 'power3.out';

/* ── Geometry: wires are drawn from layout anchors, in the stage's
   own pixel space, so the same timelines work on any composition. */
function offsetIn(el, stage) {
  let x = 0, y = 0, n = el;
  while (n && n !== stage) {
    x += n.offsetLeft; y += n.offsetTop;
    n = n.offsetParent;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
const pt = (el, stage, ax = 0.5, ay = 0.5) => {
  const r = offsetIn(el, stage);
  return { x: r.x + r.w * ax, y: r.y + r.h * ay };
};
function curve(a, b, axis) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const horiz = axis ? axis === 'x' : Math.abs(dx) > Math.abs(dy);
  if (horiz) {
    const k = dx * 0.5;
    return `M${a.x},${a.y} C${a.x + k},${a.y} ${b.x - k},${b.y} ${b.x},${b.y}`;
  }
  const k = dy * 0.5;
  return `M${a.x},${a.y} C${a.x},${a.y + k} ${b.x},${b.y - k} ${b.x},${b.y}`;
}
const isPhone = () => window.matchMedia('(max-width: 760px)').matches;

function layoutWires() {
  const phone = isPhone();
  // Scene 1: from the end of the message string, out of the bottom of frame.
  {
    const stage = $('#scene-1 .stage');
    const W = stage.offsetWidth, H = stage.offsetHeight;
    const a = pt($('[data-a="msg-end"]'), stage, 0, 0.5);
    a.x += 10;
    const b = { x: phone ? W * 0.5 : W * 0.86, y: H + 40 };
    const d = `M${a.x},${a.y} C${a.x + (phone ? 40 : 220)},${a.y} ${b.x},${a.y + (H - a.y) * 0.35} ${b.x},${b.y}`;
    setWire(stage, 's1', d);
  }
  // Scene 2: in from the left edge, low, into the light of the door.
  {
    const stage = $('#scene-2 .stage');
    const W = stage.offsetWidth, H = stage.offsetHeight;
    const door = pt($('[data-a="door"]'), stage);
    const a = phone ? { x: -30, y: door.y - 120 } : { x: -40, y: H * 0.3 };
    setWire(stage, 's2', `M${a.x},${a.y} C${a.x + (phone ? 80 : W * 0.15)},${a.y} ${door.x - (phone ? 90 : 160)},${door.y} ${door.x},${door.y}`);
  }
  // Scene 3: from the QR to the vanishing point, plus a road of light lines.
  {
    const stage = $('#scene-3 .stage');
    const W = stage.offsetWidth, H = stage.offsetHeight;
    const q = pt($('[data-a="qr"]'), stage);
    const v = pt($('[data-a="vanish"]'), stage);
    setWire(stage, 's3', phone ? curve(q, v, 'y') : `M${q.x},${q.y} C${q.x + 200},${q.y} ${v.x - (v.x - q.x) * 0.5},${v.y} ${v.x},${v.y}`);
    const road = $('.road', stage);
    const lines = [];
    const count = phone ? 9 : 13;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      let x1, y1;
      if (phone) { x1 = -W * 0.6 + t * W * 2.2; y1 = H + 10; }
      else { x1 = W * 0.34; y1 = -80 + t * (H + 160); }
      lines.push(`<line x1="${x1}" y1="${y1}" x2="${v.x}" y2="${v.y}" style="opacity:${(0.08 + 0.16 * (1 - Math.abs(t - 0.5) * 2)).toFixed(3)}"/>`);
    }
    road.innerHTML = lines.join('');
  }
  // Scene 4: a falling light from above into the phone's screen.
  {
    const stage = $('#scene-4 .stage');
    const W = stage.offsetWidth;
    const s = pt($('[data-a="screen"]'), stage);
    const a = { x: W * (phone ? 0.78 : 0.68), y: -40 };
    setWire(stage, 's4', `M${a.x},${a.y} C${a.x},${s.y * 0.4} ${s.x + 40},${s.y - 80} ${s.x},${s.y}`);
  }
  // Scene 5: phone → event node → three destinations.
  {
    const stage = $('#scene-5 .stage');
    const chat = $('[data-a="chat"]'), node = $('[data-a="node"]');
    if (phone) {
      setWire(stage, 's5', curve(pt(chat, stage, 0.5, 1), pt(node, stage, 0.5, 0), 'y'));
      ['d1', 'd2', 'd3'].forEach((k, i) => {
        const a = pt(node, stage, 0.04, 1);
        const b = pt($(`[data-a="${k}"]`), stage, 0, 0.5);
        setWire(stage, `s5${'abc'[i]}`, `M${a.x},${a.y} C${a.x},${b.y} ${a.x},${b.y} ${b.x},${b.y}`);
      });
    } else {
      setWire(stage, 's5', curve(pt(chat, stage, 1, 0.62), pt(node, stage, 0, 0.5), 'x'));
      ['d1', 'd2', 'd3'].forEach((k, i) => {
        setWire(stage, `s5${'abc'[i]}`, curve(pt(node, stage, 1, 0.5), pt($(`[data-a="${k}"]`), stage, 0, 0.5), 'x'));
      });
    }
  }
  // Stills: park each light at the end of its wire.
  if (!root.classList.contains('motion')) {
    $$('[data-ember]').forEach((e) => {
      const p = $(`[data-wire="${e.dataset.ember}"]`);
      if (!p) return;
      const L = p.getTotalLength();
      const end = p.getPointAtLength(e.dataset.ember === 's1' ? L * 0.62 : L);
      gsap.set(e, { x: end.x, y: end.y, opacity: e.dataset.ember === 's1' ? 1 : 0.9 });
    });
  }
}
function setWire(stage, key, d) {
  const svg = $('.wires', stage);
  svg.setAttribute('viewBox', `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
  $(`[data-wire="${key}"]`, stage).setAttribute('d', d);
}

/* Travel: a light rides its wire, drawing the trail behind it. */
function travel(tl, key, { duration = 1, ease = 'none', at, from = 0, to = 1, shrink = false } = {}) {
  const path = $(`[data-wire="${key}"]`);
  const ember = $(`[data-ember="${key}"]`);
  const p = { t: from };
  tl.fromTo(p, { t: from }, {
    t: to, duration, ease,
    onUpdate() {
      const L = path.getTotalLength();
      const q = path.getPointAtLength(p.t * L);
      gsap.set(ember, { x: q.x, y: q.y, scale: shrink ? 1 - p.t * 0.75 : 1 });
      path.style.strokeDashoffset = String(1 - p.t);
    },
  }, at);
  return tl;
}

/* ── Scene timelines ────────────────────────────────────────── */
function pinScene(id, len, build, arrive = []) {
  const section = $(id);
  // Arrival: the set fades up while the frame scrolls in, so a pin never opens on black.
  if (arrive.length) {
    gsap.fromTo(arrive.map((a) => $(a, section)), { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, ease: 'none', stagger: 0.08,
      scrollTrigger: { trigger: section, start: 'top 90%', end: 'top 15%', scrub: 0.5 },
    });
  }
  const tl = gsap.timeline({
    defaults: { ease: FILM },
    scrollTrigger: {
      trigger: section,
      pin: $('.frame', section),
      start: 'top top',
      end: () => `+=${window.innerHeight * len}`,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  build(tl, section);
  return tl;
}

function buildMotion(phone) {
  const L = phone ? 1.25 : 2.1; // pin length in viewports: shorter on phones

  // Title card: the letterbox closes in, the title recedes, the caret drops.
  pinScene('#open', phone ? 0.45 : 0.6, (tl, s) => {
    tl.to([$('.open__presents', s), ...$$('.open__word', s), $('.open__sub', s)], { yPercent: -30, opacity: 0, duration: 1, stagger: 0.08, ease: 'power2.in' }, 0)
      .to($('.open__cue', s), { opacity: 0, duration: 0.3 }, 0)
      .to($('.stop--title', s), { y: () => window.innerHeight * 0.55, scale: 0.6, duration: 1.1, ease: 'power2.in' }, 0.15)
      .to($$('.bars span', s), { height: 0, duration: 1, ease: 'power1.inOut' }, 0);
  });

  // Scene 1: the line is typed, the message glows, then lifts out of the code.
  pinScene('#scene-1', L, (tl, s) => {
    const chars = $$('.ln--typed .ch', s);
    tl.from(chars, { opacity: 0, duration: 0.01, stagger: 2.2 / chars.length, ease: 'none' }, 0.6)
      .from($('.subtitle', s), { opacity: 0, y: 12, duration: 0.5 }, 2.2)
      .fromTo($('.msg', s), { textShadow: '0 0 0px rgba(255,165,82,0)' }, { textShadow: '0 0 22px rgba(255,165,82,1)', duration: 0.4 }, 2.9)
      .set($('[data-ember="s1"]', s), { opacity: 1 }, 3.2)
      .from($('.note', s), { opacity: 0, duration: 0.4 }, 1.4);
    travel(tl, 's1', { duration: 1.6, at: 3.2, ease: 'power1.in' });
    tl.to($('.editor', s), { scale: 0.97, opacity: 0.55, duration: 1.2, ease: 'power1.in' }, 3.4)
      .to($('[data-ember="s1"]', s), { opacity: 0, duration: 0.1 }, 4.75);
  }, ['.slug', '.key--monitor', '.editor']);

  // Scene 2: a door of light opens in the dark; the request walks in; routes light up.
  pinScene('#scene-2', L, (tl, s) => {
    tl.from($('.door__light', s), { scaleX: 0.02, duration: 1.1, ease: 'power2.inOut' }, 0.1)
      .from($('.spill', s), { scaleY: 0, opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 0.1)
      .from($('.doorway__sign', s), { opacity: 0, y: 8, duration: 0.5 }, 0.6)
      .from($('.routes__cmd', s), { opacity: 0, y: 20, duration: 0.6 }, 0.6)
      .set($('[data-ember="s2"]', s), { opacity: 1 }, 1.0);
    travel(tl, 's2', { duration: 1.4, at: 1.0, ease: 'power1.inOut' });
    tl.to($('[data-ember="s2"]', s), { opacity: 0, duration: 0.2 }, 2.35)
      .fromTo($('.door__light', s), { filter: 'brightness(1)' }, { filter: 'brightness(1.6)', duration: 0.3, yoyo: true, repeat: 1 }, 2.3)
      .from($('.routes__head', s), { opacity: 0, duration: 0.4 }, 2.2)
      .from($$('.route', s).reverse(), { opacity: 0, x: 24, duration: 0.5, stagger: 0.14 }, 2.3)
      .from($('.subtitle', s), { opacity: 0, y: 12, duration: 0.5 }, 2.9)
      .to({}, { duration: 0.6 });
  }, ['.slug', '.door']);

  // Scene 3: the QR scans and lights, the session links, the light races to the horizon.
  pinScene('#scene-3', L, (tl, s) => {
    const mods = $$('.qm', s);
    const order = mods.slice().sort((a, b) => (+a.getAttribute('y') + +a.getAttribute('x') * 0.3) - (+b.getAttribute('y') + +b.getAttribute('x') * 0.3));
    tl.set($('.st--wait', s), { opacity: 1 }, 0)
      .set($('.st--ok', s), { opacity: 0 }, 0)
      .fromTo($('.qr__scan', s), { yPercent: -100, opacity: 1 }, { yPercent: 340, duration: 1.2, ease: 'none' }, 0.5)
      .to(order, { fill: '#ffd8a6', duration: 0.05, stagger: 1.2 / order.length, ease: 'none' }, 0.5)
      .set($('.qr__scan', s), { opacity: 0 }, 1.7)
      .to($('.st--wait', s), { opacity: 0, duration: 0.2 }, 1.7)
      .to($('.st--ok', s), { opacity: 1, duration: 0.3 }, 1.8)
      .from($('.road', s), { opacity: 0, duration: 0.8 }, 1.6)
      .from($('.horizon__label', s), { opacity: 0, duration: 0.6 }, 1.9)
      .to(order, { fill: 'rgba(241,232,218,.18)', duration: 0.6 }, 2.1)
      .set($('[data-ember="s3"]', s), { opacity: 1 }, 2.0);
    travel(tl, 's3', { duration: 1.6, at: 2.0, ease: 'power2.in', shrink: true });
    tl.to($('[data-ember="s3"]', s), { opacity: 0, duration: 0.15 }, 3.5)
      .from($('.drivers', s), { opacity: 0, duration: 0.5 }, 2.4)
      .from($('.subtitle', s), { opacity: 0, y: 12, duration: 0.5 }, 2.6)
      .to({}, { duration: 0.5 });
  }, ['.slug', '.qrcard']);

  // Scene 4: darkness, a falling light, a buzz, the screen and the room light up.
  pinScene('#scene-4', L, (tl, s) => {
    gsap.set([$('.room__ambient', s), $('.room__pool', s)], { opacity: 0 });
    gsap.set($('.screen__off', s), { opacity: 1 });
    tl.from($('.handset__body', s), { filter: 'brightness(0.35)', duration: 0.6 }, 0)
      .set($('[data-ember="s4"]', s), { opacity: 1 }, 0.3);
    travel(tl, 's4', { duration: 1.2, at: 0.3, ease: 'power2.in' });
    tl.to($('[data-ember="s4"]', s), { opacity: 0, scale: 3, duration: 0.25 }, 1.5)
      .to($('[data-wire="s4"]', s), { opacity: 0, duration: 0.4 }, 1.55)
      .to($('.handset__tilt', s), { x: 3, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }, 1.5)
      .fromTo($('.screen__off', s), { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 1.55)
      .fromTo($('.room__ambient', s), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 1.55)
      .fromTo($('.room__pool', s), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 1.6)
      .from($('.notif', s), { y: -40, opacity: 0, scale: 0.9, duration: 0.6, ease: 'back.out(1.6)' }, 2.0)
      .from($('.subtitle', s), { opacity: 0, y: 12, duration: 0.5 }, 2.6)
      .to($('.handset__tilt', s), { rotateX: 8, rotateZ: -2, scale: 1.04, duration: 2.6, ease: 'none' }, 0.6)
      .to({}, { duration: 0.6 });
  }, ['.slug', '.handset']);

  // Scene 5: a reply is typed, the cool light returns, the event fans out.
  pinScene('#scene-5', L, (tl, s) => {
    const typed = $$('.bub--out .ch', s);
    tl.from($('.bub--out', s), { opacity: 0, duration: 0.2 }, 0.5)
      .from(typed, { opacity: 0, duration: 0.01, stagger: 0.9 / typed.length, ease: 'none' }, 0.5)
      .from($('.node', s), { opacity: 0.15, duration: 0.5 }, 0.2)
      .from($$('.dest', s), { opacity: 0.12, duration: 0.5 }, 0.2)
      .set($('[data-ember="s5"]', s), { opacity: 1 }, 1.5);
    travel(tl, 's5', { duration: 0.9, at: 1.5, ease: 'power1.inOut' });
    tl.to($('[data-ember="s5"]', s), { opacity: 0, duration: 0.15 }, 2.35)
      .fromTo($('.node', s), { boxShadow: '0 0 0px 0px rgba(140,200,236,0)' }, { boxShadow: '0 0 90px -10px rgba(140,200,236,.9)', duration: 0.4 }, 2.3)
      .set($$('[data-ember^="s5"]:not([data-ember="s5"])', s), { opacity: 1 }, 2.5);
    ['a', 'b', 'c'].forEach((k, i) => {
      travel(tl, `s5${k}`, { duration: 0.9, at: 2.5 + i * 0.12, ease: 'power1.inOut' });
      tl.to($(`[data-ember="s5${k}"]`, s), { opacity: 0, duration: 0.15 }, 3.3 + i * 0.12)
        .to($$('.dest', s)[i], { opacity: 1, borderColor: 'rgba(213,236,251,.8)', boxShadow: '0 0 50px -12px rgba(140,200,236,.8)', duration: 0.4 }, 3.3 + i * 0.12);
    });
    tl.from($('.subtitle', s), { opacity: 0, y: 12, duration: 0.5 }, 3.4).to({}, { duration: 0.5 });
  }, ['.slug', '.chat']);

  // Interstitial lines: words are lit one by one as you read; the full stop ignites last.
  $$('.line').forEach((line) => {
    const text = $('.line__text', line);
    const split = SplitText.create(text, { type: 'words', wordsClass: 'w' });
    const words = split.words.filter((w) => !w.classList.contains('stop'));
    const tl = gsap.timeline({
      scrollTrigger: { trigger: line, start: 'top 78%', end: 'bottom 62%', scrub: 0.4 },
    });
    tl.fromTo(words, { opacity: 0.1, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', stagger: 0.12, duration: 0.5, ease: 'none' }, 0)
      .fromTo($('.stop', line), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(3)' });
    const aside = $('.line__aside', line);
    if (aside) tl.from(aside, { opacity: 0, y: 10, duration: 0.4 }, '<');
  });

  // Finale: the positioning line resolves word by word.
  {
    const split = SplitText.create('.finale__line', { type: 'words' });
    gsap.fromTo(split.words, { opacity: 0.1 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: '.finale__line', start: 'top 82%', end: 'bottom 52%', scrub: 0.4 },
    });
    gsap.from('.take, .ctas', {
      opacity: 0, y: 30, duration: 1, ease: FILM, stagger: 0.15,
      scrollTrigger: { trigger: '.take', start: 'top 88%' },
    });
  }
}

/* Title intro (plays once on load): black frame, bars open to 2.39:1, title arrives. */
function intro() {
  const split = SplitText.create('.open__word', { type: 'words,chars', charsClass: 'c' });
  const phone = isPhone();
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('.bars span', { height: phone ? '7vh' : '11vh', duration: 1.8, ease: 'expo.inOut' }, 0.2)
    .from('.open__presents', { opacity: 0, letterSpacing: '0.6em', duration: 1.6 }, 0.9)
    .from(split.chars, { opacity: 0, yPercent: 30, filter: 'blur(14px)', duration: 1.6, stagger: 0.05 }, 1.1)
    .from('.open__sub', { opacity: 0, y: 14, duration: 1.2 }, 1.8)
    .from('.stop--title', { opacity: 0, scale: 0, duration: 0.8, ease: 'back.out(3)' }, 2.1)
    .from('.open__cue', { opacity: 0, duration: 1 }, 2.6);
}

/* ── Timecode, current scene and scene navigation ───────────── */
const sceneEls = $$('[data-scene]');
const labels = ['Title', 'Your server', 'Your machine', 'The session', 'The phone', 'The reply', 'Your turn'];
let lenis = null;

function updateReel() {
  const max = root.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  const total = 4 * 60 + 12; // a four-minute short
  const secs = p * total;
  const f = Math.floor((secs % 1) * 24);
  const s = Math.floor(secs) % 60, m = Math.floor(secs / 60);
  const pad = (n) => String(n).padStart(2, '0');
  $('.reel__tc').textContent = `00:${pad(m)}:${pad(s)}:${pad(f)}`;
  $('.reel__fill').style.transform = `scaleX(${p})`;
  // Current scene: the last scene whose top has passed the middle of the viewport.
  const mid = window.innerHeight * 0.5;
  let cur = 0;
  sceneEls.forEach((el, i) => { if (el.getBoundingClientRect().top <= mid) cur = i; });
  if (cur !== updateReel.cur) {
    updateReel.cur = cur;
    $('.reel__no').textContent = `SC ${pad(cur)}`;
    $('.reel__label').textContent = labels[cur];
    $$('.tick').forEach((t, i) => t.setAttribute('aria-current', i === cur ? 'true' : 'false'));
  }
}
let reelQueued = false;
window.addEventListener('scroll', () => {
  if (reelQueued) return;
  reelQueued = true;
  requestAnimationFrame(() => { reelQueued = false; updateReel(); });
}, { passive: true });

function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  let top = el.getBoundingClientRect().top + window.scrollY;
  const st = ScrollTrigger.getAll().find((t) => t.trigger === el && t.pin);
  if (st) top = st.start + (st.end - st.start) * (id === 'open' ? 0 : 0.72);
  if (lenis) lenis.scrollTo(top, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top, behavior: 'auto' });
  const focusTarget = el.querySelector('[tabindex="-1"]');
  if (focusTarget) focusTarget.focus({ preventScroll: true });
}
$$('.tick').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.go)));
$('.logo').addEventListener('click', (e) => { e.preventDefault(); goTo('open'); });
$('.skip').addEventListener('click', (e) => { e.preventDefault(); goTo('finale'); });

/* ── Editor tabs (TS / curl), with arrow-key support ─────────── */
{
  const tabs = $$('.tab');
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    $('#scene-1').classList.toggle('is-curl', tab.id === 'tab-curl');
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      select(next); next.focus();
    });
  });
}

/* ── Copy buttons ────────────────────────────────────────────── */
$$('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const text = document.getElementById(btn.dataset.copy).textContent.trim();
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    btn.textContent = ok ? 'Copied' : 'Select';
    btn.classList.toggle('is-done', ok);
    $('#copy-status').textContent = ok ? 'Command copied to clipboard.' : 'Copy failed. Select the command manually.';
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
  });
});

/* ── Dust motes caught in the key light ───────────────────────── */
function motes(animate) {
  const canvas = $('.motes');
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  const N = isPhone() ? 34 : 64;
  const ps = Array.from({ length: N }, () => ({
    x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7,
    vx: (Math.random() - 0.5) * 0.00006, vy: -0.00002 - Math.random() * 0.00005, ph: Math.random() * 6.28,
  }));
  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };
  resize();
  window.addEventListener('resize', resize);
  let cool = 0; // 0 = warm light, 1 = cool light
  const draw = (t = 0) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const target = updateReel.cur === 5 ? 1 : 0;
    cool += (target - cool) * 0.04;
    const r = Math.round(255 + (140 - 255) * cool), g = Math.round(196 + (200 - 196) * cool), b = Math.round(140 + (236 - 140) * cool);
    const scrollDrift = window.scrollY * 0.00012;
    for (const p of ps) {
      if (animate) { p.x += p.vx; p.y += p.vy; }
      if (p.y < -0.05) p.y = 1.05;
      if (p.x < -0.05) p.x = 1.05; if (p.x > 1.05) p.x = -0.05;
      const yy = ((p.y - scrollDrift * p.z) % 1 + 1) % 1;
      const tw = 0.5 + 0.5 * Math.sin(t * 0.001 + p.ph);
      // brighter near the centre of frame, where the key light falls
      const dx = p.x - 0.5, dy = yy - 0.5;
      const light = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 1.6);
      const a = (0.08 + 0.5 * light) * (0.45 + 0.55 * tw) * p.z;
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x * w, yy * h, 0.6 + p.z * 1.3, 0, 6.283);
      ctx.fill();
    }
  };
  if (animate) gsap.ticker.add((time) => draw(time * 1000));
  else draw();
}

/* ── Boot ────────────────────────────────────────────────────── */
const mm = gsap.matchMedia();
mm.add({
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  phone: '(max-width: 760px)',
}, (ctx) => {
  const { motion, phone } = ctx.conditions;
  root.classList.toggle('motion', motion);
  if (!motion) {
    layoutWires();
    const onResize = () => layoutWires();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  layoutWires();
  ScrollTrigger.addEventListener('refreshInit', layoutWires);
  buildMotion(phone);
  return () => {
    ScrollTrigger.removeEventListener('refreshInit', layoutWires);
    gsap.ticker.remove(raf);
    lenis.destroy();
    lenis = null;
  };
});

const motion = root.classList.contains('motion');
motes(motion);
if (motion) intro();
updateReel();
document.fonts.ready.then(() => { ScrollTrigger.refresh(); updateReel(); });
window.addEventListener('load', () => ScrollTrigger.refresh());
