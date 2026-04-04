import { useState, useEffect, useCallback, useRef } from "react"
import { getClient, getClientSync, type SocketClient, type Client } from "@/lib/api-client"

type ConnectedClient = SocketClient & Client

export function useSocket() {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<ConnectedClient | null>(getClientSync())

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return

    let mounted = true

    async function connect() {
      try {
        const client = await getClient()
        if (!mounted) return
        clientRef.current = client
        setConnected(client.socket.connected)
        setError(null)

        client.socket.on("connect", () => {
          if (mounted) setConnected(true)
        })
        client.socket.on("disconnect", () => {
          if (mounted) setConnected(false)
        })
        client.socket.on("connect_error", (err: Error) => {
          if (mounted) setError(err.message)
        })
      } catch (err) {
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
  }, [])

  /**
   * Call any Client method via the socket.
   * Uses SocketClient.ask() which wraps socket.emit with a callback.
   */
  const ask = useCallback(
    async <T = unknown>(method: string, args?: Record<string, unknown> | unknown[]): Promise<T> => {
      const client = clientRef.current
      if (!client) throw new Error("Not connected")
      return client.ask(method as any, args as any) as Promise<T>
    },
    [],
  )

  return {
    connected,
    error,
    ask,
    client: clientRef.current,
  }
}
