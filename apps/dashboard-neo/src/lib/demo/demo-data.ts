/**
 * Demo Data Factory
 *
 * Provides realistic mock data for the entire dashboard when ?demo=true.
 * All data is static/deterministic — no randomness on each render.
 */

// ─── Helpers ─────────────────────────────────────────────────────
const now = Date.now()
const ago = (mins: number) => now - mins * 60_000
const tsAgo = (mins: number) => Math.floor(ago(mins) / 1000)

// ─── Session ─────────────────────────────────────────────────────
export const demoSession = {
  connected: true,
  hostNumber: "+1 (234) 567-8901",
  waVersion: "2.2506.12",
  battery: 87,
  connectionState: "CONNECTED",
  uptime: 14523,
}

// ─── Contacts ────────────────────────────────────────────────────
export const demoContacts = [
  { id: "12345678901@c.us", name: "Alice Johnson", pushname: "Alice", shortName: "Alice", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Alice Johnson", type: "in" },
  { id: "12345678902@c.us", name: "Bob Martinez", pushname: "Bobby", shortName: "Bob", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Bob Martinez", type: "in" },
  { id: "12345678903@c.us", name: "Carol Wei", pushname: "Carol", shortName: "Carol", isBusiness: true, isMyContact: true, isWAContact: true, formattedName: "Carol Wei", type: "in" },
  { id: "12345678904@c.us", name: "David Okonkwo", pushname: "Dave", shortName: "Dave", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "David Okonkwo", type: "in" },
  { id: "12345678905@c.us", name: "Elena Petrova", pushname: "Elena", shortName: "Elena", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Elena Petrova", type: "in" },
  { id: "12345678906@c.us", name: "Fatima Al-Rashid", pushname: "Fatima", shortName: "Fatima", isBusiness: true, isMyContact: true, isWAContact: true, formattedName: "Fatima Al-Rashid", type: "in" },
  { id: "12345678907@c.us", name: "George Kim", pushname: "George", shortName: "George", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "George Kim", type: "in" },
  { id: "12345678908@c.us", name: "Hannah Schmidt", pushname: "Hannah", shortName: "Hannah", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Hannah Schmidt", type: "in" },
  { id: "12345678909@c.us", name: "Ibrahim Diallo", pushname: "Ibrahim", shortName: "Ibrahim", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Ibrahim Diallo", type: "in" },
  { id: "12345678910@c.us", name: "Julia Santos", pushname: "Julia", shortName: "Julia", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Julia Santos", type: "in" },
  { id: "12345678911@c.us", name: "Karim Nasser", pushname: "Karim", shortName: "Karim", isBusiness: true, isMyContact: true, isWAContact: true, formattedName: "Karim Nasser", type: "in" },
  { id: "12345678912@c.us", name: "Lisa Andersson", pushname: "Lisa", shortName: "Lisa", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Lisa Andersson", type: "in" },
  { id: "12345678913@c.us", name: "Mohammed Aref", pushname: "Mo", shortName: "Mo", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Mohammed Aref", type: "in" },
  { id: "12345678914@c.us", name: "Nina Tanaka", pushname: "Nina", shortName: "Nina", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Nina Tanaka", type: "in" },
  { id: "12345678915@c.us", name: "Oscar Reyes", pushname: "Oscar", shortName: "Oscar", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Oscar Reyes", type: "in" },
  { id: "12345678916@c.us", name: "Priya Sharma", pushname: "Priya", shortName: "Priya", isBusiness: true, isMyContact: true, isWAContact: true, formattedName: "Priya Sharma", type: "in" },
  { id: "12345678917@c.us", name: "Rami Khalil", pushname: "Rami", shortName: "Rami", isBusiness: false, isMyContact: false, isWAContact: true, formattedName: "Rami Khalil", type: "in" },
  { id: "12345678918@c.us", name: "Sophie Laurent", pushname: "Sophie", shortName: "Sophie", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Sophie Laurent", type: "in" },
  { id: "12345678919@c.us", name: "Tariq bin Salman", pushname: "Tariq", shortName: "Tariq", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Tariq bin Salman", type: "in" },
  { id: "12345678920@c.us", name: "Uma Patel", pushname: "Uma", shortName: "Uma", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Uma Patel", type: "in" },
  { id: "12345678921@c.us", name: "Viktor Ivanov", pushname: "Vik", shortName: "Vik", isBusiness: false, isMyContact: false, isWAContact: true, formattedName: "Viktor Ivanov", type: "in" },
  { id: "12345678922@c.us", name: "Wendy O'Brien", pushname: "Wendy", shortName: "Wendy", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Wendy O'Brien", type: "in" },
  { id: "12345678923@c.us", name: "Xia Chen", pushname: "Xia", shortName: "Xia", isBusiness: true, isMyContact: true, isWAContact: true, formattedName: "Xia Chen", type: "in" },
  { id: "12345678924@c.us", name: "Youssef Mansour", pushname: "Youssef", shortName: "Youssef", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Youssef Mansour", type: "in" },
  { id: "12345678925@c.us", name: "Zara Williams", pushname: "Zara", shortName: "Zara", isBusiness: false, isMyContact: true, isWAContact: true, formattedName: "Zara Williams", type: "in" },
]

// ─── Chats ───────────────────────────────────────────────────────
export const demoChats = [
  { id: "12345678901@c.us", name: "Alice Johnson", isGroup: false, unreadCount: 3, t: tsAgo(2), lastMessage: { body: "Hey, are you coming to the meeting?", timestamp: tsAgo(2) } },
  { id: "12345678902@c.us", name: "Bob Martinez", isGroup: false, unreadCount: 0, t: tsAgo(15), lastMessage: { body: "Got it, thanks!", timestamp: tsAgo(15) } },
  { id: "120363001234567890@g.us", name: "🚀 open-wa Dev Team", isGroup: true, unreadCount: 12, t: tsAgo(1), lastMessage: { body: "The new build is passing!", timestamp: tsAgo(1) } },
  { id: "12345678903@c.us", name: "Carol Wei", isGroup: false, unreadCount: 0, t: tsAgo(45), lastMessage: { body: "Invoice attached 📎", timestamp: tsAgo(45) } },
  { id: "120363009876543210@g.us", name: "📊 Analytics Team", isGroup: true, unreadCount: 5, t: tsAgo(8), lastMessage: { body: "Q1 report is ready for review", timestamp: tsAgo(8) } },
  { id: "12345678904@c.us", name: "David Okonkwo", isGroup: false, unreadCount: 1, t: tsAgo(30), lastMessage: { body: "Can you send the API docs link?", timestamp: tsAgo(30) } },
  { id: "12345678905@c.us", name: "Elena Petrova", isGroup: false, unreadCount: 0, t: tsAgo(120), lastMessage: { body: "See you tomorrow! 👋", timestamp: tsAgo(120) } },
  { id: "120363005555555555@g.us", name: "🏠 Family Group", isGroup: true, unreadCount: 0, t: tsAgo(60), lastMessage: { body: "Dinner at 7pm?", timestamp: tsAgo(60) } },
  { id: "12345678906@c.us", name: "Fatima Al-Rashid", isGroup: false, unreadCount: 2, t: tsAgo(5), lastMessage: { body: "The new pricing looks good", timestamp: tsAgo(5) } },
  { id: "12345678907@c.us", name: "George Kim", isGroup: false, unreadCount: 0, t: tsAgo(180), lastMessage: { body: "Happy birthday! 🎂", timestamp: tsAgo(180) } },
  { id: "120363002222222222@g.us", name: "⚽ Weekend Football", isGroup: true, unreadCount: 8, t: tsAgo(3), lastMessage: { body: "Game is at 3pm Saturday", timestamp: tsAgo(3) } },
  { id: "12345678908@c.us", name: "Hannah Schmidt", isGroup: false, unreadCount: 0, t: tsAgo(240), lastMessage: { body: "Forwarded a contact", timestamp: tsAgo(240) } },
  { id: "12345678909@c.us", name: "Ibrahim Diallo", isGroup: false, unreadCount: 0, t: tsAgo(360), lastMessage: { body: "📍 Location shared", timestamp: tsAgo(360) } },
  { id: "120363003333333333@g.us", name: "🛠 Bug Reports", isGroup: true, unreadCount: 3, t: tsAgo(10), lastMessage: { body: "Issue #42 is fixed in main", timestamp: tsAgo(10) } },
  { id: "12345678910@c.us", name: "Julia Santos", isGroup: false, unreadCount: 0, t: tsAgo(480), lastMessage: { body: "That's hilarious 😂", timestamp: tsAgo(480) } },
]

// ─── Messages (per-chat) ─────────────────────────────────────────
const makeMsgs = (chatId: string, msgs: Array<{body: string; fromMe: boolean; type?: string; mins: number}>)  =>
  msgs.map((m, i) => ({
    id: `msg_${chatId}_${i}`,
    body: m.body,
    type: m.type || "chat",
    fromMe: m.fromMe,
    timestamp: tsAgo(m.mins),
    chatId,
    isGroupMsg: chatId.includes("@g.us"),
    isMedia: ["image", "video", "audio", "document", "ptt"].includes(m.type || ""),
    isNotification: false,
    isQuotedMsgAvailable: false,
    from: m.fromMe ? "me" : chatId,
    to: m.fromMe ? chatId : "me",
    self: m.fromMe ? "out" as const : "in" as const,
    ack: m.fromMe ? 3 : -1,
    content: m.body,
    sender: m.fromMe
      ? { id: "me", pushname: "You", formattedName: "You" }
      : { id: chatId, pushname: demoContacts.find(c => c.id === chatId)?.pushname || "User", formattedName: demoContacts.find(c => c.id === chatId)?.name || "User" },
  }))

export const demoMessages: Record<string, ReturnType<typeof makeMsgs>> = {
  "12345678901@c.us": makeMsgs("12345678901@c.us", [
    { body: "Hey Alice, how's the project going?", fromMe: true, mins: 120 },
    { body: "Going well! Just finishing up the API integration", fromMe: false, mins: 115 },
    { body: "Nice, do you need help with anything?", fromMe: true, mins: 110 },
    { body: "Actually yes, can you review the PR?", fromMe: false, mins: 60 },
    { body: "Sure, I'll take a look after lunch", fromMe: true, mins: 55 },
    { body: "Thanks! It's PR #247", fromMe: false, mins: 50 },
    { body: "Hey, are you coming to the meeting?", fromMe: false, mins: 2 },
  ]),
  "12345678902@c.us": makeMsgs("12345678902@c.us", [
    { body: "Bob, did you push the fix?", fromMe: true, mins: 30 },
    { body: "Yes, just deployed to staging", fromMe: false, mins: 25 },
    { body: "Awesome, checking now", fromMe: true, mins: 20 },
    { body: "Got it, thanks!", fromMe: false, mins: 15 },
  ]),
  "120363001234567890@g.us": makeMsgs("120363001234567890@g.us", [
    { body: "New release notes drafted", fromMe: false, mins: 30 },
    { body: "Looking good 👍", fromMe: true, mins: 25 },
    { body: "Should we deploy tonight?", fromMe: false, mins: 10 },
    { body: "Let's wait for CI to finish first", fromMe: true, mins: 5 },
    { body: "CI passed! ✅", fromMe: false, mins: 3 },
    { body: "The new build is passing!", fromMe: false, mins: 1 },
  ]),
}

// ─── Events (pre-seeded activity feed) ───────────────────────────
export type DemoEvent = {
  id: number
  timestamp: string
  name: string
  args: unknown[]
}

let _eventId = 1
const makeEvent = (name: string, minsAgo: number, payload?: unknown): DemoEvent => ({
  id: _eventId++,
  timestamp: new Date(ago(minsAgo)).toLocaleTimeString(),
  name,
  args: payload ? [payload] : [],
})

export const demoEvents: DemoEvent[] = [
  makeEvent("message.received", 1, { from: "12345678901@c.us", body: "Hey, are you coming to the meeting?", type: "chat" }),
  makeEvent("ack.changed", 1.5, { messageId: "msg_001", ack: 3 }),
  makeEvent("message.received", 2, { from: "120363001234567890@g.us", body: "The new build is passing!", type: "chat" }),
  makeEvent("device.battery", 3, { battery: 87, plugged: false }),
  makeEvent("message.received", 5, { from: "12345678906@c.us", body: "The new pricing looks good", type: "chat" }),
  makeEvent("ack.changed", 5.5, { messageId: "msg_005", ack: 2 }),
  makeEvent("group.participants.changed.global", 7, { groupId: "120363001234567890@g.us", action: "add", who: "12345678920@c.us" }),
  makeEvent("message.received", 8, { from: "120363009876543210@g.us", body: "Q1 report is ready for review", type: "chat" }),
  makeEvent("session.state.changed", 10, { prev: "AUTHENTICATING", next: "READY", reason: "session_loaded" }),
  makeEvent("message.received", 12, { from: "120363003333333333@g.us", body: "Issue #42 is fixed in main", type: "chat" }),
  makeEvent("ack.changed", 13, { messageId: "msg_010", ack: 3 }),
  makeEvent("message.received", 15, { from: "12345678902@c.us", body: "Got it, thanks!", type: "chat" }),
  makeEvent("reaction.added", 17, { messageId: "msg_003", emoji: "👍", from: "12345678904@c.us" }),
  makeEvent("message.received", 20, { from: "12345678902@c.us", body: "Yes, just deployed to staging", type: "chat" }),
  makeEvent("call.incoming", 25, { from: "12345678905@c.us", isVideo: false }),
  makeEvent("device.battery", 30, { battery: 89, plugged: true }),
  makeEvent("message.received", 32, { from: "12345678904@c.us", body: "Can you send the API docs link?", type: "chat" }),
  makeEvent("label.changed", 35, { labelId: "important", action: "added" }),
  makeEvent("message.received", 40, { from: "12345678903@c.us", body: "Invoice attached 📎", type: "document" }),
  makeEvent("chat.opened", 42, { chatId: "12345678901@c.us" }),
  makeEvent("group.addedToGroup", 50, { groupId: "120363005555555555@g.us", by: "12345678910@c.us" }),
  makeEvent("message.received", 55, { from: "12345678901@c.us", body: "Thanks! It's PR #247", type: "chat" }),
  makeEvent("ack.changed", 56, { messageId: "msg_020", ack: 1 }),
  makeEvent("message.received", 60, { from: "120363005555555555@g.us", body: "Dinner at 7pm?", type: "chat" }),
  makeEvent("session.connection.reconnected", 75, { downtimeMs: 3200 }),
  makeEvent("session.connection.disconnected", 78, { reason: "transport_close" }),
  makeEvent("device.plugged", 80, { plugged: true, battery: 72 }),
  makeEvent("message.received", 90, { from: "12345678901@c.us", body: "Actually yes, can you review the PR?", type: "chat" }),
  makeEvent("commerce.order", 100, { orderId: "ORD-2025-042", from: "12345678903@c.us" }),
  makeEvent("message.received", 110, { from: "12345678901@c.us", body: "Going well! Just finishing up the API integration", type: "chat" }),
]

// Events that drip-feed in demo mode
export const demoEventDrips: Array<{ name: string; payload?: unknown }> = [
  { name: "message.received", payload: { from: "12345678913@c.us", body: "Just checking in!", type: "chat" } },
  { name: "ack.changed", payload: { messageId: "msg_drip_1", ack: 3 } },
  { name: "device.battery", payload: { battery: 86, plugged: false } },
  { name: "message.received", payload: { from: "120363001234567890@g.us", body: "Deployment complete 🚀", type: "chat" } },
  { name: "reaction.added", payload: { messageId: "msg_drip_2", emoji: "❤️", from: "12345678905@c.us" } },
  { name: "message.received", payload: { from: "12345678906@c.us", body: "Meeting rescheduled to 4pm", type: "chat" } },
  { name: "ack.changed", payload: { messageId: "msg_drip_3", ack: 2 } },
  { name: "chat.state", payload: { chatId: "12345678901@c.us", state: "composing" } },
  { name: "message.received", payload: { from: "12345678914@c.us", body: "Can you review this design?", type: "image" } },
  { name: "group.participants.changed.global", payload: { groupId: "120363002222222222@g.us", action: "remove", who: "12345678921@c.us" } },
]

// ─── Launch Timeline (for health page) ───────────────────────────
export const demoLaunchTimeline = [
  { step: "launch.create.start", status: "done" as const, durationMs: 12, details: { configSummary: { sessionId: "my-session", headless: false } } },
  { step: "launch.config.setup", status: "done" as const, durationMs: 5 },
  { step: "launch.logging.setup", status: "done" as const, durationMs: 3 },
  { step: "launch.update.check", status: "done" as const, durationMs: 430, details: { updateAvailable: false, latestVersion: "5.0.0" } },
  { step: "launch.browser.init", status: "done" as const, durationMs: 2340, details: { pid: 48291, headless: false } },
  { step: "launch.page.init", status: "done" as const, durationMs: 890, details: { userAgent: "Mozilla/5.0...", viewport: { w: 1920, h: 1080 } } },
  { step: "launch.navigation.gotoWaWeb", status: "done" as const, durationMs: 1200, details: { url: "https://web.whatsapp.com" } },
  { step: "launch.modules.wait", status: "done" as const, durationMs: 3100, details: { success: true } },
  { step: "launch.auth.check", status: "done" as const, durationMs: 450, details: { isAuthenticated: true, method: "direct" } },
  { step: "launch.license.preload", status: "done" as const, durationMs: 180, details: { success: true, status: "valid", source: "cached" } },
  { step: "launch.wapi.inject", status: "done" as const, durationMs: 620, details: { success: true } },
  { step: "launch.session.validityCheck", status: "done" as const, durationMs: 85, details: { valid: true, usable: true, hasRuntime: true, hasStore: true, sessionLoaded: true } },
  { step: "launch.patch.init", status: "done" as const, durationMs: 340, details: { applied: ["core_fix", "store_bridge"], outcome: "ready" } },
  { step: "launch.client.finalize", status: "done" as const, durationMs: 120, details: { state: "READY", success: true, outcome: "ready" } },
]

// ─── Stats (derived aggregates for homepage charts) ──────────────
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const todayIdx = new Date().getDay()

export const demoMessageVolume = Array.from({ length: 7 }, (_, i) => {
  const dayIdx = (todayIdx - 6 + i + 7) % 7
  const counts = [42, 67, 53, 89, 71, 94, 147]  // last 7 days
  return { day: dayNames[dayIdx], count: counts[i] }
})

export const demoMessageTypes = [
  { type: "Text", count: 312, color: "hsl(210, 80%, 60%)" },
  { type: "Image", count: 89, color: "hsl(150, 70%, 50%)" },
  { type: "Video", count: 34, color: "hsl(280, 70%, 60%)" },
  { type: "Audio", count: 28, color: "hsl(40, 85%, 55%)" },
  { type: "Document", count: 19, color: "hsl(0, 70%, 60%)" },
  { type: "Sticker", count: 45, color: "hsl(330, 70%, 60%)" },
  { type: "Location", count: 8, color: "hsl(180, 60%, 50%)" },
]

export const demoStats = {
  messagesToday: 147,
  activeChats: 23,
  totalContacts: demoContacts.length,
  totalChats: demoChats.length,
  unreadTotal: demoChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
}

// ─── Health (for /health page) ───────────────────────────────────
export const demoPatches = [
  { patchId: "core_fix", description: "Core store bridge patch", required: true, outcome: "applied" as const },
  { patchId: "store_bridge", description: "Store module reconnection", required: true, outcome: "applied" as const },
  { patchId: "media_decrypt_v2", description: "Media decryption fallback", required: false, outcome: "not_applicable" as const },
]

export const demoLicense = {
  status: "valid" as const,
  source: "cached" as const,
  keyType: "premium",
  detail: "License validated from local cache",
}

export const demoReconnections = [
  { timestamp: tsAgo(78), reason: "transport_close", downtimeMs: 3200, success: true },
  { timestamp: tsAgo(360), reason: "wapi_missing", downtimeMs: 1800, success: true },
]

// ─── Launch Log Lines (for pre-launch console view) ──────────────
export const demoLaunchLogs: Array<{ text: string; type: "info" | "success" | "error" | "warning" | "dim"; delay: number }> = [
  { text: "Initializing open-wa v5.0.0…", type: "info", delay: 0 },
  { text: "Session ID: my-session", type: "dim", delay: 200 },
  { text: "Headless mode: false", type: "dim", delay: 100 },
  { text: "Resolving configuration…", type: "info", delay: 400 },
  { text: "Configuration loaded", type: "success", delay: 300 },
  { text: "Logger initialized", type: "success", delay: 200 },
  { text: "Checking for updates…", type: "info", delay: 800 },
  { text: "Running latest version (5.0.0)", type: "success", delay: 500 },
  { text: "Launching browser (Chromium)…", type: "info", delay: 300 },
  { text: "Browser PID: 48291", type: "dim", delay: 2200 },
  { text: "Browser launched", type: "success", delay: 100 },
  { text: "Initializing page…", type: "info", delay: 400 },
  { text: "Viewport: 1920×1080", type: "dim", delay: 800 },
  { text: "Navigating to web.whatsapp.com…", type: "info", delay: 300 },
  { text: "Navigation complete", type: "success", delay: 1200 },
  { text: "Waiting for WhatsApp modules…", type: "info", delay: 500 },
  { text: "Core modules loaded", type: "success", delay: 3000 },
  { text: "Checking authentication state…", type: "info", delay: 400 },
  { text: "No existing session found", type: "warning", delay: 600 },
  { text: "QR code generated — scan to connect", type: "warning", delay: 300 },
  { text: "Waiting for QR scan…", type: "info", delay: 0 },
]

// Extra lines that play after "QR scanned"
export const demoPostScanLogs: Array<{ text: string; type: "info" | "success" | "error" | "warning" | "dim"; delay: number }> = [
  { text: "QR code scanned!", type: "success", delay: 0 },
  { text: "Pairing with device…", type: "info", delay: 800 },
  { text: "Syncing messages…", type: "info", delay: 1200 },
  { text: "Validating license…", type: "info", delay: 600 },
  { text: "License valid (cached)", type: "success", delay: 300 },
  { text: "Injecting WAPI…", type: "info", delay: 400 },
  { text: "WAPI injected", type: "success", delay: 600 },
  { text: "Running session validity check…", type: "info", delay: 200 },
  { text: "Session valid and usable", type: "success", delay: 300 },
  { text: "Applying patches: core_fix, store_bridge", type: "info", delay: 300 },
  { text: "2 patches applied", type: "success", delay: 400 },
  { text: "Finalizing client…", type: "info", delay: 200 },
  { text: "Session READY — client is live ✓", type: "success", delay: 500 },
]

/** Resolve a mock `ask()` call for demo mode */
export function resolveDemoAsk(method: string, _args?: unknown): unknown {
  switch (method) {
    case "getHostNumber": return demoSession.hostNumber
    case "getWAVersion": return demoSession.waVersion
    case "getBatteryLevel": return demoSession.battery
    case "getConnectionState": return demoSession.connectionState
    case "getAllChats": return demoChats
    case "getAllContacts": return demoContacts
    case "getAllMessagesInChat": {
      const a = _args as { chatId?: string } | undefined
      return demoMessages[a?.chatId || ""] || []
    }
    case "getProfilePicFromServer": return null
    case "isChatOnline": return Math.random() > 0.6
    case "getLastSeen": return tsAgo(Math.floor(Math.random() * 120))
    case "checkNumberStatus": return { canReceiveMessage: true, numberExists: true }
    case "getSessionId": return "my-session"
    case "getInstanceId": return "demo-instance"
    default: return null
  }
}
