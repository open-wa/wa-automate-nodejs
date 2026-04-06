/**
 * useHealth — fetches /health from the API server via REST.
 *
 * Unlike socket-based hooks, this uses a simple HTTP fetch so the data
 * survives page navigation. A module-level cache ensures that returning
 * to the health page shows the last-known data immediately while a
 * background refresh updates it.
 *
 * Polls every 10s while mounted.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { getApiUrl } from "@/lib/api-client"
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
// This persists across page navigations within the same SPA session
let _cachedHealth: HealthData | null = null
let _lastFetch = 0

const POLL_INTERVAL = 10_000 // 10 seconds
const STALE_THRESHOLD = 30_000 // consider stale after 30s

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

    // Dynamic polling based on state
    // Fast polling (5s) initially, slows down significantly (60s) once session is ready
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
