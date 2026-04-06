import { useState, useEffect, useRef } from "react"
import { getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { demoSession } from "@/lib/demo/demo-data"

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
  const { isDemo } = useDemo()
  const [session, setSession] = useState<SessionState>(
    isDemo
      ? {
          connected: true,
          hostNumber: demoSession.hostNumber,
          waVersion: demoSession.waVersion,
          battery: demoSession.battery,
          connectionState: demoSession.connectionState,
          uptime: demoSession.uptime,
        }
      : INITIAL_STATE,
  )
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isDemo)
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now() - (isDemo ? demoSession.uptime * 1000 : 0))

  useEffect(() => {
    if (typeof window === "undefined") return

    // Demo mode — just tick uptime, no socket
    if (isDemo) {
      uptimeRef.current = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          uptime: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }))
      }, 1000)
      return () => {
        if (uptimeRef.current) clearInterval(uptimeRef.current)
      }
    }

    let mounted = true

    async function init() {
      try {
        const client = await getClient()
        if (!mounted) return

        // Fetch initial session data using SocketClient's Proxy methods
        const [hostNumber, waVersion, battery, connectionState] = await Promise.allSettled([
          client.ask("getHostNumber" as any, {}),
          client.ask("getWAVersion" as any, {}),
          client.ask("getBatteryLevel" as any, {}),
          client.ask("getConnectionState" as any, {}),
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
  }, [isDemo])

  return { session, qr, loading }
}

