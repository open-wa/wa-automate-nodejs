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

        client.socket.on("connect", () => {
          console.info(`[Dashboard] Successfully connected to API server at ${targetUrl}`)
          if (mounted) setConnected(true)
        })
        
        client.socket.on("disconnect", (reason: string) => {
          console.warn(`[Dashboard] Disconnected from API server: ${reason}`)
          if (mounted) setConnected(false)
        })
        
        client.socket.on("connect_error", (err: Error & { req?: any, code?: string }) => {
          console.error(`[Dashboard] API Connection Error to ${targetUrl}:`, {
            message: err.message,
            name: err.name,
            code: err.code,
            req: err.req ? 'present' : 'none',
            hint: `Ensure the Open-WA API server is running on ${targetUrl} and socketMode is enabled.`
          })
          if (mounted) setError(err.message)
        })
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

