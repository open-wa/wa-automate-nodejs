import { useEffect, useState } from "react"
import { getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { useHealth } from "@/lib/hooks/use-health"

export type LicenseTier = "insiders" | "restricted"
export type LicenseState = "loading" | "licensed" | "unlicensed" | "unknown" | "unavailable"

export type LicenseSnapshot = {
  state: LicenseState
  tier: LicenseTier | null
  detail: string | null
  verifiedAt: number | null
  source: "runtime" | "demo" | null
}

const INITIAL_SNAPSHOT: LicenseSnapshot = {
  state: "loading",
  tier: null,
  detail: null,
  verifiedAt: null,
  source: null,
}

function readTier(value: unknown): LicenseTier | null {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().replace(/[ _-]+/g, " ")
    if (normalized === "insiders" || normalized === "insiders program") return "insiders"
    if (normalized === "restricted" || normalized === "b2b restricted volume license") return "restricted"
    return null
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return readTier(record.type ?? record.keyType ?? record.tier ?? record.licenseType)
  }

  return null
}

function isExplicitlyUnlicensed(value: unknown) {
  if (value === false) return true
  if (typeof value === "string") return value.trim().toLowerCase() === "none"
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return record.status === "missing" || record.status === "unlicensed" || record.licensed === false
  }
  return false
}

export function useLicense(): LicenseSnapshot {
  const { isDemo } = useDemo()
  const { health, sessionReady, license, loading: healthLoading, error: healthError } = useHealth()
  const [snapshot, setSnapshot] = useState<LicenseSnapshot>(
    isDemo
      ? {
          state: "licensed",
          tier: "insiders",
          detail: "Demo data only; this tier is not verified by a runtime session",
          verifiedAt: Date.now(),
          source: "demo",
        }
      : INITIAL_SNAPSHOT,
  )

  useEffect(() => {
    if (isDemo) {
      setSnapshot({
        state: "licensed",
        tier: "insiders",
        detail: "Demo data only; this tier is not verified by a runtime session",
        verifiedAt: Date.now(),
        source: "demo",
      })
      return
    }

    let mounted = true
    if (!sessionReady) {
      if (healthLoading) {
        setSnapshot({
          state: "loading",
          tier: null,
          detail: "Checking runtime session status before checking its license",
          verifiedAt: null,
          source: null,
        })
      } else {
        const sessionState = typeof health?.session?.state === "string"
          ? health.session.state.toUpperCase()
          : null
        const disconnected = sessionState === "DISCONNECTED" || sessionState === "STOPPED" || health?.connected === false
        const unavailable = Boolean(healthError) || disconnected || !health

        setSnapshot({
          state: unavailable ? "unavailable" : "unknown",
          tier: null,
          detail: healthError
            ? `Runtime health could not be read: ${healthError}`
            : disconnected
              ? "No connected runtime session. Connect a session before checking its license."
              : sessionState
                ? `The runtime session is ${sessionState.toLowerCase()}; its license cannot be checked until it is ready.`
                : "Runtime session status is not available yet, so the license cannot be verified.",
          verifiedAt: null,
          source: null,
        })
      }
      return () => {
        mounted = false
      }
    }

    setSnapshot((current) => ({ ...current, state: "loading", detail: null }))

    if (license?.status === "missing") {
      setSnapshot({
        state: "unlicensed",
        tier: null,
        detail: license.detail || "No licence is applied to this session",
        verifiedAt: Date.now(),
        source: "runtime",
      })
      return () => {
        mounted = false
      }
    }

    if (license?.status === "invalid" || license?.status === "expired") {
      setSnapshot({
        state: "unavailable",
        tier: null,
        detail: license.detail || "The runtime did not accept this licence",
        verifiedAt: Date.now(),
        source: null,
      })
      return () => {
        mounted = false
      }
    }

    getClient()
      .then((client) => client.ask("getLicenseType" as any, {}))
      .then((value) => {
        if (!mounted) return
        const tier = readTier(value)
        if (tier) {
          if (license?.status !== "valid") {
            setSnapshot({
              state: "unknown",
              tier: null,
              detail: "The runtime reports a licence type, but it has not confirmed the licence",
              verifiedAt: null,
              source: null,
            })
            return
          }
          setSnapshot({
            state: "licensed",
            tier,
            detail: "Confirmed by the selected runtime session",
            verifiedAt: Date.now(),
            source: "runtime",
          })
          return
        }

        if (isExplicitlyUnlicensed(value) && license?.status !== "valid" && license?.status !== "metadata_only") {
          setSnapshot({
            state: "unlicensed",
            tier: null,
            detail: "The selected runtime session reports no licence",
            verifiedAt: Date.now(),
            source: "runtime",
          })
          return
        }

        setSnapshot({
          state: "unknown",
          tier: null,
          detail: "The runtime returned no recognised, confirmed licence tier",
          verifiedAt: Date.now(),
          source: null,
        })
      })
      .catch((error: unknown) => {
        if (!mounted) return
        setSnapshot({
          state: "unavailable",
          tier: null,
          detail: error instanceof Error ? error.message : "Licence status unavailable",
          verifiedAt: null,
          source: null,
        })
      })

    return () => {
      mounted = false
    }
  }, [isDemo, sessionReady, license?.status, license?.detail, healthLoading, healthError, health?.connected, health?.session?.state])

  return snapshot
}
