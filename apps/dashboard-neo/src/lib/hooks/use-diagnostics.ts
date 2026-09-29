import { useCallback, useEffect, useState } from "react"
import { getApiKey, getApiUrl, getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"

export type DiagnosticError = {
  id: string
  message: string
  stack: string | null
  context: string[]
  method: string | null
  route: string | null
  component: string | null
  firstSeen: number
  lastSeen: number
  count: number
  source: "live event" | "server history" | "not collected"
}

export type DiagnosticEnvironment = {
  sessionId: string | null
  openWaVersion: string | null
  waVersion: string | null
  node: string | null
  browser: string | null
  driver: string | null
  os: string | null
  architecture: string | null
  executionMode: string | null
  config: Record<string, unknown> | null
  patches: unknown[]
  sessionType: string | null
  accountType: string | null
  metadata: {
    info: "available" | "unauthorized" | "unavailable"
    config: "available" | "unauthorized" | "unavailable"
    health: "available" | "unauthorized" | "unavailable"
    diagnostics: "available" | "unauthorized" | "unavailable"
    diagnosticsCapture: "active" | "inactive" | "unavailable"
  }
}

export type DiagnosticSnapshot = {
  errors: DiagnosticError[]
  environment: DiagnosticEnvironment
  connected: boolean
  serverDiagnosticsAvailable: boolean
  captureLimit: number
  sessionId: string | null
  lastUpdated: number | null
}

const MAX_ERRORS = 50
const MAX_CONTEXT = 8
const MAX_MESSAGE_LENGTH = 1_500
const MAX_STACK_LENGTH = 5_000
const MAX_REPORT_URL_LENGTH = 7_500
const SERVER_HISTORY_LIMIT = 50

const emptyEnvironment: DiagnosticEnvironment = {
  sessionId: null,
  openWaVersion: null,
  waVersion: null,
  node: null,
  browser: null,
  driver: null,
  os: null,
  architecture: null,
  executionMode: null,
  config: null,
  patches: [],
  sessionType: null,
  accountType: null,
  metadata: { info: "unavailable", config: "unavailable", health: "unavailable", diagnostics: "unavailable", diagnosticsCapture: "unavailable" },
}

let snapshot: DiagnosticSnapshot = {
  errors: [],
  environment: emptyEnvironment,
  connected: false,
  serverDiagnosticsAvailable: false,
  captureLimit: MAX_ERRORS,
  sessionId: null,
  lastUpdated: null,
}
let attachedClient: any = null
let attachedHandlers: Array<[string, (...args: any[]) => void]> = []
let activeTarget = ""
let activeSession = ""
let refreshPromise: Promise<void> | null = null
const listeners = new Set<(next: DiagnosticSnapshot) => void>()

function publish(next: DiagnosticSnapshot) {
  snapshot = next
  for (const listener of listeners) listener(snapshot)
}

const SENSITIVE_KEY = /(?:api[_-]?key|license[_-]?key|licence[_-]?key|authorization|cookie|token|password|secret|webhook|phone(?:number)?|chat(?:id)?|jid|session[_-]?id|message|body|text|content)/i

function redactStructured(value: unknown, keyHint = "", depth = 0): unknown {
  if (SENSITIVE_KEY.test(keyHint)) return "[REDACTED]"
  if (typeof value === "string") return redactSensitive(value)
  if (value == null || typeof value !== "object") return value
  if (depth > 6) return "[REDACTED NESTED VALUE]"
  if (Array.isArray(value)) return value.slice(0, MAX_CONTEXT * 2).map((item) => redactStructured(item, "", depth + 1))

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 80)
      .map(([key, item]) => [key, redactStructured(item, key, depth + 1)]),
  )
}

function textValue(value: unknown) {
  if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ""}`
  if (typeof value === "string") return value
  if (value == null) return ""
  if (typeof value === "object") {
    try {
      return JSON.stringify(redactStructured(value))
    } catch {
      return "[unserializable value]"
    }
  }
  return String(value)
}

function redactSensitive(value: string) {
  return value
    .replace(/["']?(?:api[_-]?key|license[_-]?key|licence[_-]?key|authorization|cookie|token|password|secret|webhook[_-]?(?:url|secret|key|token)|access[_-]?key|session[_-]?id)["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^,;\s}]+)/gi, "[CREDENTIAL REDACTED]")
    .replace(/(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, "[REDACTED AUTH]")
    .replace(/https?:\/\/[^\s/]+\/[^\s]*(?:webhook|hooks?)[^\s]*/gi, "[WEBHOOK URL REDACTED]")
    .replace(/https?:\/\/[^\s/]+\/[^\s]*(?:api[_-]?key|token|secret|password)=[^&\s]+[^\s]*/gi, "[URL REDACTED]")
    .replace(/\b\d{8,}@(?:c\.us|g\.us|lid)\b/gi, "[CHAT ID REDACTED]")
    .replace(/\b\+?\d[\d\s().-]{7,}\d\b/g, "[PHONE REDACTED]")
    .replace(/["']?(?:message|body|text|content)["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^,;}\n]+)/gi, "[MESSAGE REDACTED]")
    .replace(/(?:\/(?:Users|home|Volumes|private\/var|var\/folders|tmp)\/|C:\\Users\\)[^\s)]+/gi, "[PATH REDACTED]")
}

export function sanitizeDiagnosticText(value: unknown, maxLength = MAX_MESSAGE_LENGTH) {
  const clean = redactSensitive(textValue(value)).replace(/\s+/g, " ").trim()
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}…` : clean
}

export function sanitizeDiagnosticBlock(value: unknown, maxLength = MAX_STACK_LENGTH) {
  const clean = redactSensitive(textValue(value)).trim()
  if (clean.length <= maxLength) return clean
  const notice = `\n[text truncated at ${maxLength} characters]`
  return `${clean.slice(0, maxLength - notice.length)}${notice}`
}

function sanitizeStack(value: unknown) {
  const clean = redactSensitive(textValue(value))
  if (!clean) return null
  if (clean.length <= MAX_STACK_LENGTH) return clean
  const notice = "\n[stack truncated at 5000 characters]"
  return `${clean.slice(0, MAX_STACK_LENGTH - notice.length)}${notice}`
}

function valueAt(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key]
  }
  return null
}

function unwrap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {}
  const record = value as Record<string, unknown>
  const nested = valueAt(record, "details", "ctx", "payload")
  return nested && typeof nested === "object" ? (nested as Record<string, unknown>) : record
}

function payloadRecords(value: unknown) {
  if (!value || typeof value !== "object") return []
  const outer = value as Record<string, unknown>
  const nested = valueAt(outer, "details", "ctx", "payload")
  return nested && typeof nested === "object" && nested !== value
    ? [outer, nested as Record<string, unknown>]
    : [outer]
}

function isErrorPayload(value: unknown, event?: string) {
  const records = payloadRecords(value)
  const record = records[records.length - 1] || unwrap(value)
  const levels = records.map((entry) => textValue(valueAt(entry, "level", "severity", "type", "kind")).toLowerCase())
  if (records.some((entry) => entry.warning === true) || levels.some((level) => ["warn", "warning", "info", "debug", "trace", "verbose"].includes(level))) return false
  if (event === "error") return true
  const nestedError = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null
  return levels.some((level) => level === "error" || level === "fatal") || value instanceof Error || records.some((entry) => entry.error instanceof Error) || (!!nestedError && (typeof nestedError.message === "string" || typeof nestedError.stack === "string")) || records.some((entry) => !!entry.stack && entry.fatal !== false)
}

function errorMessage(value: unknown) {
  const records = payloadRecords(value)
  const record = records[records.length - 1] || unwrap(value)
  const nestedError = record.error instanceof Error ? record.error : null
  const nestedErrorRecord = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null
  return sanitizeDiagnosticText(nestedError?.message || valueAt(nestedErrorRecord || {}, "message", "msg") || valueAt(record, "message", "error", "msg", "text") || value)
}

function diagnosticKey(message: string, stack: string | null, method: string | null, route: string | null) {
  return [message, stack?.split("\n")[0] || "", method || "", route || ""].join("|").toLowerCase()
}

function captureError(value: unknown, source: DiagnosticError["source"] = "live event", event = "error") {
  if (!isErrorPayload(value, event)) return
  const records = payloadRecords(value)
  const record = records[records.length - 1] || unwrap(value)
  const message = errorMessage(value) || "Unidentified runtime error"
  const nestedError = record.error instanceof Error ? record.error : null
  const nestedErrorRecord = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : null
  const stack = sanitizeStack(nestedError?.stack || valueAt(nestedErrorRecord || {}, "stack", "trace") || valueAt(record, "stack", "trace", "errorStack"))
  const method = sanitizeDiagnosticText(valueAt(record, "method", "operation", "action"), 240) || null
  const route = sanitizeDiagnosticText(valueAt(record, "route", "path", "url", "endpoint"), 240) || null
  const component = sanitizeDiagnosticText(valueAt(record, "component", "source", "module", "namespace"), 240) || null
  const key = diagnosticKey(message, stack, method, route)
  const now = Date.now()
  const existing = snapshot.errors.find((entry) => entry.id === key || diagnosticKey(entry.message, entry.stack, entry.method, entry.route) === key)
  const contextLine = sanitizeDiagnosticText([
    valueAt(record, "scope") ? `Scope: ${valueAt(record, "scope")}` : null,
    method ? `Method: ${method}` : null,
    route ? `Route: ${route}` : null,
    component ? `Component: ${component}` : null,
    message,
  ].filter(Boolean).join(" · "), 800)

  if (existing) {
    publish({
      ...snapshot,
      errors: snapshot.errors.map((entry) =>
        entry.id === existing.id
          ? {
              ...entry,
              source: entry.source === "server history" || source === "server history" ? "server history" : "live event",
              lastSeen: now,
              count: entry.count + 1,
              context: [contextLine, ...entry.context].filter(Boolean).slice(0, MAX_CONTEXT),
            }
          : entry,
      ).sort((left, right) => right.lastSeen - left.lastSeen),
      lastUpdated: now,
    })
    return
  }

  publish({
    ...snapshot,
    errors: [
      {
        id: key,
        message,
        stack,
        context: contextLine ? [contextLine] : [],
        method,
        route,
        component,
        firstSeen: now,
        lastSeen: now,
        count: 1,
        source,
      },
      ...snapshot.errors,
    ].slice(0, MAX_ERRORS),
    lastUpdated: now,
  })
}

function allowlistedConfig(value: unknown) {
  if (!value || typeof value !== "object") return null
  const source = value as Record<string, unknown>
  const expectedTypes: Record<string, "boolean" | "number" | "string"> = {
    port: "number",
    headless: "boolean",
    useChrome: "boolean",
    browserRevision: "string",
    logLevel: "string",
    dashboard: "boolean",
    apiLifecycle: "string",
    safeMode: "boolean",
    disableSpins: "boolean",
    qrTimeout: "number",
    authTimeout: "number",
    multiDevice: "boolean",
  }
  const safe: Record<string, unknown> = {}
  for (const [key, expectedType] of Object.entries(expectedTypes)) {
    const item = source[key]
    if (typeof item === expectedType) safe[key] = item
  }
  return redactStructured(safe) as Record<string, unknown>
}

function allowlistedPatch(value: unknown) {
  const source = unwrap(value)
  const result: Record<string, unknown> = {}
  for (const key of ["patchId", "outcome", "status", "phase", "source"]) {
    const item = valueAt(source, key)
    if (typeof item === "string") result[key] = sanitizeDiagnosticText(item, 120)
  }
  for (const key of ["applied", "available"]) {
    const item = valueAt(source, key)
    if (Array.isArray(item)) result[key] = item.slice(0, MAX_CONTEXT).filter((entry): entry is string => typeof entry === "string").map((entry) => sanitizeDiagnosticText(entry, 120))
  }
  return Object.keys(result).length ? result : null
}

function firstString(source: Record<string, unknown> | null, ...keys: string[]) {
  if (!source) return null
  const value = valueAt(source, ...keys)
  return value == null ? null : sanitizeDiagnosticText(value, 240)
}

type MetadataResult = {
  data: Record<string, unknown> | null
  status: "available" | "unauthorized" | "unavailable"
}

async function fetchMetadata(path: string, headers: HeadersInit): Promise<MetadataResult> {
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      headers,
      signal: AbortSignal.timeout(4_000),
    })
    const parsed = await response.json().catch(() => null)
    if (!response.ok) {
      return {
        data: null,
        status: response.status === 401 || response.status === 403 ? "unauthorized" : "unavailable",
      }
    }
    return {
      data: parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null,
      status: "available",
    }
  } catch {
    return { data: null, status: "unavailable" }
  }
}

function resetSession(target: string, session: string) {
  if (activeTarget === target && activeSession === session) return
  activeTarget = target
  activeSession = session
  publish({
    ...snapshot,
    errors: [],
    sessionId: session || null,
    environment: { ...emptyEnvironment, sessionId: session || null },
    lastUpdated: Date.now(),
  })
}

function mergeServerHistory(records: unknown[]) {
  const grouped = new Map<string, DiagnosticError>()
  for (const value of records.slice(-SERVER_HISTORY_LIMIT)) {
    if (!value || typeof value !== "object") continue
    const record = value as Record<string, unknown>
    const timestamp = Number(record.timestamp)
    const message = sanitizeDiagnosticText(record.message)
    if (!message) continue
    const stack = sanitizeStack(record.stack)
    const method = sanitizeDiagnosticText(record.method, 240) || null
    const route = sanitizeDiagnosticText(record.route, 240) || null
    const component = sanitizeDiagnosticText(record.component || record.scope, 240) || null
    const key = diagnosticKey(message, stack, method, route)
    const seenAt = Number.isFinite(timestamp) ? timestamp : Date.now()
    const existing = grouped.get(key)
    if (existing) {
      existing.count += 1
      existing.firstSeen = Math.min(existing.firstSeen, seenAt)
      existing.lastSeen = Math.max(existing.lastSeen, seenAt)
      continue
    }
    grouped.set(key, {
      id: `server:${key}`,
      message,
      stack,
      context: [`${textValue(record.event) || "error"} · ${component || "runtime"}`],
      method,
      route,
      component,
      firstSeen: seenAt,
      lastSeen: seenAt,
      count: 1,
      source: "server history",
    })
  }
  const merged = [...grouped.values()].map((record) => {
    const same = snapshot.errors.find((error) => diagnosticKey(error.message, error.stack, error.method, error.route) === diagnosticKey(record.message, record.stack, record.method, record.route))
    return same ? {
      ...same,
      firstSeen: Math.min(same.firstSeen, record.firstSeen),
      lastSeen: Math.max(same.lastSeen, record.lastSeen),
      count: Math.max(same.count, record.count),
      source: same.source,
      context: [...new Set([...same.context, ...record.context])].slice(0, MAX_CONTEXT),
    } : record
  })
  const liveOnly = snapshot.errors.filter((error) => error.source === "live event" && !merged.some((record) => record.id === error.id))
  publish({ ...snapshot, errors: [...merged, ...liveOnly].sort((left, right) => right.lastSeen - left.lastSeen).slice(0, MAX_ERRORS), lastUpdated: Date.now() })
}

async function refreshServerDiagnostics() {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const target = getApiUrl()
      if (activeTarget && activeTarget !== target) resetSession(target, "")
      const client = await getClient()
      const apiKey = getApiKey()
      const metadataHeaders: HeadersInit = apiKey ? { "X-API-Key": apiKey } : {}
      const [sessionId, waVersion, info, config, health, serverHistory] = await Promise.all([
        client.ask("getSessionId" as any, {}).catch(() => null),
        client.ask("getWAVersion" as any, {}).catch(() => null),
        fetchMetadata("/meta/debug/info", metadataHeaders),
        fetchMetadata("/meta/debug/config", metadataHeaders),
        fetchMetadata("/health", metadataHeaders),
        fetchMetadata("/meta/debug/diagnostics", metadataHeaders),
      ])
      const resolvedSessionId = firstString(config.data, "sessionId") || (typeof sessionId === "string" ? sanitizeDiagnosticText(sessionId, 240) : "")
      resetSession(target, resolvedSessionId)
      const previous = snapshot.environment
      const session = health.data?.session && typeof health.data.session === "object"
        ? health.data.session as Record<string, unknown>
        : null
      const patches = Array.isArray(health.data?.patches)
        ? health.data.patches.map((patch) => allowlistedPatch(patch)).filter(Boolean).slice(-MAX_CONTEXT)
        : previous.patches
      const resolvedConfig = allowlistedConfig(config.data)
      const metadata = {
        info: info.status,
        config: config.status,
        health: health.status,
        diagnostics: serverHistory.status,
        diagnosticsCapture: serverHistory.status !== "available"
          ? "unavailable" as const
          : serverHistory.data?.available === true
            ? "active" as const
            : "inactive" as const,
      }
      if (serverHistory.data?.available === true && Array.isArray(serverHistory.data.records)) {
        mergeServerHistory(serverHistory.data.records)
      }
      publish({
        ...snapshot,
        connected: typeof health.data?.connected === "boolean" ? health.data.connected : client.socket?.connected !== false,
        serverDiagnosticsAvailable: serverHistory.status === "available" && serverHistory.data?.available === true,
        captureLimit: Math.min(MAX_ERRORS, Number(serverHistory.data?.captureLimit) || MAX_ERRORS),
        sessionId: resolvedSessionId || null,
        environment: {
          ...previous,
          sessionId: resolvedSessionId || null,
          openWaVersion: firstString(health.data, "version") || previous.openWaVersion,
          waVersion: firstString(session, "waVersion", "webVersion", "waWebVersion") || (typeof waVersion === "string" ? sanitizeDiagnosticText(waVersion, 240) : previous.waVersion),
          node: firstString(info.data, "nodeVersion", "node") || previous.node,
          browser: firstString(info.data, "browser", "browserVersion") || previous.browser,
          driver: firstString(info.data, "driver", "driverName") || previous.driver,
          os: firstString(info.data, "platform", "os") || previous.os,
          architecture: firstString(info.data, "arch", "architecture") || previous.architecture,
          executionMode: previous.executionMode,
          config: resolvedConfig || previous.config,
          patches,
          sessionType: typeof config.data?.multiDevice === "boolean" ? (config.data.multiDevice ? "Multi-device" : "Single-device") : previous.sessionType,
          accountType: null,
          metadata,
        },
        lastUpdated: Date.now(),
      })
    } catch {
      publish({ ...snapshot, connected: false, serverDiagnosticsAvailable: false, lastUpdated: Date.now() })
    }
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

function ensureListener() {
  getClient()
    .then(async (client) => {
      if (attachedClient === client) return
      for (const [event, handler] of attachedHandlers) attachedClient?.ev?.off(event, handler)
      attachedHandlers = []
      attachedClient = client
      const [sessionId, waVersion] = await Promise.all([
        client.ask("getSessionId" as any, {}).catch(() => null),
        client.ask("getWAVersion" as any, {}).catch(() => null),
      ])
      const resolvedSessionId = typeof sessionId === "string" ? sessionId : snapshot.sessionId
      publish({
        ...snapshot,
        errors: resolvedSessionId && snapshot.sessionId && resolvedSessionId !== snapshot.sessionId ? [] : snapshot.errors,
        connected: true,
        sessionId: resolvedSessionId,
        environment: {
          ...snapshot.environment,
          sessionId: resolvedSessionId,
          waVersion: typeof waVersion === "string" ? sanitizeDiagnosticText(waVersion, 240) : snapshot.environment.waVersion,
        },
        lastUpdated: Date.now(),
      })
      const eventBus = client.ev as any
      const debugLog = (value: unknown) => captureError(value, "live event", "debug:log")
      const runtimeError = (value: unknown) => captureError(value, "live event", "error")
      const patchApplied = (value: unknown) => {
        const patch = allowlistedPatch(value)
        if (!patch || typeof patch !== "object") return
        publish({
          ...snapshot,
          environment: {
            ...snapshot.environment,
            patches: [...snapshot.environment.patches, patch].slice(-MAX_CONTEXT),
          },
          lastUpdated: Date.now(),
        })
      }
      const sessionChanged = (value: unknown) => {
        const nextState = textValue(valueAt(unwrap(value), "nextState", "next", "state", "currentState")).toLowerCase()
        if (!nextState) return
        publish({ ...snapshot, connected: nextState === "ready", lastUpdated: Date.now() })
        if (nextState === "disconnected" || nextState === "stopped") void refreshServerDiagnostics()
      }
      for (const [event, handler] of [["debug:log", debugLog], ["error", runtimeError], ["patch.apply.after", patchApplied], ["session.state.changed", sessionChanged]] as Array<[string, (value: unknown) => void]>) {
        eventBus.on(event, handler)
        attachedHandlers.push([event, handler])
      }
    })
    .catch(() => {
      void refreshServerDiagnostics()
    })
}

export function useDiagnostics(): DiagnosticSnapshot & { refresh: () => Promise<void> } {
  const { isDemo } = useDemo()
  const [current, setCurrent] = useState<DiagnosticSnapshot>(() => snapshot)

  useEffect(() => {
    if (isDemo) {
      const now = Date.now()
      const demoError: DiagnosticError = {
        id: "demo-runtime-error",
        message: "Browser session lost the WhatsApp Web bridge",
        stack: "Error: Browser session lost the WhatsApp Web bridge\n    at SessionTransport.reconnect (packages/core/src/transport/SessionTransport.ts:214:13)",
        context: ["session.state.changed state=DISCONNECTED", "launch.browser.init completed"],
        method: "reconnect",
        route: "/health",
        component: "SessionTransport",
        firstSeen: now - 240_000,
        lastSeen: now - 120_000,
        count: 2,
        source: "server history",
      }
      const demoSnapshot = { ...snapshot, errors: [demoError], connected: true, serverDiagnosticsAvailable: true, sessionId: "my-session", environment: { ...emptyEnvironment, sessionId: "my-session", openWaVersion: "5.0.0", waVersion: "2.2506.12", node: "v22.14.0", browser: "Chromium 140", driver: "puppeteer", os: "darwin", architecture: "arm64", executionMode: "easy-api", config: allowlistedConfig({ headless: false, multiDevice: true }), patches: [{ patchId: "core_fix", outcome: "applied" }] } }
      setCurrent(demoSnapshot)
      return
    }

    ensureListener()
    const listener = (next: DiagnosticSnapshot) => setCurrent({ ...next })
    listeners.add(listener)
    void refreshServerDiagnostics()
    return () => {
      listeners.delete(listener)
    }
  }, [isDemo])

  const refresh = useCallback(async () => {
    await refreshServerDiagnostics()
    setCurrent({ ...snapshot })
  }, [])

  return { ...current, refresh }
}

export { MAX_REPORT_URL_LENGTH }
