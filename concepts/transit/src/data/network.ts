// open-wa network: every way of using open-wa is a line, every package or step a station.
// Coordinates live on an octilinear 10-unit grid inside a 1200 x 720 viewBox.

export const W = 1200;
export const H = 720;

export const QUICKSTART = 'https://openwa.dev/docs/getting-started/quickstart';
export const DOCS = 'https://openwa.dev/docs';
export const REFERENCE = 'https://openwa.dev/docs/reference/client/client';
export const LICENSED = 'https://openwa.dev/docs/licensing/licensed-features';
export const GITHUB = 'https://github.com/open-wa/wa-automate-nodejs';
export const DISCORD = 'https://discord.gg/dpan7EYE3t';

export type LineNo = 1 | 2 | 3 | 4 | 5;

export interface Line {
  n: LineNo;
  name: string;
  pattern: string;
  blurb: string;
  route: string;
}

export const LINES: Line[] = [
  { n: 1, name: 'Easy API', pattern: 'Solid', blurb: 'From one npx command to a sent message.', route: 'Start to Send' },
  { n: 2, name: 'SocketClient', pattern: 'Double track', blurb: 'Drive a running Easy API from another Node.js app.', route: 'Easy API to your Node.js app' },
  { n: 3, name: 'Embedded', pattern: 'Dashed core', blurb: 'Run the runtime inside your own process.', route: 'createClient to a browser driver' },
  { n: 4, name: 'Agent', pattern: 'Dotted core', blurb: 'Every Easy API method becomes an AI tool.', route: '/mcp to Claude, Cursor, Windsurf' },
  { n: 5, name: 'Integrations', pattern: 'Hollow', blurb: 'Bridge WhatsApp into the tools you already run.', route: 'Webhook to Node-RED' },
];

export type Place = 'top' | 'bottom' | 'left' | 'right' | 'tl' | 'bl';
export type Kind = 'stop' | 'interchange' | 'terminus';

export interface Station {
  id: string;
  name: string;
  tag?: string;
  x: number;
  y: number;
  place: Place;
  kind: Kind;
  lines: LineNo[];
  what: string;
  code?: string;
  chips?: string[];
  note?: string;
  doc: { label: string; href: string };
}

export const STATIONS: Station[] = [
  // Line 1, Easy API
  {
    id: 'start', name: 'Start', tag: 'npx', x: 80, y: 320, place: 'top', kind: 'terminus', lines: [1],
    what: 'One command runs the Easy API on your own machine or server. Prefer containers? The Docker image boards here too.',
    code: 'npx @open-wa/wa-automate@latest --port 8080\ndocker run -p 8080:8080 --init openwa/wa-automate',
    doc: { label: 'Quickstart', href: QUICKSTART },
  },
  {
    id: 'link', name: 'Link', tag: 'QR or link code', x: 250, y: 320, place: 'top', kind: 'stop', lines: [1],
    what: 'Log in by QR code or link code, once per named session. Name a session to run more than one.',
    code: 'npx @open-wa/wa-automate@latest --session-id sales --port 8081',
    doc: { label: 'Quickstart', href: QUICKSTART },
  },
  {
    id: 'hub', name: 'Easy API', tag: 'interchange', x: 450, y: 320, place: 'tl', kind: 'interchange', lines: [1, 2, 4, 5],
    what: 'A local HTTP API for your WhatsApp account. Lock it with an API key. Change here for SocketClient, Agent and Integrations.',
    code: 'npx @open-wa/wa-automate@latest --port 8080 --api-key "your-secure-key"',
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 'apidocs', name: '/api-docs/', tag: 'live docs', x: 690, y: 320, place: 'top', kind: 'stop', lines: [1],
    what: 'Live API docs served by your Easy API, with OpenAPI and Postman collections beside them.',
    code: 'http://localhost:8080/api-docs/\nhttp://localhost:8080/meta/swagger.json\nhttp://localhost:8080/meta/postman.json',
    doc: { label: 'Client API reference', href: REFERENCE },
  },
  {
    id: 'send', name: 'Send', tag: 'first message', x: 1060, y: 320, place: 'top', kind: 'terminus', lines: [1],
    what: 'POST to your API and the message leaves from your WhatsApp account.',
    code: 'curl -X POST http://localhost:8080/api/messages/sendText \\\n  -H "Content-Type: application/json" \\\n  -d \'{"to": "447123456789@c.us", "content": "Your order is ready to collect!"}\'',
    doc: { label: 'Send your first message', href: QUICKSTART },
  },
  // Line 4, Agent
  {
    id: 'mcp', name: '/mcp', tag: 'MCP server', x: 680, y: 170, place: 'top', kind: 'stop', lines: [4],
    what: 'A built-in Model Context Protocol server. Switch it on in wa.config.mjs.',
    code: "// wa.config.mjs: MCP\nexport default { apiKey: process.env.WA_API_KEY, port: 8080, mcp: { enabled: true, path: '/mcp' } };",
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 'ai', name: 'Claude / Cursor / Windsurf', tag: 'AI clients', x: 1060, y: 170, place: 'top', kind: 'terminus', lines: [4],
    what: 'Point your AI client at the MCP endpoint. Every Easy API method becomes a tool it can call.',
    code: 'http://localhost:8080/mcp',
    doc: { label: 'Docs', href: DOCS },
  },
  // Line 5, Integrations
  {
    id: 'webhook', name: 'Webhook', x: 630, y: 430, place: 'bottom', kind: 'stop', lines: [5],
    what: 'Integrations are plugins, set with plugins and pluginConfig in wa.config.*. Write your own with the plugin SDK.',
    chips: ['plugins', 'pluginConfig', 'wa.config.*', '@open-wa/plugin-sdk'],
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 'chatwoot', name: 'Chatwoot', x: 750, y: 430, place: 'bottom', kind: 'stop', lines: [5],
    what: 'Bridge WhatsApp into a Chatwoot helpdesk inbox.',
    chips: ['plugins', 'pluginConfig'],
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 's3', name: 'S3', x: 870, y: 430, place: 'bottom', kind: 'stop', lines: [5],
    what: 'The S3 integration, configured like every other plugin.',
    chips: ['plugins', 'pluginConfig'],
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 'cloudflare', name: 'Cloudflare', tag: 'session proxy', x: 990, y: 430, place: 'bottom', kind: 'stop', lines: [5],
    what: 'Remote access to a local session without opening public ports.',
    chips: ['plugins', 'pluginConfig'],
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 'nodered', name: 'Node-RED', x: 1100, y: 430, place: 'bottom', kind: 'terminus', lines: [5],
    what: 'Wire WhatsApp into Node-RED flows.',
    chips: ['plugins', 'pluginConfig'],
    doc: { label: 'Docs', href: DOCS },
  },
  // Line 2, SocketClient
  {
    id: 'connect', name: 'Connect', tag: 'SocketClient.connect', x: 360, y: 450, place: 'right', kind: 'stop', lines: [2],
    what: 'Connect another Node.js app to a running Easy API.',
    code: "import { SocketClient } from '@open-wa/socket-client';\n\nconst client = await SocketClient.connect('http://localhost:8080', 'your-secure-key');",
    doc: { label: 'Docs', href: DOCS },
  },
  {
    id: 'rpc', name: 'RPC + SSE', tag: 'commands and events', x: 360, y: 505, place: 'right', kind: 'stop', lines: [2],
    what: 'Commands travel as HTTP RPC. Events arrive over Server-Sent Events.',
    code: "client.onMessage(async (message) => {\n  if (message.body === 'Hi') await client.sendText(message.from, 'Hello!');\n});",
    doc: { label: 'Client API reference', href: REFERENCE },
  },
  {
    id: 'app', name: 'Your Node.js app', tag: 'interchange', x: 540, y: 600, place: 'bottom', kind: 'interchange', lines: [2, 3],
    what: 'Your own code. Reach a running Easy API through SocketClient, or change here to embed the runtime directly. Needs Node.js 22.21.1 or newer.',
    chips: ['Node.js 22.21.1+'],
    doc: { label: 'Quickstart', href: QUICKSTART },
  },
  // Line 3, Embedded
  {
    id: 'create', name: 'createClient', tag: 'embedded runtime', x: 690, y: 600, place: 'bottom', kind: 'stop', lines: [3],
    what: 'Run open-wa inside your own Node.js app, with a pluggable browser driver.',
    code: "import { createClient } from '@open-wa/wa-automate';\nimport { PuppeteerDriver } from '@open-wa/driver-puppeteer';\n\nconst client = await createClient({ sessionId: 'sales', driver: new PuppeteerDriver(), headless: true });",
    doc: { label: 'Client API reference', href: REFERENCE },
  },
  {
    id: 'driver', name: 'Driver', tag: 'junction', x: 840, y: 600, place: 'bl', kind: 'stop', lines: [3],
    what: 'The line splits three ways here: Puppeteer, Playwright or Lightpanda. Pass the one you want to createClient.',
    code: 'driver: new PuppeteerDriver()',
    doc: { label: 'Client API reference', href: REFERENCE },
  },
  {
    id: 'puppeteer', name: 'Puppeteer', x: 1000, y: 550, place: 'right', kind: 'terminus', lines: [3],
    what: 'Drive the session with Puppeteer.',
    code: "import { PuppeteerDriver } from '@open-wa/driver-puppeteer';",
    doc: { label: 'Client API reference', href: REFERENCE },
  },
  {
    id: 'playwright', name: 'Playwright', x: 1000, y: 600, place: 'right', kind: 'terminus', lines: [3],
    what: 'Drive the session with Playwright.',
    note: '[Playwright driver import: see the docs]',
    doc: { label: 'Client API reference', href: REFERENCE },
  },
  {
    id: 'lightpanda', name: 'Lightpanda', x: 1000, y: 650, place: 'right', kind: 'terminus', lines: [3],
    what: 'Drive the session with Lightpanda.',
    note: '[Lightpanda driver import: see the docs]',
    doc: { label: 'Client API reference', href: REFERENCE },
  },
];

export interface Track {
  id: string;
  line: LineNo;
  pts: [number, number][];
  after: [string, string] | null;
}

// Order matters: a track is listed after the track it branches from.
export const TRACKS: Track[] = [
  { id: 't1', line: 1, pts: [[80, 320], [1060, 320]], after: null },
  { id: 't4', line: 4, pts: [[450, 320], [450, 240], [520, 170], [1060, 170]], after: ['t1', 'hub'] },
  { id: 't5', line: 5, pts: [[450, 320], [560, 430], [1100, 430]], after: ['t1', 'hub'] },
  { id: 't2', line: 2, pts: [[450, 320], [360, 410], [360, 540], [420, 600], [540, 600]], after: ['t1', 'hub'] },
  { id: 't3', line: 3, pts: [[540, 600], [1000, 600]], after: ['t2', 'app'] },
  { id: 't3a', line: 3, pts: [[840, 600], [890, 550], [1000, 550]], after: ['t3', 'driver'] },
  { id: 't3b', line: 3, pts: [[840, 600], [890, 650], [1000, 650]], after: ['t3', 'driver'] },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Octilinear polyline to an SVG path with eased (quadratic) corners. */
export function trackPath(pts: [number, number][], radius = 26): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1];
    const [px, py] = pts[i];
    const [bx, by] = pts[i + 1];
    const la = Math.hypot(px - ax, py - ay);
    const lb = Math.hypot(bx - px, by - py);
    const r = Math.min(radius, la / 2, lb / 2);
    const p1 = [px - ((px - ax) / la) * r, py - ((py - ay) / la) * r];
    const p2 = [px + ((bx - px) / lb) * r, py + ((by - py) / lb) * r];
    d += ` L${r2(p1[0])} ${r2(p1[1])} Q${px} ${py} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  const last = pts[pts.length - 1];
  return d + ` L${last[0]} ${last[1]}`;
}

/** Length of the polyline and the fraction along it at which each station sits. */
export function trackStops(t: Track) {
  const segs: number[] = [];
  for (let i = 1; i < t.pts.length; i++) segs.push(Math.hypot(t.pts[i][0] - t.pts[i - 1][0], t.pts[i][1] - t.pts[i - 1][1]));
  const len = segs.reduce((a, b) => a + b, 0);
  const stops: [string, number][] = [];
  for (const s of STATIONS) {
    let acc = 0;
    for (let i = 1; i < t.pts.length; i++) {
      const [ax, ay] = t.pts[i - 1];
      const [bx, by] = t.pts[i];
      const d1 = Math.hypot(s.x - ax, s.y - ay);
      const d2 = Math.hypot(bx - s.x, by - s.y);
      if (Math.abs(d1 + d2 - segs[i - 1]) < 0.5) {
        stops.push([s.id, r2((acc + d1) / len * 1000) / 1000]);
        break;
      }
      acc += segs[i - 1];
    }
  }
  stops.sort((a, b) => a[1] - b[1]);
  return { len: Math.round(len), stops };
}

export interface Journey {
  id: string;
  want: string;
  legs: { line: LineNo; from: string; to: string }[];
  tip: string;
}

export const JOURNEYS: Journey[] = [
  {
    id: 'updates', want: 'send order, booking and delivery updates',
    legs: [{ line: 1, from: 'start', to: 'send' }],
    tip: 'No changes. Copy the curl at Send and swap in your own number and text.',
  },
  {
    id: 'bot', want: 'run a bot from another Node.js app',
    legs: [{ line: 1, from: 'start', to: 'hub' }, { line: 2, from: 'hub', to: 'app' }],
    tip: 'Keep the Easy API running, then connect to it with SocketClient.',
  },
  {
    id: 'embed', want: 'run WhatsApp inside my own process',
    legs: [{ line: 3, from: 'app', to: 'playwright' }],
    tip: 'Alight at whichever driver suits you: Puppeteer, Playwright or Lightpanda.',
  },
  {
    id: 'agent', want: 'give an AI agent a WhatsApp number',
    legs: [{ line: 1, from: 'start', to: 'hub' }, { line: 4, from: 'hub', to: 'ai' }],
    tip: 'Enable mcp in wa.config.mjs and every Easy API method becomes a tool.',
  },
  {
    id: 'helpdesk', want: 'bridge WhatsApp into my helpdesk',
    legs: [{ line: 1, from: 'start', to: 'hub' }, { line: 5, from: 'hub', to: 'chatwoot' }],
    tip: 'Integrations are plugins: set plugins and pluginConfig in wa.config.*.',
  },
  {
    id: 'remote', want: 'reach a local session from anywhere',
    legs: [{ line: 1, from: 'start', to: 'hub' }, { line: 5, from: 'hub', to: 'cloudflare' }],
    tip: 'The Cloudflare session proxy gives remote access without opening public ports.',
  },
];

/** Stations a leg passes through, in order, following the line's own station order. */
export function legStations(line: LineNo, from: string, to: string): string[] {
  const order: Record<LineNo, string[]> = {
    1: ['start', 'link', 'hub', 'apidocs', 'send'],
    2: ['hub', 'connect', 'rpc', 'app'],
    3: ['app', 'create', 'driver', 'playwright'],
    4: ['hub', 'mcp', 'ai'],
    5: ['hub', 'webhook', 'chatwoot', 's3', 'cloudflare', 'nodered'],
  };
  const o = order[line];
  return o.slice(o.indexOf(from), o.indexOf(to) + 1);
}

/** Station order for the phone line diagram. Branch stations are flagged. */
export const PHONE_ORDER: Record<LineNo, { id: string; branch?: boolean }[]> = {
  1: [{ id: 'start' }, { id: 'link' }, { id: 'hub' }, { id: 'apidocs' }, { id: 'send' }],
  2: [{ id: 'hub' }, { id: 'connect' }, { id: 'rpc' }, { id: 'app' }],
  3: [{ id: 'app' }, { id: 'create' }, { id: 'driver' }, { id: 'puppeteer', branch: true }, { id: 'playwright', branch: true }, { id: 'lightpanda', branch: true }],
  4: [{ id: 'hub' }, { id: 'mcp' }, { id: 'ai' }],
  5: [{ id: 'hub' }, { id: 'webhook' }, { id: 'chatwoot' }, { id: 's3' }, { id: 'cloudflare' }, { id: 'nodered' }],
};
