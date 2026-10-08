// One source of truth for the exploded drawing. The WebGL scene and the
// static SVG fallback are both built from these numbers, so they always match.

export type V3 = [number, number, number];

export interface Part {
  id: string;
  size: V3; // x, y, z
  pos: V3; // centre, layer-local (y = 0 is the layer base)
  lift?: number; // extra y in the fully exploded state
  kind?: 'plate' | 'detail' | 'cartridge' | 'block' | 'cell';
}

export interface Layer {
  id: string;
  name: string;
  yA: number; // assembled base
  yE: number; // exploded base
  parts: Part[];
}

export interface Callout {
  n: number;
  id: string;
  part: string;
  at: V3; // anchor as a fraction of the part size, from its centre
  side: 'left' | 'right';
  layer: number;
  title: string;
  note: string;
}

const cells: Part[] = [];
const heights = [0.3, 0.5, 0.3, 0.4, 0.3, 0.55, 0.3, 0.3, 0.45];
let k = 0;
for (const z of [-3, 0, 3]) {
  for (const x of [-3, 0, 3]) {
    const h = heights[k];
    cells.push({ id: `cell-${k}`, size: [2.3, h, 2.3], pos: [x, 1.1 + h / 2, z], kind: 'cell' });
    k++;
  }
}

export const CART = { size: [2.6, 0.44, 1.9] as V3, y: 0.35, dock: [4.4, 0] as [number, number], parkX: 8.5, parkZ: 2.65 };

export const LAYERS: Layer[] = [
  {
    id: 'phone',
    name: 'Linked phone',
    yA: 0,
    yE: 0,
    parts: [
      { id: 'phone-body', size: [4.4, 0.45, 8.6], pos: [0, 0.225, 0], kind: 'plate' },
      { id: 'phone-screen', size: [3.8, 0.05, 7.4], pos: [0, 0.475, 0.1], kind: 'detail' },
      { id: 'qr-a', size: [1.1, 0.06, 1.1], pos: [-1.0, 0.53, -1.7], kind: 'detail' },
      { id: 'qr-b', size: [1.1, 0.06, 1.1], pos: [1.0, 0.53, -1.7], kind: 'detail' },
      { id: 'qr-c', size: [1.1, 0.06, 1.1], pos: [-1.0, 0.53, 0.3], kind: 'detail' },
      { id: 'qr-a-i', size: [0.42, 0.06, 0.42], pos: [-1.0, 0.59, -1.7], kind: 'detail' },
      { id: 'qr-b-i', size: [0.42, 0.06, 0.42], pos: [1.0, 0.59, -1.7], kind: 'detail' },
      { id: 'qr-c-i', size: [0.42, 0.06, 0.42], pos: [-1.0, 0.59, 0.3], kind: 'detail' },
      { id: 'qr-d', size: [0.42, 0.06, 0.42], pos: [0.55, 0.53, 0.0], kind: 'detail' },
      { id: 'qr-e', size: [0.42, 0.06, 0.42], pos: [1.15, 0.53, 0.55], kind: 'detail' },
      { id: 'qr-f', size: [0.42, 0.06, 0.42], pos: [0.25, 0.53, 0.65], kind: 'detail' },
      { id: 'phone-btn', size: [1.4, 0.05, 0.36], pos: [0, 0.475, 3.6], kind: 'detail' },
    ],
  },
  {
    id: 'session',
    name: 'WhatsApp Web session',
    yA: 0.55,
    yE: 4.6,
    parts: [
      { id: 'session-plate', size: [10, 0.7, 8], pos: [0, 0.35, 0], kind: 'plate' },
      { id: 'tabbar', size: [10, 0.35, 1.2], pos: [0, 0.875, -3.4], kind: 'detail' },
      { id: 'tab', size: [2.6, 0.2, 0.9], pos: [-3.4, 1.15, -3.4], kind: 'detail' },
      { id: 'chatlist', size: [3.1, 0.12, 6.4], pos: [-3.3, 0.76, 0.65], kind: 'detail' },
      { id: 'bubble-a', size: [2.4, 0.14, 0.8], pos: [0.2, 0.77, -1.7], kind: 'detail' },
      { id: 'bubble-b', size: [2.6, 0.14, 0.8], pos: [2.9, 0.77, -0.3], kind: 'detail' },
      { id: 'bubble-c', size: [1.8, 0.14, 0.8], pos: [-0.1, 0.77, 1.1], kind: 'detail' },
      { id: 'composer', size: [6.0, 0.1, 0.8], pos: [1.6, 0.75, 3.3], kind: 'detail' },
      { id: 'drv-puppeteer', size: CART.size, pos: [CART.dock[0], CART.y, CART.dock[1]], kind: 'cartridge' },
      { id: 'drv-playwright', size: CART.size, pos: [CART.parkX, CART.y, -CART.parkZ], kind: 'cartridge' },
      { id: 'drv-lightpanda', size: CART.size, pos: [CART.parkX, CART.y, CART.parkZ], kind: 'cartridge' },
    ],
  },
  {
    id: 'core',
    name: 'Core runtime + schema registry',
    yA: 1.65,
    yE: 10.0,
    parts: [{ id: 'core-plate', size: [10, 1.1, 10], pos: [0, 0.55, 0], kind: 'plate' }, ...cells],
  },
  {
    id: 'surfaces',
    name: 'Surfaces',
    yA: 3.3,
    yE: 15.6,
    parts: [
      { id: 'surf-plate', size: [10, 0.35, 10], pos: [0, 0.175, 0], kind: 'plate' },
      { id: 'easy-api', size: [4.2, 1.4, 3.6], pos: [-2.5, 1.05, -2.7], lift: 1.3, kind: 'block' },
      { id: 'easy-api-port', size: [2.6, 0.2, 2.0], pos: [-2.5, 1.85, -2.7], lift: 1.3, kind: 'detail' },
      { id: 'socket', size: [3.0, 1.0, 3.0], pos: [2.8, 0.85, -2.8], lift: 2.1, kind: 'block' },
      { id: 'mcp', size: [2.2, 2.6, 2.2], pos: [1.3, 1.65, 0.1], lift: 2.7, kind: 'block' },
      { id: 'plugin-0', size: [2.4, 0.3, 2.4], pos: [-3.2, 0.5, 2.7], lift: 0.9, kind: 'block' },
      { id: 'plugin-1', size: [2.4, 0.3, 2.4], pos: [-3.2, 0.82, 2.7], lift: 1.45, kind: 'block' },
      { id: 'plugin-2', size: [2.4, 0.3, 2.4], pos: [-3.2, 1.14, 2.7], lift: 2.0, kind: 'block' },
      { id: 'cf-proxy', size: [3.8, 0.7, 1.8], pos: [3.7, 0.7, 2.9], lift: 1.5, kind: 'block' },
    ],
  },
];

export const CALLOUTS: Callout[] = [
  {
    n: 1, id: 'c-phone', part: 'phone-body', at: [0, 0, 0.5], side: 'left', layer: 0,
    title: 'Linked phone',
    note: 'Your WhatsApp account. Log in once per named session, by QR code or link code.',
  },
  {
    n: 2, id: 'c-session', part: 'session-plate', at: [-0.3, 0, 0.5], side: 'left', layer: 1,
    title: 'WhatsApp Web session',
    note: 'Runs in a browser you control. The driver swaps: Puppeteer, Playwright or Lightpanda.',
  },
  {
    n: 3, id: 'c-core', part: 'core-plate', at: [-0.3, 0, 0.5], side: 'left', layer: 2,
    title: 'Core runtime + schemas',
    note: 'createClient runs here, inside your own Node.js app, with Zod-based schemas behind each method.',
  },
  {
    n: 4, id: 'c-easy', part: 'easy-api', at: [-0.3, 0.5, 0.3], side: 'left', layer: 3,
    title: 'Easy API',
    note: 'A local HTTP API. Live docs at /api-docs/, OpenAPI at /meta/swagger.json.',
  },
  {
    n: 5, id: 'c-socket', part: 'socket', at: [0.5, 0, 0], side: 'right', layer: 3,
    title: 'SocketClient',
    note: 'Drive a running Easy API from another Node.js app: HTTP RPC for commands, SSE for events.',
  },
  {
    n: 6, id: 'c-plugins', part: 'plugin-1', at: [0, 0, 0.5], side: 'left', layer: 3,
    title: 'Webhooks + plugins',
    note: 'plugins and pluginConfig in wa.config.*. Write your own with @open-wa/plugin-sdk.',
  },
  {
    n: 7, id: 'c-mcp', part: 'mcp', at: [0.5, 0.2, 0], side: 'right', layer: 3,
    title: 'MCP server',
    note: 'Every Easy API method becomes a tool for Claude, Cursor or Windsurf, at /mcp.',
  },
  {
    n: 8, id: 'c-cf', part: 'cf-proxy', at: [0.5, 0, 0], side: 'right', layer: 3,
    title: 'Cloudflare proxy',
    note: 'Reach a local session remotely without opening public ports.',
  },
];

export const DRIVERS = [
  { id: 'drv-puppeteer', label: 'Puppeteer' },
  { id: 'drv-playwright', label: 'Playwright' },
  { id: 'drv-lightpanda', label: 'Lightpanda' },
];

// Camera: yaw 45°, pitch 30° (a 2:1 dimetric, flatter than true isometric so
// stacked plates overlap less).
export const PITCH = Math.PI / 6;
export const YAW = Math.PI / 4;

/** Orthographic projection to screen units (x right, y up). */
export function project([x, y, z]: V3, rot = 0): [number, number] {
  const c = Math.cos(rot), s = Math.sin(rot);
  const rx = x * c + z * s;
  const rz = -x * s + z * c;
  const sx = (rx - rz) * Math.SQRT1_2;
  const depth = (rx + rz) * Math.SQRT1_2;
  const sy = y * Math.cos(PITCH) - depth * Math.sin(PITCH);
  return [sx, sy];
}

export function partWorld(layer: Layer, p: Part, exploded: number, lift = exploded): V3 {
  const y = layer.yA + (layer.yE - layer.yA) * exploded;
  return [p.pos[0], y + p.pos[1] + (p.lift ?? 0) * lift, p.pos[2]];
}

export function corners(c: V3, s: V3): V3[] {
  const out: V3[] = [];
  for (const dx of [-0.5, 0.5]) for (const dy of [-0.5, 0.5]) for (const dz of [-0.5, 0.5])
    out.push([c[0] + dx * s[0], c[1] + dy * s[1], c[2] + dz * s[2]]);
  return out;
}

/** Projected bounds of the whole object in a given state. */
export function bounds(exploded: number, rot: number) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const L of LAYERS) for (const p of L.parts) {
    for (const c of corners(partWorld(L, p, exploded), p.size)) {
      const [sx, sy] = project(c, rot);
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
  }
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
