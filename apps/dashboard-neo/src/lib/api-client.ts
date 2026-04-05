/**
 * Dashboard API Client
 *
 * Wraps @open-wa/socket-client's SocketClient for use in the dashboard.
 * The SocketClient uses a Proxy to expose all Client methods directly,
 * so `client.sendText(...)` works out of the box.
 *
 * The dashboard connects to the Easy API server (default: localhost:8080)
 * which always runs in socket mode in v5.
 */
export { SocketClient } from "@open-wa/socket-client"
export type { Client, ClientMethods } from "@open-wa/socket-client"

import { SocketClient } from "@open-wa/socket-client"

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
 * Derive the API URL from the current window location or fallback.
 * In production the dashboard is served as a sidecar, so the API
 * is on a different port (8080 by default).
 */
export function getApiUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8080"
  
  // 1. Check for URL Search Params (e.g. ?port=8081)
  const urlParams = new URLSearchParams(window.location.search)
  const portParam = urlParams.get("port")

  // 2. The API URL can be injected via a meta tag or env var
  const meta = document.querySelector<HTMLMetaElement>('meta[name="owa-api-url"]')
  if (meta?.content) return meta.content
  
  // 3. Fallback to host port
  const port = portParam || window.location.port
  const host = window.location.hostname
  const protocol = window.location.protocol
  
  return port ? `${protocol}//${host}:${port}` : `${protocol}//${host}`
}
