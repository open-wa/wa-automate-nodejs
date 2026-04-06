/**
 * Dashboard API Client
 *
 * Wraps @open-wa/socket-client's SocketClient for use in the dashboard.
 * The SocketClient uses a Proxy to expose all Client methods directly,
 * so `client.sendText(...)` works out of the box.
 *
 * Connection resolution priority:
 * 1. Vite env vars (VITE_EASY_API_PORT / VITE_EASY_API_HOST)
 * 2. localStorage overrides (from ConnectionBadge)
 * 3. URL search params (?port=8002)
 * 4. meta tag (owa-api-url)
 * 5. Current window origin (same host:port)
 */
export { SocketClient } from "@open-wa/socket-client"
export type { Client, ClientMethods } from "@open-wa/socket-client"

import { SocketClient } from "@open-wa/socket-client"

const STORAGE_KEY = "wa-dashboard-connection"

// We lazy-connect so SSR doesn't try to open a socket.
let _client: (SocketClient & import("@open-wa/socket-client").Client) | null = null
let _connecting: Promise<SocketClient & import("@open-wa/socket-client").Client> | null = null

/**
 * Get or create the singleton SocketClient instance.
 * Safe to call multiple times — will return the same connection.
 */
export async function getClient(url?: string) {
  if (_client?.socket?.connected) return _client

  if (!_connecting) {
    const target = url || getApiUrl()
    _connecting = SocketClient.connect(target).then((c) => {
      _client = c
      _connecting = null
      return c
    }).catch((err) => {
      _connecting = null
      throw err
    })
  }

  return _connecting
}

/**
 * Get the raw socket instance if already connected (non-async).
 * Returns null if not yet connected.
 */
export function getClientSync() {
  return _client
}

/**
 * Reset the cached client. Call this before reconnecting with new settings.
 */
export function resetClient() {
  if (_client?.socket) {
    try { _client.socket.disconnect() } catch { /* ignore */ }
  }
  _client = null
  _connecting = null
}

/**
 * Derive the API URL from the configured sources.
 *
 * Priority:
 * 1. VITE_EASY_API_PORT / VITE_EASY_API_HOST (build-time env)
 * 2. localStorage override from ConnectionBadge
 * 3. ?port= URL search param
 * 4. <meta name="owa-api-url"> tag
 * 5. Current window location (same origin)
 */
export function getApiUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8002"
  
  // 1. Check for Vite environment variables (development overrides)
  if (import.meta.env?.VITE_EASY_API_PORT || import.meta.env?.VITE_EASY_API_HOST) {
    const rawHost = import.meta.env.VITE_EASY_API_HOST || window.location.hostname
    const hasProtocol = rawHost.startsWith('http://') || rawHost.startsWith('https://')
    const protocol = hasProtocol ? '' : `${window.location.protocol}//`
    const cleanHost = rawHost.replace(/\/$/, "") // remove trailing slash
    
    // Explicit port override via env takes precedence, fallback to existing parsed port if missing
    const portParams = import.meta.env.VITE_EASY_API_PORT ? `:${import.meta.env.VITE_EASY_API_PORT}` : ''
    
    return `${protocol}${cleanHost}${portParams}`
  }

  // 2. Check localStorage for user-configured connection
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { host, port } = JSON.parse(raw) as { host?: string; port?: string }
      if (host || port) {
        const h = host || window.location.hostname
        const p = port ? `:${port}` : ""
        return `${window.location.protocol}//${h}${p}`
      }
    }
  } catch {
    // ignore
  }

  // 3. Check for URL Search Params (e.g. ?port=8081)
  const urlParams = new URLSearchParams(window.location.search)
  const portParam = urlParams.get("port")

  // 4. The API URL can be injected via a meta tag or env var
  const meta = document.querySelector<HTMLMetaElement>('meta[name="owa-api-url"]')
  if (meta?.content) return meta.content
  
  // 5. Fallback to host port
  const port = portParam || window.location.port
  const host = window.location.hostname
  const protocol = window.location.protocol
  
  return port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`
}
