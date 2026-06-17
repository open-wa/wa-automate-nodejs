import { useState, useEffect, useRef } from "react"
import { getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { demoSession } from "@/lib/demo/demo-data"
import { useHealth } from "@/lib/hooks/use-health"

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

function isConnectedState(state: string | null | undefined) {
  if (!state) return false

  return state !== "DISCONNECTED" && state !== "STOPPED"
}

function unwrapEventPayload(data: unknown) {
  if (!data || typeof data !== "object") return data

  const payload = data as Record<string, any>
  return payload.ctx || payload.details || payload
}

export function useSession() {
  const { isDemo } = useDemo()
  const { canInvokeRuntime } = useHealth()
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
      : INITIAL_STATE
  )
  const [qr, setQr] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isDemo)
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(
    Date.now() - (isDemo ? demoSession.uptime * 1000 : 0)
  )

  useEffect(() => {
    if (typeof window === "undefined") return

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
    let cleanupListeners: (() => void) | undefined

    const applyConnectionState = (nextState: string) => {
      setSession((prev) => {
        const nextConnected = isConnectedState(nextState)
        if (nextConnected && !prev.connected) {
          startTimeRef.current = Date.now()
        }

        return {
          ...prev,
          connected: nextConnected,
          connectionState: nextState,
        }
      })

      if (nextState === "READY" || nextState === "CONNECTED") {
        setQr(null)
      }
    }

    async function refreshSessionSnapshot(
      client: Awaited<ReturnType<typeof getClient>>
    ) {
      const [hostNumber, waVersion, battery, connectionState] =
        await Promise.allSettled([
          client.ask("getHostNumber" as any, {}),
          client.ask("getWAVersion" as any, {}),
          client.ask("getBatteryLevel" as any, {}),
          client.ask("getConnectionState" as any, {}),
        ])

      if (!mounted) return

      const nextConnectionState =
        connectionState.status === "fulfilled"
          ? (connectionState.value as string)
          : "UNKNOWN"
      const nextConnected = isConnectedState(nextConnectionState)

      setSession((prev) => {
        if (nextConnected && !prev.connected) {
          startTimeRef.current = Date.now()
        }

        return {
          ...prev,
          connected: nextConnected,
          hostNumber:
            hostNumber.status === "fulfilled"
              ? (hostNumber.value as string)
              : prev.hostNumber,
          waVersion:
            waVersion.status === "fulfilled"
              ? (waVersion.value as string)
              : prev.waVersion,
          battery:
            battery.status === "fulfilled"
              ? (battery.value as number)
              : prev.battery,
          connectionState: nextConnectionState,
        }
      })

      if (
        nextConnectionState === "READY" ||
        nextConnectionState === "CONNECTED"
      ) {
        setQr(null)
      }
    }

    async function init() {
      try {
        const client = await getClient()
        if (!mounted) return

        if (canInvokeRuntime) {
          await refreshSessionSnapshot(client)
        }

        const handleQrGenerated = (data: unknown) => {
          if (!mounted) return

          const payload = unwrapEventPayload(data) as
            | Record<string, any>
            | string
            | undefined
          const nextQr =
            typeof payload === "string" ? payload : payload?.qr || null

          setQr(nextQr)
          applyConnectionState("AUTHENTICATING")
        }

        const handleQrScanned = () => {
          if (!mounted) return
          setQr(null)
        }

        const handleSessionStateChanged = (data: unknown) => {
          if (!mounted) return

          const payload = unwrapEventPayload(data) as
            | Record<string, any>
            | string
            | undefined
          const nextState =
            typeof payload === "string"
              ? payload
              : payload?.nextState ||
                payload?.state ||
                payload?.currentState ||
                "UNKNOWN"

          applyConnectionState(nextState)
        }

        const handleReady = () => {
          if (!mounted) return

          setQr(null)
          void refreshSessionSnapshot(client)
        }

        client.ev.on("launch.auth.qr.generated", handleQrGenerated)
        client.ev.on("launch.auth.qr.scanned", handleQrScanned)
        client.ev.on("session.state.changed", handleSessionStateChanged)
        client.ev.on("client.ready", handleReady)
        client.ev.on("core.started", handleReady)

        if (canInvokeRuntime) {
          refreshRef.current = setInterval(() => {
            void refreshSessionSnapshot(client)
          }, 30_000)
        }

        cleanupListeners = () => {
          client.ev.off("launch.auth.qr.generated", handleQrGenerated)
          client.ev.off("launch.auth.qr.scanned", handleQrScanned)
          client.ev.off("session.state.changed", handleSessionStateChanged)
          client.ev.off("client.ready", handleReady)
          client.ev.off("core.started", handleReady)
        }
      } catch {
        if (mounted) {
          setSession(INITIAL_STATE)
          setQr(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    uptimeRef.current = setInterval(() => {
      if (!mounted) return

      setSession((prev) => ({
        ...prev,
        uptime: prev.connected
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0,
      }))
    }, 1000)

    return () => {
      mounted = false

      if (uptimeRef.current) clearInterval(uptimeRef.current)
      if (refreshRef.current) clearInterval(refreshRef.current)
      cleanupListeners?.()
    }
  }, [isDemo, canInvokeRuntime])

  return { session, qr, loading }
}
