import { animate, press, inView } from 'motion';
import {
  actions,
  destIcons,
  getCombo,
  inspectorKicker,
  renderCode,
  triggers,
  type ActionId,
  type Bubble,
  type Combo,
  type TriggerId,
} from '../lib/combos';

// ---------------------------------------------------------------------------
// Motion language
//   pop   : things that arrive (bubbles, ticks, nodes) overshoot, then settle
//   press : toys squash on press and spring back with a bounce
//   travel: messages move along wires with a smooth ease, never a spring
// ---------------------------------------------------------------------------
const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const phoneMQ = window.matchMedia('(max-width: 760px)');
const reduced = () => reducedMQ.matches;

const POP = { type: 'spring', stiffness: 520, damping: 17, mass: 0.9 } as const;
const SETTLE = { type: 'spring', stiffness: 380, damping: 26 } as const;
const BOUNCE_BACK = { type: 'spring', stiffness: 600, damping: 11 } as const;
const BEAT = 720;

const base = import.meta.env.BASE_URL;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Tactile press on every toy
// ---------------------------------------------------------------------------
press('.toy, .step-btn', (el) => {
  if (reduced()) return;
  animate(el, { scale: 0.95 }, { type: 'spring', stiffness: 700, damping: 30 });
  return () => animate(el, { scale: 1 }, BOUNCE_BACK);
});

// ---------------------------------------------------------------------------
// Logo: idle blink now and then
// ---------------------------------------------------------------------------
const headerMark = $('.top .mark');
function idleBlink() {
  if (!reduced() && headerMark && !document.hidden) {
    headerMark.classList.add('is-blinking');
    setTimeout(() => headerMark.classList.remove('is-blinking'), 400);
  }
  setTimeout(idleBlink, 3800 + Math.random() * 3600);
}
setTimeout(idleBlink, 2400);

// ---------------------------------------------------------------------------
// Playground
// ---------------------------------------------------------------------------
const board = $('#playground');
const state: { trigger: TriggerId; action: ActionId; step: number } = {
  trigger: 'message',
  action: 'send',
  step: 1,
};

const nodes = $$('.node', board);
const wires = $$('.wire', board);
const caps = $$('.caption li', board);
const chat = $('.chat', board);
const inspector = $('.inspector', board);
const codeBlocks = $('.code-blocks', board);
const codeNote = $('.code-note', board);
const heroWally = $('.hero-wally img');
const heroSay = $('.hero-say');

const sayings: Record<ActionId, string> = {
  send: 'Short and sweet!',
  webhook: 'Ooh, webhooks!',
  chatwoot: 'Team inbox!',
  mcp: 'Robot friends!',
};
const wallyImg: Record<ActionId, string> = { send: 'send', webhook: 'webhook', chatwoot: 'chatwoot', mcp: 'mcp' };

function svgPath(d: string, size = 22) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${d}"/></svg>`;
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bubbleEl(b: Bubble) {
  const el = document.createElement('div');
  el.className = `bubble from-${b.who}`;
  el.innerHTML = `<p>${esc(b.text)}</p><span class="meta">09:41${b.who === 'business' ? ' ✓✓' : ''}</span>`;
  return el;
}

function typingEl(who: Bubble['who']) {
  const el = document.createElement('div');
  el.className = `bubble typing from-${who}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i></i><i></i><i></i>';
  return el;
}

/** Paint the static parts of the stage for a combo. */
function paint(c: Combo) {
  const t = triggers.find((x) => x.id === c.trigger)!;
  const a = actions.find((x) => x.id === c.action)!;

  nodes[0].style.setProperty('--c', t.color);
  $('.node-icon', nodes[0]).innerHTML = svgPath(t.icon);
  nodes[2].style.setProperty('--c', a.color);
  nodes[2].dataset.action = a.id;
  $('.node-icon', nodes[2]).innerHTML = svgPath(a.icon);
  $('.node-icon', nodes[3]).innerHTML = svgPath(destIcons[a.id]);
  c.nodes.forEach((label, i) => ($('.node-label', nodes[i]).textContent = label));
  c.caption.forEach((text, i) => (caps[i].textContent = text));

  inspector.dataset.kind = c.inspector.kind;
  $('.inspector-kicker', inspector).textContent = inspectorKicker[c.inspector.kind];
  $('.inspector-title', inspector).textContent = c.inspector.title;
  $('.inspector-body', inspector).textContent = c.inspector.body;
  const wi = $<HTMLImageElement>('.inspector-wally', inspector);
  wi.src = `${base}wally/${wallyImg[c.action]}.webp`;

  codeBlocks.innerHTML = renderCode(c.code);
  codeNote.textContent = c.note;
}

/** Beats of the little film for a combo. */
type Beat = { node: number; wire?: number; cap: number; inspector?: boolean; bubbles: Bubble[] };
function beats(c: Combo): Beat[] {
  if (!c.outbound) {
    return [
      { node: 0, cap: 0, bubbles: [c.first] },
      { node: 1, wire: 0, cap: 1, bubbles: [] },
      { node: 2, wire: 1, cap: 2, inspector: true, bubbles: [] },
      { node: 3, wire: 2, cap: 3, bubbles: c.result ? [c.result] : [] },
    ];
  }
  if (c.action === 'send') {
    return [
      { node: 0, cap: 0, bubbles: [] },
      { node: 1, wire: 0, cap: 1, bubbles: [] },
      { node: 2, wire: 1, cap: 2, inspector: true, bubbles: [] },
      { node: 3, wire: 2, cap: 3, bubbles: [c.first] },
    ];
  }
  return [
    { node: 0, cap: 0, bubbles: [] },
    { node: 1, wire: 0, cap: 1, bubbles: [c.first, c.reply!] },
    { node: 2, wire: 1, cap: 2, inspector: true, bubbles: [] },
    { node: 3, wire: 2, cap: 3, bubbles: c.result ? [c.result] : [] },
  ];
}

function resetStage() {
  nodes.forEach((n) => n.classList.remove('is-lit'));
  wires.forEach((w) => w.classList.remove('is-lit'));
  caps.forEach((l) => l.classList.remove('is-on', 'is-now'));
  $$('.bubble', chat).forEach((b) => b.remove());
  inspector.classList.add('is-idle');
}

function finalState(c: Combo) {
  resetStage();
  nodes.forEach((n) => n.classList.add('is-lit'));
  wires.forEach((w) => w.classList.add('is-lit'));
  caps.forEach((l) => l.classList.add('is-on'));
  for (const b of beats(c)) b.bubbles.forEach((x) => chat.append(bubbleEl(x)));
  inspector.classList.remove('is-idle');
}

let runId = 0;

async function travel(wire: HTMLElement, id: number) {
  wire.classList.add('is-lit');
  const dot = $('.wire-dot', wire);
  const w = wire.offsetWidth;
  await animate(dot, { x: [0, w], opacity: [1, 1] }, { duration: 0.42, ease: [0.45, 0, 0.2, 1] });
  if (id !== runId) return;
  animate(dot, { opacity: 0, scale: [1.4, 0.6] }, { duration: 0.18 });
}

async function addBubble(b: Bubble, id: number) {
  // the other side "types" first, so the conversation reads like a real one
  const typing = typingEl(b.who);
  chat.append(typing);
  animate(typing, { scale: [0.6, 1], opacity: [0, 1] }, POP);
  await wait(b.who === 'customer' ? 520 : 620);
  typing.remove();
  if (id !== runId) return;
  const el = bubbleEl(b);
  chat.append(el);
  animate(el, { scale: [0.5, 1], opacity: [0, 1], y: [14, 0] }, POP);
}

async function play() {
  const id = ++runId;
  const c = getCombo(state.trigger, state.action);
  paint(c);
  if (reduced()) {
    finalState(c);
    return;
  }
  resetStage();
  const list = beats(c);
  for (let i = 0; i < list.length; i++) {
    const beat = list[i];
    if (id !== runId) return;
    if (i > 0) caps[i - 1].classList.remove('is-now');
    caps[beat.cap].classList.add('is-on', 'is-now');
    if (beat.wire !== undefined) await travel(wires[beat.wire], id);
    if (id !== runId) return;
    const node = nodes[beat.node];
    node.classList.add('is-lit');
    animate(node, { scale: [0.82, 1] }, POP);
    animate($('.node-icon', node), { rotate: [-16, 0] }, POP);
    if (beat.inspector) {
      inspector.classList.remove('is-idle');
      animate(inspector, { scale: [0.86, 1], rotate: [-3, 0] }, POP);
    }
    for (const b of beat.bubbles) {
      await addBubble(b, id);
      if (id !== runId) return;
      if (beat.bubbles.length > 1) await wait(280);
    }
    await wait(BEAT - (beat.bubbles.length ? 300 : 0));
  }
}

// first paint: show the finished state immediately (no-JS markup equivalent)
finalState(getCombo(state.trigger, state.action));

// ---------------- radio groups ----------------
function select(group: HTMLElement, btn: HTMLElement, focus = false) {
  const radios = $$<HTMLButtonElement>('[role="radio"]', group);
  radios.forEach((r) => {
    const on = r === btn;
    r.setAttribute('aria-checked', String(on));
    r.tabIndex = on ? 0 : -1;
  });
  if (focus) btn.focus();
  const key = group.dataset.group as 'trigger' | 'action';
  const value = btn.dataset.value!;
  const changed = state[key] !== value;
  (state as any)[key] = value;
  if (!reduced()) {
    animate(btn, { scale: [0.93, 1] }, POP);
    animate($('.choice-icon', btn), { rotate: [-14, 8, 0] }, { duration: 0.5, ease: 'easeOut' });
  }
  if (!changed) return;
  if (key === 'action' && heroSay) {
    heroSay.textContent = sayings[value as ActionId];
    if (!reduced()) {
      animate(heroSay, { scale: [0.6, 1], rotate: [-14, -6] }, POP);
      if (heroWally) animate(heroWally, { y: [-18, 0] }, { type: 'spring', stiffness: 420, damping: 9 });
    }
  }
  // on phones the film plays when step 3 opens; on bigger screens, right away
  if (!phoneMQ.matches) play();
}

$$('[role="radiogroup"]', board).forEach((group) => {
  const radios = $$<HTMLButtonElement>('[role="radio"]', group);
  group.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[role="radio"]');
    if (!btn) return;
    select(group, btn);
    // pointer taps on phones move straight on to the next step
    if (phoneMQ.matches && (e as MouseEvent).detail > 0) {
      const next = group.dataset.group === 'trigger' ? 2 : 3;
      setTimeout(() => goStep(next, false), reduced() ? 0 : 340);
    }
  });
  group.addEventListener('keydown', (e) => {
    const i = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let j = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (i + 1) % radios.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (i - 1 + radios.length) % radios.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = radios.length - 1;
    if (j < 0) return;
    e.preventDefault();
    select(group, radios[j], true);
  });
});

// ---------------- phone stepper ----------------
const stepBtns = $$<HTMLButtonElement>('.step-btn', board);
const prevBtn = $<HTMLButtonElement>('[data-prev]', board);
const nextBtn = $<HTMLButtonElement>('[data-next]', board);
const nextLabels = ['', 'Next: pick an action', 'Run it', 'Try another combo'];

function syncStepper() {
  board.dataset.step = String(state.step);
  stepBtns.forEach((b, i) => {
    if (i + 1 === state.step) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
    b.classList.toggle('is-done', i + 1 < state.step);
  });
  prevBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
  nextBtn.textContent = nextLabels[state.step];
}

function goStep(step: number, moveFocus = true) {
  state.step = step;
  syncStepper();
  const panel = $(`[data-panel="${step}"]`, board);
  if (!reduced() && phoneMQ.matches) {
    animate(panel, { opacity: [0, 1], x: [24, 0] }, SETTLE);
  }
  const top = board.getBoundingClientRect().top;
  if (phoneMQ.matches && (top < -4 || top > 90)) {
    board.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  if (moveFocus) {
    const title = $('.panel-title', panel);
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
  if (step === 3) play();
}

prevBtn.addEventListener('click', () => goStep(Math.max(1, state.step - 1)));
nextBtn.addEventListener('click', () => goStep(state.step === 3 ? 1 : state.step + 1));
stepBtns.forEach((b) => b.addEventListener('click', () => goStep(Number(b.dataset.goto))));
syncStepper();

$('[data-replay]', board).addEventListener('click', () => play());

// play the film once the board is on screen (desktop/tablet)
inView(
  board,
  () => {
    if (!phoneMQ.matches) play();
  },
  { amount: 0.35 },
);

// ---------------- copy ----------------
async function copy(text: string, btn: HTMLElement) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard can be blocked; the button still confirms the intent */
  }
  const prev = btn.textContent;
  btn.classList.add('is-done');
  btn.textContent = 'Copied!';
  if (!reduced()) animate(btn, { scale: [0.85, 1] }, POP);
  setTimeout(() => {
    btn.classList.remove('is-done');
    btn.textContent = prev;
  }, 1400);
}
$$('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy!, b)));
$('[data-copy-combo]', board).addEventListener('click', (e) => {
  const c = getCombo(state.trigger, state.action);
  copy(c.code.map((b) => b.code).join('\n\n'), e.currentTarget as HTMLElement);
});

// ---------------- four ways: flip cards ----------------
$$('.way').forEach((card) => {
  const btn = $<HTMLButtonElement>('.way-flip', card);
  const inner = $('.way-inner', card);
  const front = $('.way-front', card);
  const back = $('.way-back', card);
  const label = $('.way-flip-label', btn);
  const name = $('h3', card).textContent;
  btn.addEventListener('click', () => {
    const flipped = !card.classList.contains('is-flipped');
    card.classList.toggle('is-flipped', flipped);
    btn.setAttribute('aria-pressed', String(flipped));
    btn.setAttribute('aria-label', flipped ? `Show the ${name} card front` : `Show the code for ${name}`);
    label.textContent = flipped ? 'Flip back' : 'Flip for code';
    front.inert = flipped;
    back.inert = !flipped;
    if (reduced()) {
      inner.style.transform = '';
      return;
    }
    animate(inner, { rotateY: flipped ? [0, 180] : [180, 0] }, { type: 'spring', stiffness: 170, damping: 15 });
  });
});

// ---------------- numbers count up ----------------
$$('[data-count]').forEach((el) => {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || '';
  if (reduced()) return;
  inView(
    el,
    () => {
      animate(0, target, {
        duration: 1.4,
        ease: [0.2, 0.9, 0.3, 1.04],
        onUpdate: (v) => (el.textContent = `${Math.max(0, v).toFixed(decimals)}${suffix}`),
        onComplete: () => (el.textContent = `${target.toFixed(decimals)}${suffix}`),
      });
      animate(el, { scale: [0.8, 1] }, POP);
    },
    { amount: 0.6 },
  );
});

// ---------------- step cards: Wally hops in ----------------
if (!reduced()) {
  $$('.stepcard img, .sticker img, .way-front img').forEach((im) => {
    inView(
      im,
      () => {
        animate(im, { y: [36, 0], rotate: [-6, 0] }, { type: 'spring', stiffness: 260, damping: 14 });
      },
      { amount: 0.4 },
    );
  });
}

// ---------------- code tabs ----------------
const codeBox = $('.code', board);
function selectTab(tab: HTMLElement, focus = false) {
  const tabs = $$('[role="tab"]', codeBox);
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls')!);
    if (panel) panel.hidden = !on;
    if (on && panel && !reduced()) animate(panel, { y: [8, 0], opacity: [0.4, 1] }, SETTLE);
  });
  if (focus) tab.focus();
}
codeBox.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
  if (tab) selectTab(tab);
});
codeBox.addEventListener('keydown', (e) => {
  const tabs = $$('[role="tab"]', codeBox);
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  let j = -1;
  if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
  else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
  else if (e.key === 'Home') j = 0;
  else if (e.key === 'End') j = tabs.length - 1;
  if (j < 0) return;
  e.preventDefault();
  selectTab(tabs[j], true);
});
