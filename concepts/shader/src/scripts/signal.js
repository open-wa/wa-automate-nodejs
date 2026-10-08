// Signal: one source (your server) fanning out to many endpoints (chats).
// Hand-written WebGL1 fragment shader on a single full-screen triangle.
// No library: the whole renderer is this file.

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_src;    // source, canvas px (y up)
uniform float u_len;    // px from source to endpoints
uniform float u_wid;    // px half-width of the fan at the endpoints
uniform float u_trunk;  // px of inbound trunk behind the source
uniform float u_vert;   // 0 = flows right, 1 = flows down
uniform vec3  u_ptr;    // pointer px + strength
uniform float u_intro;  // 0..1 draw-on
uniform float u_boost;  // seconds since the last "send all"
uniform float u_px;     // canvas px per css px
uniform float u_fade;   // scroll fade

const float H = 7.0;    // lanes per side: 15 endpoints

const vec3 BG    = vec3(0.047, 0.055, 0.106);
const vec3 INDIGO= vec3(0.20, 0.17, 0.46);
const vec3 LANE  = vec3(0.56, 0.53, 0.92);
const vec3 EMBER = vec3(1.00, 0.62, 0.42);
const vec3 LILAC = vec3(0.66, 0.61, 1.00);
const vec3 ICE   = vec3(0.56, 0.83, 1.00);

float hash(float n){ return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
float hash2(vec2 q){ return fract(sin(dot(q, vec2(41.3, 289.1))) * 43758.5453); }

vec2 flow(vec2 d){ return mix(d, vec2(-d.y, d.x), u_vert); }

vec3 signalColor(float x){
  x = clamp(x, 0.0, 1.0);
  return x < 0.5 ? mix(EMBER, LILAC, x * 2.0) : mix(LILAC, ICE, x * 2.0 - 1.0);
}

float spread(float x){ return u_wid * (0.015 + 0.985 * smoothstep(0.0, 0.9, x)); }

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 d = frag - u_src;
  float r = length(d);

  // pointer lens: lanes swell gently under the cursor
  vec2 f  = flow(d);
  vec2 pf = flow(u_ptr.xy - u_src);
  vec2 dp = f - pf;
  float rad = 110.0 * u_px;
  float lens = u_ptr.z * exp(-dot(dp, dp) / (2.0 * rad * rad));
  f = pf + dp * (1.0 - 0.3 * lens);

  float a = f.x;
  float c = f.y;
  float x = a / u_len;

  // ---- ground
  vec3 col = BG;
  col += INDIGO * 0.55 * exp(-r / (380.0 * u_px));
  col += INDIGO * 0.18 * exp(-abs(c) / (u_wid * 1.2)) * smoothstep(-0.1, 0.4, x) * (1.0 - smoothstep(0.8, 1.4, x));

  // wavefronts leaving the source
  float wave = pow(max(0.0, sin(r / (26.0 * u_px) - u_time * 1.5)), 14.0);
  col += LILAC * wave * 0.07 * exp(-r / (300.0 * u_px)) * u_intro;

  // ---- lanes
  float sp = spread(x);
  float t  = c / sp * H;
  float li = clamp(floor(t + 0.5), -H, H);
  float k  = clamp(x / 0.9, 0.0, 1.0);
  float slope = li / H * 6.0 * k * (1.0 - k) * u_wid * 0.985 / (0.9 * u_len);
  float dl = abs(t - li) * sp / H / sqrt(1.0 + slope * slope);

  float drawn  = (1.0 - smoothstep(u_intro * 1.12 - 0.06, u_intro * 1.12, x));
  float inFan  = step(0.0, a) * (1.0 - smoothstep(1.0, 1.0 + 4.0 * u_px / u_len, x)) * drawn;

  float pt = pf.y / spread(pf.x / u_len) * H;
  float hl = u_ptr.z * exp(-pow(li - pt, 2.0) * 0.5) * step(-0.05, pf.x / u_len) * step(pf.x / u_len, 1.08);

  float w = 0.75 * u_px;
  float line = exp(-dl * dl / (w * w));
  float laneAlpha = (0.16 + 0.10 * smoothstep(0.0, 0.5, x) + 0.42 * hl) * inFan;
  col += mix(LANE, signalColor(x), 0.35 + 0.5 * hl) * line * laneAlpha;

  // ---- packets
  float h    = hash(li + 11.0);
  float rate = 0.16 + 0.2 * h + 0.10 * u_fade;
  float T    = u_time * rate + h * 5.3;
  float xh   = fract(T) * 1.7 - 0.05;
  float on   = step(0.3, hash2(vec2(li, floor(T))));
  float bh   = xh - x;
  float hp   = 2.0 * u_px;
  float tail = smoothstep(-hp, hp, bh * u_len) * exp(-max(bh, 0.0) * 13.0) * on;
  float head = exp(-(bh * u_len * bh * u_len + dl * dl) / (9.0 * u_px * u_px)) * on;
  float halo = exp(-length(vec2(bh * u_len, dl)) / (7.0 * u_px)) * on;

  float tb   = u_boost * 0.9 - hash(li + 3.0) * 0.12;
  float bb   = tb - x;
  float liveB = step(tb, 1.25) * step(0.0, tb);
  float tailB = smoothstep(-hp, hp, bb * u_len) * exp(-max(bb, 0.0) * 10.0) * liveB;
  head = max(head, exp(-(bb * u_len * bb * u_len + dl * dl) / (9.0 * u_px * u_px)) * liveB);
  halo = max(halo, exp(-length(vec2(bb * u_len, dl)) / (7.0 * u_px)) * liveB);
  float pk = max(tail, tailB) * inFan;
  head *= inFan;
  halo *= inFan;

  float core = exp(-dl * dl / (1.3 * u_px * 1.3 * u_px));
  float taper = max(tail * smoothstep(0.0, 14.0 * u_px, bh * u_len), tailB * smoothstep(0.0, 14.0 * u_px, bb * u_len)) * inFan;
  float glow = exp(-dl / (7.0 * u_px)) * 0.35;
  col += signalColor(x) * (pk * core * 1.6 + taper * glow) * (1.0 + 0.6 * hl);
  col += mix(signalColor(x), vec3(1.0), 0.5) * head * 1.3 + signalColor(x) * halo * 0.3;

  // ---- endpoints
  vec2 node = vec2(u_len, li / H * u_wid);
  float dn  = length(vec2(a, c) - node);
  float arr = (xh - 1.0);
  float flash = on * step(0.0, arr) * exp(-arr * 7.0);
  float arrB = tb - 1.0;
  flash = max(flash, step(0.0, arrB) * exp(-arrB * 5.0) * step(arrB, 1.0));
  float ready = smoothstep(0.9, 1.0, u_intro);
  float rr = 3.6 * u_px;
  float ring = exp(-pow(dn - rr, 2.0) / (0.7 * u_px * 0.7 * u_px));
  float fill = exp(-dn * dn / (2.4 * u_px * 2.4 * u_px));
  float ripR = rr + (1.0 - flash) * min(22.0 * u_px, 0.47 * u_wid / H - rr - 1.5 * u_px);
  float ripple = exp(-pow(dn - ripR, 2.0) / (1.0 * u_px * u_px)) * flash * 0.6;
  col += (LANE * ring * (0.45 + 0.4 * hl) + ICE * (fill * flash * 1.4 + ripple)) * ready;

  // ---- inbound trunk (requests arriving at your server)
  float xt  = a / max(u_trunk, 1.0);
  float inT = step(a, 0.0) * smoothstep(-1.0, -0.55, xt);
  float dtr = abs(c);
  float tl  = exp(-dtr * dtr / (w * w)) * 0.22 * inT;
  float Tt  = u_time * 0.42;
  float xht = fract(Tt) * 1.5 - 1.0;
  float bt  = xht - xt;
  float pkt = step(0.0, bt) * exp(-max(bt, 0.0) * 9.0) * inT * step(xht, 0.05);
  col += LILAC * tl + EMBER * pkt * (exp(-dtr * dtr / (1.3 * u_px * 1.3 * u_px)) * 1.4 + exp(-dtr / (6.0 * u_px)) * 0.3);

  // ---- source core
  float pulse = 1.0 + 0.25 * sin(u_time * 2.2) + 0.8 * exp(-u_boost * 3.0);
  col += EMBER * (exp(-r / (4.0 * u_px)) * 1.2 + exp(-r / (34.0 * u_px)) * 0.22 * pulse) * u_intro;
  col += vec3(1.0, 0.92, 0.86) * exp(-r * r / (3.0 * u_px * 3.0 * u_px)) * u_intro;

  // ---- finish
  col = mix(col, BG, u_fade * 0.55);
  col = col / (1.0 + col * 0.12);
  col += (hash2(frag + fract(u_time) * 91.0) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function initSignal(hero) {
  const canvas = hero.querySelector('canvas');
  const stage = hero.querySelector('[data-stage]');
  if (!canvas || !stage) return null;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 760px)');

  let gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
  } catch (e) { gl = null; }
  if (!gl) { hero.dataset.gl = 'off'; return null; }

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { hero.dataset.gl = 'off'; return null; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.dataset.gl = 'off'; return null; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  for (const n of ['res', 'time', 'src', 'len', 'wid', 'trunk', 'vert', 'ptr', 'intro', 'boost', 'px', 'fade']) {
    U[n] = gl.getUniformLocation(prog, 'u_' + n);
  }

  // ---- geometry from the stage element
  let scale = 1;
  let geo = { sx: 0, sy: 0, len: 1, wid: 1, trunk: 1, vert: 0 };
  let heroH = 1;

  function measure() {
    const hr = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const isPhone = phone.matches;
    const dpr = window.devicePixelRatio || 1;
    // DPR cap: 1.5 on desktop, ~0.8x of that on phones. Cap total pixels too.
    scale = isPhone ? Math.min(dpr, 1.5) * 0.75 : Math.min(dpr, 1.5);
    const maxPx = isPhone ? 600_000 : 2_400_000;
    if (hr.width * hr.height * scale * scale > maxPx) scale = Math.sqrt(maxPx / (hr.width * hr.height));
    const w = Math.max(1, Math.round(hr.width * scale));
    const h = Math.max(1, Math.round(hr.height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const left = sr.left - hr.left;
    const top = sr.top - hr.top;
    if (isPhone) {
      geo = {
        sx: left + sr.width * 0.5, sy: top + sr.height * 0.08,
        len: sr.height * 0.84, wid: sr.width * 0.42, trunk: sr.height * 0.08, vert: 1,
      };
    } else {
      geo = {
        sx: left + sr.width * 0.06, sy: top + sr.height * 0.5,
        len: sr.width * 0.86, wid: sr.height * 0.42, trunk: sr.width * 0.06 + 56, vert: 0,
      };
    }
    heroH = hr.height;
    gl.viewport(0, 0, w, h);
  }

  // ---- interaction state
  const ptr = { x: -9999, y: -9999, z: 0, tz: 0 };
  let boostAt = -100;
  let fade = 0;

  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = canvas.getBoundingClientRect();
    ptr.x = e.clientX - r.left;
    ptr.y = e.clientY - r.top;
    ptr.tz = 1;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { ptr.tz = 0; });
  stage.addEventListener('pointerdown', () => boost());

  const onScroll = () => { fade = Math.min(1, Math.max(0, window.scrollY / (heroH * 0.9))); };
  window.addEventListener('scroll', onScroll, { passive: true });

  const start = performance.now();
  let introStart = start;
  let running = false;
  let raf = 0;
  let last = 0;
  let ready = false;

  function draw(now, still) {
    const t = still ? 6.4 : (now - start) / 1000;
    const intro = still ? 1 : Math.min(1, (now - introStart) / 1600);
    const ease = 1 - Math.pow(1 - intro, 3);
    ptr.z += (ptr.tz - ptr.z) * (still ? 1 : 0.08);
    const H = canvas.height;
    gl.uniform2f(U.res, canvas.width, H);
    gl.uniform1f(U.time, t);
    gl.uniform2f(U.src, geo.sx * scale, H - geo.sy * scale);
    gl.uniform1f(U.len, geo.len * scale);
    gl.uniform1f(U.wid, geo.wid * scale);
    gl.uniform1f(U.trunk, geo.trunk * scale);
    gl.uniform1f(U.vert, geo.vert);
    gl.uniform3f(U.ptr, ptr.x * scale, H - ptr.y * scale, ptr.z);
    gl.uniform1f(U.intro, ease);
    gl.uniform1f(U.boost, still ? 100 : (now - boostAt) / 1000);
    gl.uniform1f(U.px, scale);
    gl.uniform1f(U.fade, fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!ready) { ready = true; hero.dataset.gl = 'on'; }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    // phones: 30fps is plenty for an ambient field
    const minDt = phone.matches ? 32 : 0;
    if (now - last < minDt) return;
    last = now;
    draw(now, false);
  }

  function play() {
    if (running || reduce.matches) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(raf);
  }
  function still() { measure(); draw(performance.now(), true); }

  function boost() {
    if (reduce.matches) return;
    boostAt = performance.now();
  }

  measure();
  onScroll();
  if (reduce.matches) still();

  // Pause offscreen. Deliberately not gated on document.visibilityState.
  let seen = false;
  const io = new IntersectionObserver((entries) => {
    seen = true;
    for (const e of entries) e.isIntersecting ? play() : pause();
  }, { threshold: 0 });
  io.observe(hero);
  // In case the observer never reports (some hosts), start anyway.
  setTimeout(() => { if (!seen && !reduce.matches) play(); }, 600);

  let rt = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(rt);
    rt = requestAnimationFrame(() => { measure(); if (reduce.matches) draw(performance.now(), true); });
  });
  ro.observe(hero);
  ro.observe(stage);

  reduce.addEventListener?.('change', () => { if (reduce.matches) { pause(); still(); } else { introStart = performance.now(); play(); } });

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); pause(); hero.dataset.gl = 'off'; });

  return { boost };
}
