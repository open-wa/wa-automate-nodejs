import { createFileRoute } from "@tanstack/react-router"
import { useHealth } from "@/lib/hooks/use-health"
import { useDemo } from "@/lib/demo/use-demo"
import {
  HeartPulse,
  CheckCircle2,
  XCircle,
  Minus,
  ShieldCheck,
  RefreshCw,
  Wrench,
  Rocket,
  Loader2,
  AlertTriangle,
} from "lucide-react"

export const Route = createFileRoute("/health")({ component: HealthPage })

function HealthPage() {
  const { isDemo } = useDemo()
  const { timeline, patches, license, reconnections, loading, error, session, connected, refetch } = useHealth()

  const totalLaunchTime = timeline.reduce((sum, s) => sum + s.durationMs, 0)
  const hasData = timeline.length > 0 || patches.length > 0 || license !== null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
            {isDemo && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Demo
              </span>
            )}
            {connected && !isDemo && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Connected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Launch timeline, patches, license status, and session health
          </p>
        </div>
        {!isDemo && (
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && !hasData && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card text-muted-foreground">
          <Loader2 size={32} className="animate-spin opacity-40" />
          <p className="text-sm">Loading health data…</p>
        </div>
      )}

      {/* Error state */}
      {error && !hasData && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-muted-foreground">
          <AlertTriangle size={32} className="text-amber-500 opacity-60" />
          <p className="text-sm">Could not reach the API server</p>
          <p className="text-xs opacity-60">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* No data state */}
      {!loading && !error && !hasData && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card text-muted-foreground">
          <HeartPulse size={48} className="opacity-30" />
          <p className="text-sm">No health data available yet</p>
          <p className="text-xs opacity-60">
            Health data populates once a session starts launching.
            Add <code className="rounded bg-muted px-1.5 py-0.5 font-mono">?demo=true</code> for a preview.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Session summary bar */}
          {session && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCard
                label="State"
                value={(session as Record<string, unknown>).state as string || "UNKNOWN"}
                icon={<HeartPulse size={14} />}
                variant={
                  (session as Record<string, unknown>).state === "READY" ? "success" :
                  (session as Record<string, unknown>).state === "DISCONNECTED" ? "error" : "neutral"
                }
              />
              <MiniCard
                label="Status"
                value={(session as Record<string, unknown>).status as string || (connected ? "ok" : "offline")}
                icon={<CheckCircle2 size={14} />}
                variant={connected ? "success" : "error"}
              />
              <MiniCard
                label="License"
                value={license?.status || "none"}
                icon={<ShieldCheck size={14} />}
                variant={license?.status === "valid" ? "success" : license ? "warning" : "neutral"}
              />
              <MiniCard
                label="Reconnections"
                value={`${reconnections.length}`}
                icon={<RefreshCw size={14} />}
                variant={reconnections.length === 0 ? "success" : "warning"}
              />
            </div>
          )}

          {/* Launch Timeline */}
          {timeline.length > 0 && (
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <Rocket size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">Launch Timeline</h2>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {(totalLaunchTime / 1000).toFixed(1)}s total
                </span>
              </div>
              <div className="p-5">
                <div className="relative">
                  {/* Connector line */}
                  <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-0">
                    {timeline.map((step, idx) => (
                      <div key={`${step.step}-${idx}`} className="group relative flex gap-4 py-2">
                        {/* Status dot */}
                        <div className="relative z-10 mt-0.5 flex size-[28px] shrink-0 items-center justify-center">
                          {step.status === "done" ? (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-500"
                              fill="currentColor"
                              strokeWidth={0}
                            />
                          ) : (
                            <XCircle
                              size={18}
                              className="text-red-500"
                              fill="currentColor"
                              strokeWidth={0}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-semibold">{step.step}</code>
                            {step.durationMs > 0 && (
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums font-medium text-muted-foreground">
                                {step.durationMs >= 1000
                                  ? `${(step.durationMs / 1000).toFixed(1)}s`
                                  : `${step.durationMs}ms`}
                              </span>
                            )}
                          </div>
                          {step.details && (
                            <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                              {formatDetails(step.details)}
                            </p>
                          )}
                        </div>

                        {/* Duration bar */}
                        {step.durationMs > 0 && (
                          <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  step.status === "done" ? "bg-emerald-500/70" : "bg-red-500/70"
                                }`}
                                style={{
                                  width: `${Math.min((step.durationMs / Math.max(totalLaunchTime * 0.3, 1)) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patches + License */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Patches */}
            <div className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <Wrench size={16} className="text-primary" />
                <h2 className="text-sm font-semibold">Applied Patches</h2>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {patches.filter((p) => p.outcome === "applied").length}/{patches.length}
                </span>
              </div>
              <div className="divide-y">
                {patches.map((patch) => (
                  <div key={patch.patchId} className="flex items-center gap-3 px-5 py-3">
                    <div className="mt-0.5">
                      {patch.outcome === "applied" ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : patch.outcome === "not_applicable" ? (
                        <Minus size={16} className="text-muted-foreground" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <code className="text-xs font-semibold">{patch.patchId}</code>
                      <p className="text-xs text-muted-foreground">{patch.description}</p>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        patch.outcome === "applied"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : patch.outcome === "not_applicable"
                            ? "bg-muted text-muted-foreground"
                            : "bg-red-500/15 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {patch.outcome}
                    </span>
                  </div>
                ))}
                {patches.length === 0 && (
                  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    No patch data available
                  </div>
                )}
              </div>
            </div>

            {/* License */}
            <div className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <ShieldCheck size={16} className="text-primary" />
                <h2 className="text-sm font-semibold">License</h2>
              </div>
              <div className="p-5">
                {license ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-12 items-center justify-center rounded-xl ${
                          license.status === "valid"
                            ? "bg-emerald-500/15"
                            : "bg-red-500/15"
                        }`}
                      >
                        <ShieldCheck
                          size={24}
                          className={
                            license.status === "valid"
                              ? "text-emerald-500"
                              : "text-red-500"
                          }
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold capitalize">{license.status}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {license.keyType} · {license.source}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{license.detail}</p>
                  </div>
                ) : (
                  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                    No license data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reconnections */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <RefreshCw size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Reconnection Log</h2>
            </div>
            <div className="divide-y">
              {reconnections.map((r, idx) => (
                <div key={idx} className="flex items-center gap-3 px-5 py-3">
                  <CheckCircle2
                    size={16}
                    className={r.success ? "text-emerald-500" : "text-red-500"}
                  />
                  <div className="min-w-0 flex-1">
                    <code className="text-xs font-semibold">{r.reason}</code>
                    <p className="text-xs text-muted-foreground">
                      Downtime: {r.downtimeMs < 1000 ? `${r.downtimeMs}ms` : `${(r.downtimeMs / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {new Date(r.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {reconnections.length === 0 && (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  No reconnections recorded
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Mini card component ──

function MiniCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string
  value: string
  icon: React.ReactNode
  variant: "success" | "error" | "warning" | "neutral"
}) {
  const colors = {
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    error: "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    neutral: "border-border bg-card text-muted-foreground",
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${colors[variant]}`}>
      <div className="opacity-60">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
        <div className="text-sm font-semibold capitalize truncate">{value}</div>
      </div>
    </div>
  )
}

function formatDetails(details: Record<string, unknown>): string {
  return Object.entries(details)
    .map(([k, v]) => {
      if (typeof v === "object" && v !== null) return `${k}: {…}`
      return `${k}: ${v}`
    })
    .join(" · ")
}
