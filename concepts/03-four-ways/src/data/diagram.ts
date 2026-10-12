// Geometry for the system diagram, in two layouts: "wide" (desktop, left to
// right) and "tall" (phone, top to bottom). Each path lights a set of nodes
// and routes flow lines along a set of edges, in the order listed.
export type PathId = "easy-api" | "socket-client" | "embedded" | "mcp";

export interface Box { x: number; y: number; w: number; h: number; title: string; sub?: string }
export interface Edge { d: string; reverse?: boolean; label?: { x: number; y: number; text: string; anchor?: "start" | "middle" | "end" } }
export interface Layout {
  viewBox: string;
  phone: { x: number; y: number; w: number; h: number; labelX: number; labelY: number; anchor: "start" | "middle" };
  runtime: Box;
  boundary: { d: string; labelX: number; labelY: number };
  nodes: Record<"browser" | "api" | "mcp" | "app" | "http" | "agent", Box>;
  edges: Record<string, Edge>;
}

export const routes: Record<PathId, { nodes: string[]; edges: string[]; describe: string }> = {
  "easy-api": {
    nodes: ["phone", "runtime", "browser", "api", "http"],
    edges: ["phone", "browserApi", "apiHttp"],
    describe: "Easy API: your phone links to the open-wa runtime, which runs WhatsApp Web and serves an HTTP API on port 8080, with interactive docs, to any HTTP client.",
  },
  "socket-client": {
    nodes: ["phone", "runtime", "browser", "api", "app"],
    edges: ["phone", "browserApi", "rpc", "sse"],
    describe: "SocketClient: the runtime serves the Easy API, and your Node.js app connects to it, sending commands over HTTP RPC and receiving events as Server-Sent Events.",
  },
  embedded: {
    nodes: ["phone", "runtime", "browser", "app", "boundary"],
    edges: ["phone", "embedded"],
    describe: "Embedded runtime: your Node.js app calls createClient and runs the WhatsApp Web runtime inside its own process.",
  },
  mcp: {
    nodes: ["phone", "runtime", "browser", "api", "mcp", "agent"],
    edges: ["phone", "browserApi", "apiMcp", "mcpAgent"],
    describe: "MCP server: the runtime exposes each Easy API method as a tool at /mcp, and an AI agent such as Claude calls those tools.",
  },
};

export const wide: Layout = {
  viewBox: "0 0 620 400",
  phone: { x: 12, y: 36, w: 80, h: 136, labelX: 12, labelY: 200, anchor: "start" },
  runtime: { x: 128, y: 56, w: 230, h: 314, title: "open-wa runtime" },
  boundary: { d: "M116 14 H620 V122 H372 V386 H116 Z", labelX: 130, labelY: 40 },
  nodes: {
    browser: { x: 144, y: 98, w: 198, h: 64, title: "WhatsApp Web", sub: "Puppeteer or Playwright" },
    api: { x: 144, y: 188, w: 198, h: 62, title: "Easy API", sub: "HTTP :8080, /api-docs" },
    mcp: { x: 144, y: 276, w: 198, h: 62, title: "MCP server", sub: "/mcp" },
    app: { x: 436, y: 36, w: 176, h: 72, title: "Your Node.js app", sub: "bots, jobs, handlers" },
    http: { x: 436, y: 170, w: 176, h: 72, title: "Any HTTP client", sub: "curl, your backend" },
    agent: { x: 436, y: 290, w: 176, h: 72, title: "AI agent", sub: "Claude, Cursor, Windsurf" },
  },
  edges: {
    phone: { d: "M92 104 C 118 104, 118 130, 144 130" },
    browserApi: { d: "M243 162 V188" },
    apiMcp: { d: "M243 250 V276" },
    apiHttp: { d: "M342 219 C 392 219, 390 206, 436 206", label: { x: 390, y: 240, text: "REST", anchor: "middle" } },
    rpc: { d: "M342 210 C 400 210, 380 62, 436 62", label: { x: 384, y: 122, text: "RPC", anchor: "middle" } },
    sse: { d: "M342 230 C 414 230, 396 84, 436 84", reverse: true, label: { x: 412, y: 168, text: "SSE", anchor: "middle" } },
    embedded: { d: "M342 130 C 392 130, 388 72, 436 72", label: { x: 436, y: 136, text: "createClient()", anchor: "start" } },
    mcpAgent: { d: "M342 307 C 392 307, 390 326, 436 326", label: { x: 390, y: 298, text: "tools", anchor: "middle" } },
  },
};

export const tall: Layout = {
  viewBox: "0 0 360 548",
  phone: { x: 144, y: 8, w: 72, h: 112, labelX: 228, labelY: 52, anchor: "start" },
  runtime: { x: 40, y: 160, w: 280, h: 248, title: "open-wa runtime" },
  boundary: { d: "M2 146 H332 V420 H124 V540 H2 Z", labelX: 12, labelY: 138 },
  nodes: {
    browser: { x: 58, y: 198, w: 244, h: 58, title: "WhatsApp Web", sub: "in Puppeteer or Playwright" },
    api: { x: 58, y: 272, w: 244, h: 54, title: "Easy API", sub: "HTTP :8080, /api-docs" },
    mcp: { x: 58, y: 342, w: 244, h: 54, title: "MCP server", sub: "/mcp" },
    app: { x: 6, y: 452, w: 110, h: 80, title: "Your app", sub: "Node.js" },
    http: { x: 244, y: 452, w: 110, h: 80, title: "HTTP client", sub: "curl, backend" },
    agent: { x: 125, y: 452, w: 110, h: 80, title: "AI agent", sub: "Claude, Cursor" },
  },
  edges: {
    phone: { d: "M180 120 V198", label: { x: 190, y: 150, text: "QR or link code", anchor: "start" } },
    browserApi: { d: "M180 256 V272" },
    apiMcp: { d: "M180 326 V342" },
    apiHttp: { d: "M302 299 H338 V430 C 338 444, 300 438, 300 452" },
    rpc: { d: "M58 292 H30 V452" },
    sse: { d: "M58 306 H44 V452", reverse: true },
    embedded: { d: "M58 227 H16 V452" },
    mcpAgent: { d: "M180 396 V452" },
  },
};
