/**
 * useHealth — real-time session health via SSE runtime events + /health REST fallback.
 *
 * Primary: subscribes to runtime events emitted by the SSE-backed SocketClient
 *   - session.state.changed    → updates session.state
 *   - launch.auth.qr.generated → updates qr
 *   - patch.apply.after        → updates patches
 *   - internal_launch_progress → updates launch timeline
 *   - client.ready             → marks as ready
 *
 * Fallback: polls /health REST endpoint to reconcile full state
 *   - Fast poll (5s) during pre-auth, slow poll (60s) once ready
 *   - Module-level cache survives SPA navigations
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { getApiUrl, getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import {
  demoLaunchTimeline,
  demoPatches,
  demoLicense,
  demoReconnections,
} from "@/lib/demo/demo-data"

// ── Types ──

export interface TimelineStep {
  step: string
  status: "done" | "failed"
  durationMs: number
  details?: Record<string, unknown>
  timestamp?: number
}

export interface PatchInfo {
  patchId: string
  description: string
  required: boolean
  outcome: "applied" | "not_applicable" | "failed"
}

export interface LicenseInfo {
  status: "valid" | "metadata_only" | "missing" | "invalid" | "expired"
  source: string
  keyType: string
  detail: string
}

export interface ReconnectionEntry {
  timestamp: number
  reason: string
  downtimeMs: number
  success: boolean
}

export interface HealthData {
  status: string
  version: string
  connected: boolean
  session: Record<string, unknown>
  qr: string | null
  launchTimeline: TimelineStep[]
  patches: PatchInfo[]
  license: LicenseInfo | null
  reconnections: ReconnectionEntry[]
  startedAt: number | null
  lastEventAt: number | null
}

// ── Module-level cache ──
// Persists across page navigations within the same SPA session
let _cachedHealth: HealthData | null = null
let _lastFetch = 0
let _socketListenerAttached = false

const STALE_THRESHOLD = 30_000

// ── Real-time event listener (singleton) ──
// Wires socket events to the module cache so state is instantly available
type HealthListener = (h: HealthData) => void
const _listeners = new Set<HealthListener>()

function notifyListeners() {
  if (!_cachedHealth) return
  for (const fn of _listeners) fn(_cachedHealth)
}

function createEmptyHealth(): HealthData {
  return {
    status: "unknown",
    version: "unknown",
    connected: false,
    session: { ready: false, state: "DISCONNECTED" },
    qr: null,
    launchTimeline: [],
    patches: [],
    license: null,
    reconnections: [],
    startedAt: null,
    lastEventAt: Date.now(),
  }
}

function ensureHealthCache() {
  if (!_cachedHealth) {
    _cachedHealth = createEmptyHealth()
  }

  return _cachedHealth
}

function unwrapEventPayload(data: unknown) {
  if (!data || typeof data !== "object") return data

  const payload = data as Record<string, any>
  return payload.ctx || payload.details || payload
}

function setCachedHealth(updater: (current: HealthData) => HealthData) {
  const current = ensureHealthCache()
  _cachedHealth = updater(current)
  notifyListeners()
}

function ensureSocketListener() {
  if (_socketListenerAttached) return
  _socketListenerAttached = true

  getClient()
    .then((client) => {
      client.ev.on("session.state.changed", (data: unknown) => {
        const payload = unwrapEventPayload(data) as Record<string, any> | string | undefined
        const nextState =
          typeof payload === "string"
            ? payload
            : payload?.nextState || payload?.state || payload?.currentState

        if (typeof nextState !== "string") return

        setCachedHealth((current) => ({
          ...current,
          connected: nextState !== "DISCONNECTED" && nextState !== "STOPPED",
          session: {
            ...current.session,
            state: nextState,
            ready: nextState === "READY" || nextState === "CONNECTED",
          },
          lastEventAt: Date.now(),
        }))
      })

      client.ev.on("launch.auth.qr.generated", (data: unknown) => {
        const payload = unwrapEventPayload(data) as Record<string, any> | undefined

        setCachedHealth((current) => ({
          ...current,
          qr: payload?.qr || current.qr,
          session: {
            ...current.session,
            state: "AUTHENTICATING",
          },
          lastEventAt: Date.now(),
        }))
      })

      client.ev.on("launch.auth.qr.scanned", () => {
        setCachedHealth((current) => ({
          ...current,
          qr: null,
          lastEventAt: Date.now(),
        }))
      })

      client.ev.on("patch.apply.after", (data: unknown) => {
        const payload = unwrapEventPayload(data) as Record<string, any> | undefined
        if (!payload) return

        const patch: PatchInfo = {
          patchId: payload?.patchId || "unknown",
          description: payload?.description || "",
          required: payload?.required ?? false,
          outcome: payload?.outcome || (payload?.applied ? "applied" : "failed"),
        }

        setCachedHealth((current) => ({
          ...current,
          patches: [...current.patches, patch],
          lastEventAt: Date.now(),
        }))
      })

      client.ev.on("client.ready", () => {
        setCachedHealth((current) => ({
          ...current,
          connected: true,
          qr: null,
          session: {
            ...current.session,
            state: "READY",
            ready: true,
          },
          lastEventAt: Date.now(),
        }))
      })

      client.ev.on("internal_launch_progress", (data: unknown) => {
        const payload = unwrapEventPayload(data) as Record<string, any> | undefined
        if (payload?.text) {
          const step: TimelineStep = {
            step: payload.text,
            status: "done",
            durationMs: 0,
            timestamp: Date.now(),
          }

          setCachedHealth((current) => ({
            ...current,
            launchTimeline: [...current.launchTimeline, step],
            lastEventAt: Date.now(),
          }))
        }
      })

      client.ev.on("core.started", () => {
        setCachedHealth((current) => ({
          ...current,
          connected: true,
          qr: null,
          session: {
            ...current.session,
            state: "READY",
            ready: true,
          },
          lastEventAt: Date.now(),
        }))
      })
    })
    .catch(() => {
      _socketListenerAttached = false
    })
}

export function useHealth() {
  const { isDemo } = useDemo()

  const [health, setHealth] = useState<HealthData | null>(
    isDemo
      ? {
          status: "ok",
          version: "5.0.0",
          connected: true,
          session: { ready: true, state: "READY" },
          qr: null,
          launchTimeline: demoLaunchTimeline,
          patches: demoPatches,
          license: demoLicense,
          reconnections: demoReconnections,
          startedAt: Date.now() - 14523_000,
          lastEventAt: Date.now(),
        }
      : _cachedHealth,
  )
  const [loading, setLoading] = useState(!isDemo && !_cachedHealth)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchHealth = useCallback(async () => {
    try {
      const baseUrl = getApiUrl()
      const res = await fetch(`${baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as HealthData
      _cachedHealth = data
      _lastFetch = Date.now()
      if (mountedRef.current) {
        setHealth(data)
        setError(null)
        setLoading(false)
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to fetch health")
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    if (isDemo) return

    // ── Subscribe to real-time updates ──
    const listener: HealthListener = (h) => {
      if (mountedRef.current) setHealth({ ...h })
    }
    _listeners.add(listener)
    ensureSocketListener()

    // ── /health REST polling as fallback ──
    // Fast (5s) until ready, then slow (60s)
    let intervalId: NodeJS.Timeout

    const startPolling = async (isFirst = false) => {
      if (!isFirst) {
        await fetchHealth()
      } else if (!_cachedHealth || Date.now() - _lastFetch > STALE_THRESHOLD) {
        await fetchHealth()
      }

      const isReady = _cachedHealth?.session?.ready === true
      const interval = isReady ? 60_000 : 5_000

      if (mountedRef.current) {
        intervalId = setTimeout(() => startPolling(false), interval)
      }
    }

    startPolling(true)

    return () => {
      mountedRef.current = false
      _listeners.delete(listener)
      clearTimeout(intervalId)
    }
  }, [isDemo, fetchHealth])

  return {
    health,
    loading,
    error,
    refetch: fetchHealth,
    // Convenience accessors
    timeline: health?.launchTimeline ?? [],
    patches: health?.patches ?? [],
    license: health?.license ?? null,
    reconnections: health?.reconnections ?? [],
    connected: health?.connected ?? false,
    session: health?.session ?? null,
    qr: health?.qr ?? null,
  }
}
