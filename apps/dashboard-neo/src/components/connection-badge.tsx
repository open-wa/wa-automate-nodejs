import { useState, useEffect, useRef } from "react"
import { useSocket } from "@/lib/hooks/use-socket"
import { getApiUrl, resetClient } from "@/lib/api-client"

const STORAGE_KEY = "wa-dashboard-connection"

export type ConnectionConfig = {
  host: string
  port: string
}

/** Read persisted connection config from localStorage */
export function getStoredConnection(): ConnectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

/** Save connection config to localStorage */
function saveConnection(config: ConnectionConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/** Clear saved connection config */
function clearConnection() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Clickable session status badge that opens a connection config popover.
 * Replaces the simple SessionStatusBadge.
 */
export function ConnectionBadge() {
  const { connected } = useSocket()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Derive current values
  const currentUrl = typeof window !== "undefined" ? getApiUrl() : ""
  const stored = typeof window !== "undefined" ? getStoredConnection() : null

  const [host, setHost] = useState(stored?.host ?? "")
  const [port, setPort] = useState(stored?.port ?? "")

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Sync state when opening
  useEffect(() => {
    if (open) {
      const s = getStoredConnection()
      setHost(s?.host ?? "")
      setPort(s?.port ?? "")
    }
  }, [open])

  const apply = () => {
    if (host || port) {
      saveConnection({ host, port })
    } else {
      clearConnection()
    }
    // Reset the cached client so next getClient() uses the new URL
    resetClient()
    setOpen(false)
    // Reload to reconnect everything
    window.location.reload()
  }

  const reset = () => {
    clearConnection()
    setHost("")
    setPort("")
    resetClient()
    setOpen(false)
    window.location.reload()
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Badge - clickable */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
      >
        <span
          className={`size-2 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"}`}
        />
        <span className={connected ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-popover p-4 shadow-lg">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Connection Settings</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Configure the Easy API server address
            </p>
          </div>

          {/* Current URL */}
          <div className="mb-3 rounded-md bg-muted px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Current URL
            </div>
            <code className="mt-0.5 block truncate text-xs">{currentUrl}</code>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Host
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={typeof window !== "undefined" ? window.location.hostname : "localhost"}
                className="h-8 w-full rounded-md border bg-background px-3 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Port
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8002"
                className="h-8 w-full rounded-md border bg-background px-3 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={reset}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Reset to default
            </button>
            <button
              onClick={apply}
              className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Apply & Reconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
