import { useState, useEffect, useCallback, useRef } from "react"
import { getClient, getClientSync, getApiUrl, type SocketClient, type Client } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { resolveDemoAsk } from "@/lib/demo/demo-data"

type ConnectedClient = SocketClient & Client

export function useSocket() {
  const { isDemo } = useDemo()
  const [connected, setConnected] = useState(isDemo)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<ConnectedClient | null>(isDemo ? null : getClientSync())

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return
    // Demo mode — no real socket needed
    if (isDemo) return

    let mounted = true
    let cleanupListeners: (() => void) | undefined

    async function connect() {
      try {
        const targetUrl = getApiUrl()
        console.groupCollapsed(`[Dashboard] Initializing API Connection`)
        console.info(`Target URL: ${targetUrl}`)
        console.groupEnd()

        const client = await getClient()
        if (!mounted) return
        clientRef.current = client
        setConnected(client.socket.connected)
        setError(null)

        const handleConnect = () => {
          console.info(`[Dashboard] Successfully connected to API server at ${targetUrl}`)
          if (!mounted) return
          setConnected(true)
          setError(null)
        }

        const handleDisconnect = (reason: string) => {
          console.warn(`[Dashboard] Disconnected from API server: ${reason}`)
          if (!mounted) return
          setConnected(false)
        }

        const handleConnectError = (err: unknown) => {
          if (!mounted) return
          setError(err instanceof Error ? err.message : "Connection failed")
        }

        client.socket.on("connect", handleConnect)
        client.socket.on("disconnect", handleDisconnect)
        client.socket.on("connect_error", handleConnectError)

        cleanupListeners = () => {
          client.socket.off("connect", handleConnect)
          client.socket.off("disconnect", handleDisconnect)
          client.socket.off("connect_error", handleConnectError)
        }
      } catch (err) {
        console.error(`[Dashboard] Failed to initialize API client:`, err)
        if (mounted) {
          setError(err instanceof Error ? err.message : "Connection failed")
          setConnected(false)
        }
      }
    }

    connect()

    return () => {
      mounted = false
      cleanupListeners?.()
    }
  }, [isDemo])

  /**
   * Call any Client method via the socket (or mock in demo mode).
   */
  const ask = useCallback(
    async <T = unknown>(method: string, args?: Record<string, unknown> | unknown[]): Promise<T> => {
      if (isDemo) {
        // Simulate a small network delay for realism
        await new Promise((r) => setTimeout(r, 80 + Math.random() * 120))
        return resolveDemoAsk(method, args) as T
      }
      const client = clientRef.current
      if (!client) throw new Error("Not connected")
      return client.ask(method as any, args as any) as Promise<T>
    },
    [isDemo],
  )

  return {
    connected,
    error,
    ask,
    client: clientRef.current,
  }
}
