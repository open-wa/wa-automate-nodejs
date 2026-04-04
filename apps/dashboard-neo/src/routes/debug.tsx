import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useSocket } from "@/lib/hooks/use-socket"
import { getClient } from "@/lib/api-client"

export const Route = createFileRoute("/debug")({ component: DebugPage })

type DebugInfo = {
  memory: { heapUsed: string; heapTotal: string; rss: string; external: string } | null
  config: Record<string, unknown> | null
  logs: string[]
}

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(1)} MB`
}

function DebugPage() {
  const { connected, ask } = useSocket()
  const [debug, setDebug] = useState<DebugInfo>({ memory: null, config: null, logs: [] })
  const [tab, setTab] = useState<"memory" | "config" | "logs">("memory")

  // Fetch debug info
  useEffect(() => {
    if (!connected) return

    async function fetchDebugInfo() {
      try {
        const apiUrl = `${window.location.protocol}//${window.location.hostname}:8080`

        const [memRes, configRes] = await Promise.allSettled([
          fetch(`${apiUrl}/meta/debug/memory`).then((r) => r.json()),
          fetch(`${apiUrl}/meta/debug/config`).then((r) => r.json()),
        ])

        setDebug((prev) => ({
          ...prev,
          memory:
            memRes.status === "fulfilled"
              ? {
                  heapUsed: formatBytes(memRes.value.heapUsed),
                  heapTotal: formatBytes(memRes.value.heapTotal),
                  rss: formatBytes(memRes.value.rss),
                  external: formatBytes(memRes.value.external),
                }
              : null,
          config: configRes.status === "fulfilled" ? configRes.value : null,
        }))
      } catch {
        // Debug endpoints may not exist yet
      }
    }

    fetchDebugInfo()
    const interval = setInterval(fetchDebugInfo, 5000)

    // Subscribe to debug logs via ev
    getClient().then((client) => {
      client.ev.on("debug:log", (data: unknown) => {
        const msg = typeof data === "string" ? data : JSON.stringify(data)
        setDebug((prev) => ({
          ...prev,
          logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-200),
        }))
      })
    })

    return () => clearInterval(interval)
  }, [connected])

  const tabs = [
    { id: "memory" as const, label: "Memory", icon: "📊" },
    { id: "config" as const, label: "Config", icon: "⚙️" },
    { id: "logs" as const, label: "Logs", icon: "📜" },
  ]

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b px-4 py-2">
        <h1 className="me-4 text-lg font-semibold">Debug</h1>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {!connected ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Connect to see debug information
          </div>
        ) : tab === "memory" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {debug.memory ? (
              Object.entries(debug.memory).map(([key, val]) => (
                <div key={key} className="rounded-xl border bg-card p-4">
                  <div className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">{val}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-2">Debug endpoints not available. Add <code>/meta/debug/memory</code> to the API server.</p>
            )}
          </div>
        ) : tab === "config" ? (
          <div>
            {debug.config ? (
              <pre className="rounded-lg border bg-muted p-4 font-mono text-xs overflow-auto max-h-[70vh]">
                {JSON.stringify(debug.config, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Config endpoint not available. Add <code>/meta/debug/config</code> to the API server.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0 font-mono text-xs">
            {debug.logs.length === 0 ? (
              <p className="text-muted-foreground">Listening for debug logs via <code>debug:log</code> event...</p>
            ) : (
              debug.logs.map((log, i) => (
                <div key={i} className="border-b border-muted/30 px-2 py-1 hover:bg-muted/30">
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
