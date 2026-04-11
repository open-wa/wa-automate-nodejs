/**
 * useHealth — real-time session health via socket events + /health REST fallback.
 *
 * Primary: subscribes to socket events for instant state transitions
 *   - session.state.changed   → updates session.state
 *   - launch.auth.qr.generated → updates qr
 *   - patch.apply.after       → updates patches
 *   - internal_launch_progress → updates launch timeline
 *   - client.ready            → marks as ready
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

function ensureSocketListener() {
  if (_socketListenerAttached) return
  _socketListenerAttached = true

  getClient()
    .then((client) => {
      // ── Session state changes (instant phase transitions) ──
      client.socket.on("session.state.changed", (data: unknown) => {
        const d = data as Record<string, any> | undefined
        if (!d) return
        // Depending on the bridge, payload might be nested in ctx/details
        const payload = d.ctx || d.details || d
        const nextState = payload?.nextState || payload?.state || payload
        if (typeof nextState === "string" && _cachedHealth) {
          _cachedHealth = {
            ..._cachedHealth,
            connected: nextState !== "DISCONNECTED" && nextState !== "STOPPED",
            session: {
              ..._cachedHealth.session,
              state: nextState,
              ready: nextState === "READY" || nextState === "CONNECTED",
            },
          }
          notifyListeners()
        }
      })

      // ── QR code generated (instant QR display) ──
      client.socket.on("launch.auth.qr.generated", (data: unknown) => {
        const d = data as Record<string, any> | undefined
        if (!_cachedHealth) return
        const payload = d?.ctx || d?.details || d
        _cachedHealth = {
          ..._cachedHealth,
          qr: payload?.qr || _cachedHealth.qr,
          session: {
            ..._cachedHealth.session,
            state: "AUTHENTICATING",
          },
        }
        notifyListeners()
      })

      // ── Patch results (real-time patch tracking) ──
      client.socket.on("patch.apply.after", (data: unknown) => {
        const d = data as Record<string, any> | undefined
        if (!d || !_cachedHealth) return
        const payload = d.ctx || d.details || d
        const patch: PatchInfo = {
          patchId: payload?.patchId || "unknown",
          description: payload?.description || "",
          required: payload?.required ?? false,
          outcome: payload?.outcome || (payload?.applied ? "applied" : "failed"),
        }
        _cachedHealth = {
          ..._cachedHealth,
          patches: [..._cachedHealth.patches, patch],
        }
        notifyListeners()
      })

      // ── Client ready (instant transition to main dashboard) ──
      client.socket.on("client.ready", () => {
        if (!_cachedHealth) return
        _cachedHealth = {
          ..._cachedHealth,
          connected: true,
          qr: null,
          session: {
            ..._cachedHealth.session,
            state: "READY",
            ready: true,
          },
        }
        notifyListeners()
      })

      // ── Launch progress events ──
      client.socket.on("internal_launch_progress", (data: unknown) => {
        const d = data as Record<string, any> | undefined
        if (!d || !_cachedHealth) return
        const payload = d.ctx || d.details || d
        if (payload?.text) {
          const step: TimelineStep = {
            step: payload.text,
            status: "done",
            durationMs: 0,
            timestamp: Date.now(),
          }
          _cachedHealth = {
            ..._cachedHealth,
            launchTimeline: [..._cachedHealth.launchTimeline, step],
          }
          notifyListeners()
        }
      })
      
      // Fallback: core.started
      client.socket.on("core.started", () => {
        if (!_cachedHealth) return
        _cachedHealth = {
          ..._cachedHealth,
          connected: true,
          qr: null,
          session: {
            ..._cachedHealth.session,
            state: "READY",
            ready: true,
          },
        }
        notifyListeners()
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
