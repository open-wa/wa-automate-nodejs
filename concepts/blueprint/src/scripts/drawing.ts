// The hero: a WebGL exploded drawing of the open-wa runtime, scrubbed by scroll.
// three.js does the line rendering (EdgesGeometry -> fat LineSegments2, with a
// second dashed pass for hidden lines); GSAP ScrollTrigger owns the timeline.
import {
  WebGLRenderer, Scene, OrthographicCamera, Group, Mesh, BoxGeometry, EdgesGeometry,
  ShaderMaterial, Color, Vector3, Object3D, GreaterDepth,
} from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LAYERS, CALLOUTS, DRIVERS, CART, PITCH, YAW, bounds } from '../scene/parts';

gsap.registerPlugin(ScrollTrigger);

const SVGNS = 'http://www.w3.org/2000/svg';
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const vert = /* glsl */ `
  varying vec3 vN;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const frag = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uLeft; uniform vec3 uRight; uniform vec3 uInk; uniform vec3 uRed;
  uniform float uHi; uniform float uDpr;
  varying vec3 vN;
  void main() {
    vec3 n = normalize(vN);
    float t = max(n.y, 0.0), l = max(n.z, 0.0), r = max(n.x, 0.0);
    float s = t + l + r + 1e-4;
    vec3 col = (uTop * t + uLeft * l + uRight * r) / s;
    float d = (gl_FragCoord.x + gl_FragCoord.y) / (uDpr * 5.5);
    float w = abs(fract(d) - 0.5);
    float line = 1.0 - smoothstep(0.06, 0.15, w);
    float side = r / s;
    col = mix(col, mix(uInk, uRed, uHi), line * side * (0.22 + 0.45 * uHi));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export function initDrawing(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('.stage')!;
  const overlay = root.querySelector<SVGSVGElement>('svg.overlay')!;
  const titleCopy = root.querySelector<HTMLElement>('.title-copy')!;
  const hint = root.querySelector<HTMLElement>('.scroll-hint');
  const counter = root.querySelector<HTMLElement>('[data-counter]');
  const detail = root.querySelector<HTMLElement>('.detail');
  const items = CALLOUTS.map((c) => root.querySelector<HTMLElement>(`.callout[data-id="${c.id}"]`)!);
  const tags = DRIVERS.map((d) => root.querySelector<HTMLElement>(`.drv-tag[data-id="${d.id}"]`)!);

  const css = getComputedStyle(document.documentElement);
  const col = (v: string) => new Color(css.getPropertyValue(v).trim());
  const C = {
    top: col('--paper-hi'), left: col('--shade-1'), right: col('--shade-2'),
    ink: col('--ink'), pencil: col('--pencil'), red: col('--red'),
  };

  // ---------- renderer / camera
  const canvas = document.createElement('canvas');
  canvas.className = 'gl';
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const cam = new OrthographicCamera(-1, 1, 1, -1, 1, 400);
  cam.position.set(Math.cos(PITCH) * Math.sin(YAW), Math.sin(PITCH), Math.cos(PITCH) * Math.cos(YAW)).multiplyScalar(150);
  cam.lookAt(0, 0, 0);

  const world = new Group();
  scene.add(world);

  // ---------- state the timeline animates
  const S: Record<string, number> = { intro: 0, explode: 0, rot: 1, title: 1, dim: 0, lift: 0, wave: 0, tags: 0 };
  LAYERS.forEach((_, i) => (S[`hi${i}`] = 0));
  CALLOUTS.forEach((_, i) => (S[`co${i}`] = 0));

  type PartRec = { mesh: Mesh; geo: LineSegmentsGeometry; count: number; order: number; baseY: number; lift: number; cell: number };
  const partRecs: PartRec[] = [];
  const byId = new Map<string, Mesh>();
  const layerGroups: Group[] = [];
  const layerMats: { fill: ShaderMaterial; vis: LineMaterial; hid: LineMaterial }[] = [];
  let order = 0;

  LAYERS.forEach((L) => {
    const g = new Group();
    g.position.y = L.yA;
    world.add(g);
    layerGroups.push(g);
    const fill = new ShaderMaterial({
      vertexShader: vert, fragmentShader: frag,
      uniforms: {
        uTop: { value: C.top }, uLeft: { value: C.left }, uRight: { value: C.right },
        uInk: { value: C.ink }, uRed: { value: C.red }, uHi: { value: 0 }, uDpr: { value: dpr },
      },
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
    const vis = new LineMaterial({ color: C.ink.getHex(), linewidth: 1.35 });
    const hid = new LineMaterial({ color: C.ink.getHex(), linewidth: 1, transparent: true, opacity: 0.32, depthWrite: false });
    hid.dashed = true; hid.dashSize = 0.16; hid.gapSize = 0.12; hid.depthFunc = GreaterDepth;
    layerMats.push({ fill, vis, hid });

    let cellIdx = 0;
    for (const p of L.parts) {
      const box = new BoxGeometry(...p.size);
      const mesh = new Mesh(box, fill);
      mesh.position.set(...p.pos);
      const geo = new LineSegmentsGeometry().fromEdgesGeometry(new EdgesGeometry(box));
      const v = new LineSegments2(geo, vis);
      const h = new LineSegments2(geo, hid);
      h.computeLineDistances();
      v.renderOrder = 1; h.renderOrder = 2;
      mesh.add(v, h);
      g.add(mesh);
      byId.set(p.id, mesh);
      const count = (geo.attributes.instanceStart as unknown as { count: number }).count;
      partRecs.push({ mesh, geo, count, order: order++, baseY: p.pos[1], lift: p.lift ?? 0, cell: p.kind === 'cell' ? cellIdx++ : -1 });
    }
  });
  const N = partRecs.length;

  // anchors for leaders and driver tags
  const anchors = CALLOUTS.map((c) => {
    const L = LAYERS[c.layer];
    const p = L.parts.find((q) => q.id === c.part)!;
    const o = new Object3D();
    o.position.set(c.at[0] * p.size[0], c.at[1] * p.size[1], c.at[2] * p.size[2]);
    byId.get(c.part)!.add(o);
    return o;
  });
  const tagAnchors = DRIVERS.map((d) => {
    const o = new Object3D();
    o.position.set(0.2, CART.size[1] / 2, 0);
    byId.get(d.id)!.add(o);
    return o;
  });

  // ---------- overlay SVG: leaders, anchor dots, balloons
  const ov = CALLOUTS.map((c) => {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'ov');
    g.innerHTML = `<path class="ldr" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/><circle class="dot" r="2.8"/><g class="bal-a"><line/><circle r="10"/><text text-anchor="middle">${c.n}</text></g>`;
    overlay.appendChild(g);
    return {
      g,
      path: g.querySelector('path')!,
      dot: g.querySelector('circle.dot')!,
      bal: g.querySelector<SVGGElement>('g.bal-a')!,
      stub: g.querySelector('g.bal-a line')!,
      bc: g.querySelector('g.bal-a circle')!,
      bt: g.querySelector('g.bal-a text')!,
    };
  });

  // ---------- layout
  let W = 1, H = 1, phone = false, colW = 280, pad = 40, barH = 64, colL = 40, colR = 1000;
  const heights: number[] = items.map(() => 80);
  const bA = { desk: bounds(0, 0.38), phone: bounds(0, 0) };
  const bE = bounds(1, 0);

  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    phone = W < 820;
    renderer.setSize(W, H, false);
    overlay.setAttribute('viewBox', `0 0 ${W} ${H}`);
    pad = Math.max(24, W * 0.03);
    barH = (document.querySelector('.bar') as HTMLElement | null)?.offsetHeight ?? 64;
    colW = Math.min(300, Math.max(220, W * 0.2));
    root.style.setProperty('--col-w', `${colW}px`);
    items.forEach((li, i) => (heights[i] = li.offsetHeight || 80));
    dirty = true;
  }

  const tmp = new Vector3();
  function toPx(o: Object3D): [number, number] {
    o.getWorldPosition(tmp).project(cam);
    return [(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H];
  }

  // ---------- apply state to the scene and overlay
  let lastActive = -2;
  function apply() {
    const e = S.explode;
    const rotAmp = phone ? 0 : 0.38;
    world.rotation.y = S.rot * rotAmp;
    LAYERS.forEach((L, i) => {
      layerGroups[i].position.y = lerp(L.yA, L.yE, e);
      const hi = S[`hi${i}`];
      const m = layerMats[i];
      m.fill.uniforms.uHi.value = hi;
      const base = C.ink.clone().lerp(C.pencil, S.dim * (1 - hi) * 0.85);
      m.vis.color.copy(base.lerp(C.red, hi));
      m.hid.color.copy(m.vis.color);
      m.hid.opacity = lerp(0.3, 0.55, hi);
    });
    for (const r of partRecs) {
      const p = clamp((S.intro - (r.order / N) * 0.62) / 0.38);
      r.geo.instanceCount = p >= 1 ? Infinity : Math.ceil(p * r.count);
      r.mesh.visible = p > 0;
      (r.mesh.children[1] as Object3D).visible = p > 0.85;
      if (r.lift) r.mesh.position.y = r.baseY + r.lift * S.lift;
      if (r.cell >= 0) {
        const c = 0.12 + (r.cell / 8) * 0.76;
        r.mesh.position.y = r.baseY + 0.45 * Math.max(0, 1 - Math.abs(S.wave - c) / 0.14);
      }
    }

    // camera framing: assembled view -> exploded view
    const a = phone ? bA.phone : bA.desk;
    const fa = phone ? { fx: 0.5, fy: 0.66, w: 0.84 * W, h: 0.42 * H } : { fx: 0.7, fy: 0.54, w: 0.44 * W, h: 0.66 * H };
    const top = barH + (phone ? 64 : 18);
    const fe = phone
      ? { fx: 0.5, fy: (top + H * 0.66) / 2 / H, w: 0.92 * W, h: H * 0.66 - top }
      : { fx: 0.5, fy: (top + H - 76) / 2 / H, w: W - 2 * (colW + pad + 70), h: H - 76 - top };
    const ua = Math.max(a.w / fa.w, a.h / fa.h);
    const ue = Math.max(bE.w / fe.w, bE.h / fe.h);
    // label columns hug the exploded drawing
    const halfPx = (bE.w / ue) / 2;
    colL = Math.max(pad, W * fe.fx - halfPx - colW - 56);
    colR = Math.min(W - pad - colW, W * fe.fx + halfPx + 56);
    const t = e;
    const u = lerp(ua, ue, t);
    const cx = lerp(a.cx, bE.cx, t), cy = lerp(a.cy, bE.cy, t);
    const fx = lerp(fa.fx, fe.fx, t), fy = lerp(fa.fy, fe.fy, t);
    cam.left = cx - fx * W * u; cam.right = cam.left + W * u;
    cam.top = cy + fy * H * u; cam.bottom = cam.top - H * u;
    cam.updateProjectionMatrix();
    world.updateMatrixWorld(true);

    // title copy retracts as the drawing explodes
    titleCopy.style.opacity = String(S.title);
    titleCopy.style.transform = `translateY(${(1 - S.title) * -24}px)`;
    titleCopy.style.visibility = S.title < 0.02 ? 'hidden' : 'visible';
    if (hint) hint.style.opacity = String(clamp(S.title * 1.4 - 0.4) * clamp(S.intro * 2 - 1));
    root.style.setProperty('--explode', String(e));

    // callouts
    let active = -1;
    const pos = anchors.map(toPx);
    CALLOUTS.forEach((c, i) => {
      const p = S[`co${i}`];
      if (p > 0 && S[`hi${c.layer}`] > 0.5) active = i;
    });
    const ly: number[] = [];
    if (!phone) {
      for (const side of ['left', 'right'] as const) {
        const idx = CALLOUTS.map((c, i) => (c.side === side ? i : -1)).filter((i) => i >= 0).sort((x, y) => pos[x][1] - pos[y][1]);
        let last = barH + 16;
        for (const i of idx) { ly[i] = Math.max(pos[i][1] - 16, last); last = ly[i] + heights[i] + 14; }
        const over = last - (H - 70);
        if (over > 0) for (const i of idx) ly[i] -= over;
      }
    }
    CALLOUTS.forEach((c, i) => {
      const p = S[`co${i}`];
      const [ax, ay] = pos[i];
      const o = ov[i];
      const li = items[i];
      const isActive = i === active;
      o.g.classList.toggle('is-active', isActive);
      li.classList.toggle('is-active', isActive);
      li.classList.toggle('is-drawn', p > 0.5);
      o.dot.setAttribute('cx', ax.toFixed(1)); o.dot.setAttribute('cy', ay.toFixed(1));
      o.dot.style.opacity = p > 0.02 ? '1' : '0';
      if (!phone) {
        const left = c.side === 'left';
        const x = left ? colL : colR;
        const y = ly[i];
        const lx = left ? x + colW + 10 : x - 10;
        const kx = left ? lx + 30 : lx - 30;
        const yy = y + 15;
        o.path.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} L${kx.toFixed(1)} ${yy.toFixed(1)} L${lx.toFixed(1)} ${yy.toFixed(1)}`);
        o.path.setAttribute('stroke-dashoffset', String(1 - clamp(p / 0.6)));
        o.bal.style.display = 'none';
        li.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        const wipe = clamp((p - 0.5) / 0.5);
        li.style.clipPath = `inset(0 ${((1 - wipe) * 100).toFixed(1)}% 0 0)`;
        li.style.opacity = wipe > 0 ? '1' : '0';
      } else {
        o.path.setAttribute('d', '');
        const left = c.side === 'left';
        const bx = ax + (left ? -22 : 22), by = ay - 18;
        o.bal.style.display = p > 0.05 ? '' : 'none';
        o.stub.setAttribute('x1', ax.toFixed(1)); o.stub.setAttribute('y1', ay.toFixed(1));
        o.stub.setAttribute('x2', (bx + (left ? 7 : -7)).toFixed(1)); o.stub.setAttribute('y2', (by + 7).toFixed(1));
        o.bc.setAttribute('cx', bx.toFixed(1)); o.bc.setAttribute('cy', by.toFixed(1));
        o.bt.setAttribute('x', bx.toFixed(1)); o.bt.setAttribute('y', (by + 4).toFixed(1));
        li.style.transform = ''; li.style.clipPath = ''; li.style.opacity = '';
      }
    });
    if (active !== lastActive || (active < 0 && counter && counter.textContent === '00' && S.co7 > 0.99)) {
      lastActive = active;
      if (counter) counter.textContent = active >= 0 ? String(active + 1).padStart(2, '0') : S.co7 > 0.99 ? '08' : '00';
      if (detail) {
        const c = CALLOUTS[active];
        detail.classList.toggle('is-on', !!c);
        if (c) detail.innerHTML = `<span class="balloon">${c.n}</span><div><b>${c.title}</b><span>${c.note}</span></div>`;
      }
    }

    // driver tags follow the cartridges
    const docked = DRIVERS.reduce((best, d, i) => {
      const x = byId.get(d.id)!.position.x;
      return x < byId.get(DRIVERS[best].id)!.position.x ? i : best;
    }, 0);
    DRIVERS.forEach((d, i) => {
      const [x, y] = toPx(tagAnchors[i]);
      const el = tags[i];
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = String(S.tags);
      el.classList.toggle('is-docked', i === docked && byId.get(d.id)!.position.x < CART.dock[0] + 0.3);
    });
  }

  let dirty = true;
  let inView = true;
  function frame() {
    if (!inView || !dirty) return;
    dirty = false;
    apply();
    renderer.render(scene, cam);
  }
  const mark = () => { dirty = true; };

  resize();
  window.addEventListener('resize', () => { resize(); });
  gsap.ticker.add(frame);
  root.classList.add('is-live');

  // ---------- intro: the drawing drafts itself on load
  gsap.to(S, { intro: 1, duration: 2.6, ease: 'power1.inOut', delay: 0.2, onUpdate: mark });

  // ---------- scroll choreography
  const pup = byId.get('drv-puppeteer')!.position;
  const pw = byId.get('drv-playwright')!.position;
  const lp = byId.get('drv-lightpanda')!.position;
  const out = CART.parkX, park = CART.parkZ, dock = CART.dock[0], y0 = CART.y;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: mark,
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * 6)}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });
  tl.to(S, { title: 0, duration: 0.9, ease: 'power1.in' }, 0.4)
    .to(S, { explode: 1, rot: 0, duration: 2.4, ease: 'power2.inOut' }, 0.5)
    // 1 · phone
    .to(S, { hi0: 1, dim: 1, duration: 0.3 }, 3.0)
    .to(S, { co0: 1, duration: 0.8 }, 3.1)
    // 2 · session + driver swap
    .to(S, { hi0: 0, hi1: 1, duration: 0.3 }, 4.2)
    .to(S, { co1: 1, duration: 0.8 }, 4.3)
    .to(S, { tags: 1, duration: 0.3 }, 4.6);
  const swap = (t: number, outP: typeof pup, inP: typeof pup, toZ: number) => {
    tl.to(outP, { x: out, duration: 0.25, ease: 'power1.inOut' }, t)
      .to(outP, { z: toZ, duration: 0.32, ease: 'power1.inOut' }, t + 0.27)
      .to(outP, { y: y0 + 0.9, duration: 0.16, ease: 'power1.out' }, t + 0.27)
      .to(outP, { y: y0, duration: 0.16, ease: 'power1.in' }, t + 0.43)
      .to(inP, { z: 0, duration: 0.32, ease: 'power1.inOut' }, t + 0.27)
      .to(inP, { x: dock, duration: 0.25, ease: 'power1.inOut' }, t + 0.61);
  };
  swap(4.9, pup, pw, -park);
  swap(5.85, pw, lp, park);
  // 3 · core runtime + schemas
  tl.to(S, { hi1: 0, hi2: 1, duration: 0.3 }, 6.9)
    .to(S, { co2: 1, duration: 0.8 }, 7.0)
    .to(S, { wave: 1, duration: 1.1 }, 7.1)
    // 4–8 · surfaces lift off and get annotated
    .to(S, { hi2: 0, hi3: 1, duration: 0.3 }, 8.3)
    .to(S, { lift: 1, duration: 1.0, ease: 'power2.out' }, 8.3);
  [3, 4, 5, 6, 7].forEach((ci, k) => tl.to(S, { [`co${ci}`]: 1, duration: 0.6 }, 8.7 + k * 0.38));
  tl.to(S, { hi3: 0, dim: 0, duration: 0.4 }, 11.0).to(S, { duration: 0.6 }, 11.4);

  // Pause rendering while the drawing is offscreen. Observe after pinning, since
  // the pin re-parents the section into a spacer.
  new IntersectionObserver((es) => {
    inView = es[es.length - 1].isIntersecting;
    if (inView) dirty = true;
  }, { rootMargin: '120px' }).observe(root);
  void lp;
  return { refresh: () => ScrollTrigger.refresh() };
}
