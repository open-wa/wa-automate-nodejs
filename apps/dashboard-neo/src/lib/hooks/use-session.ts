import { useState, useEffect, useRef } from "react"
import { getClient } from "@/lib/api-client"

export type SessionState = {
  connected: boolean
  hostNumber: string | null
  waVersion: string | null
  battery: number | null
  connectionState: string
  uptime: number
}

const INITIAL_STATE: SessionState = {
  connected: false,
  hostNumber: null,
  waVersion: null,
  battery: null,
  connectionState: "DISCONNECTED",
  uptime: 0,
}

export function useSession() {
  const [session, setSession] = useState<SessionState>(INITIAL_STATE)
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (typeof window === "undefined") return

    let mounted = true

    async function init() {
      try {
        const client = await getClient()
        if (!mounted) return

        // Fetch initial session data using SocketClient's Proxy methods
        const [hostNumber, waVersion, battery, connectionState] = await Promise.allSettled([
          client.ask("getHostNumber" as any),
          client.ask("getWAVersion" as any),
          client.ask("getBatteryLevel" as any),
          client.ask("getConnectionState" as any),
        ])

        if (!mounted) return

        setSession((prev) => ({
          ...prev,
          connected: true,
          hostNumber: hostNumber.status === "fulfilled" ? (hostNumber.value as string) : null,
          waVersion: waVersion.status === "fulfilled" ? (waVersion.value as string) : null,
          battery: battery.status === "fulfilled" ? (battery.value as number) : null,
          connectionState:
            connectionState.status === "fulfilled" ? (connectionState.value as string) : "UNKNOWN",
        }))
        startTimeRef.current = Date.now()

        // Listen for session events via EventEmitter2
        client.ev.on("qr", (data: unknown) => {
          if (!mounted) return
          const qrData = data as { qr?: string } | string
          setQr(typeof qrData === "string" ? qrData : qrData?.qr || null)
        })

        client.ev.on("session:state", (data: unknown) => {
          if (!mounted) return
          const state = data as Partial<SessionState>
          setSession((prev) => ({ ...prev, ...state }))
        })

        client.socket.on("disconnect", () => {
          if (!mounted) return
          setSession((prev) => ({ ...prev, connected: false, connectionState: "DISCONNECTED" }))
        })

        client.socket.on("connect", () => {
          if (!mounted) return
          setSession((prev) => ({ ...prev, connected: true }))
          // Re-fetch on reconnect
          init()
        })
      } catch {
        if (mounted) setSession(INITIAL_STATE)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Uptime counter
    uptimeRef.current = setInterval(() => {
      if (!mounted) return
      setSession((prev) => ({
        ...prev,
        uptime: prev.connected ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0,
      }))
    }, 1000)

    return () => {
      mounted = false
      if (uptimeRef.current) clearInterval(uptimeRef.current)
    }
  }, [])

  return { session, qr, loading }
}
