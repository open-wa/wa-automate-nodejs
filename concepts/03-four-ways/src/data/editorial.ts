// Editorial groupings of fact-pack content. Titles are ours; every description
// is the fact pack's own text.
import { capabilities, useCases, commands } from "./site";

export const capabilityList = [
  { id: "messages", title: "Messages", text: capabilities.messages, methods: ["sendText", "onMessage"] },
  { id: "media", title: "Media", text: capabilities.media },
  { id: "groups", title: "Groups", text: capabilities.groups, methods: ["createGroup", "joinGroupViaLink"] },
  { id: "polls", title: "Polls", text: capabilities.polls },
  { id: "events", title: "Event cards", text: capabilities.events, methods: ["sendEvent", "onEventResponse"] },
  { id: "stickers", title: "Stickers", text: "Render WebP stickers locally with @open-wa/stickers: 62 recipes, with resources loaded only when used." },
  { id: "multiSession", title: "Multiple sessions", text: capabilities.multiSession },
  { id: "sessions", title: "Portable sessions", text: capabilities.sessions },
  { id: "refresh", title: "Live refresh", text: capabilities.refresh, methods: ["client.refresh()"] },
  { id: "drivers", title: "Browser drivers", text: capabilities.drivers },
  { id: "docs", title: "Generated API docs", text: capabilities.docs, methods: ["/api-docs/", "/meta/swagger.json"] },
];

export const useCaseList = [
  { text: useCases[0], paths: ["Easy API", "Chatwoot"] },
  { text: useCases[1], paths: ["Easy API", "SocketClient"] },
  { text: useCases[2], paths: ["SocketClient", "Embedded"] },
  { text: useCases[3], paths: ["Webhooks", "Node-RED"] },
  { text: useCases[4], paths: ["sessionId", "SocketClient"] },
  { text: useCases[5], paths: ["MCP server"] },
];

export const wayTable = [
  { id: "easy-api", name: "Easy API", runs: "open-wa runs as its own process and serves an HTTP API on the port you choose.", code: "Anything that speaks HTTP.", start: commands.easyApi },
  { id: "socket-client", name: "SocketClient", runs: "An Easy API instance runs separately; your Node.js app connects to it as a remote consumer.", code: "Node.js with @open-wa/socket-client.", start: commands.socketClientInstall },
  { id: "embedded", name: "Embedded runtime", runs: "The runtime and its browser run inside your own Node.js process.", code: "Node.js with createClient.", start: commands.embeddedInstall },
  { id: "mcp", name: "MCP server", runs: "An Easy API instance with the MCP server turned on at /mcp.", code: "None. Your agent calls the tools.", start: commands.mcpEndpoint },
];
