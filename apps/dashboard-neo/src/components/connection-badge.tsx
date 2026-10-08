import { useId, useState } from "react"
import { CheckCircle2, Unplug } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { getApiUrl, resetClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@open-wa/ui-components/popover"

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

export function ConnectionBadge() {
  const { connected } = useSocket()
  const [open, setOpen] = useState(false)
  const [host, setHost] = useState("")
  const [port, setPort] = useState("")
  const id = useId()
  const currentUrl = typeof window !== "undefined" ? getApiUrl() : ""
  const changeOpen = (visible: boolean) => {
    if (visible) {
      const stored = getStoredConnection()
      setHost(stored?.host || "")
      setPort(stored?.port || "")
    }
    setOpen(visible)
  }
  const reconnect = (reset = false) => {
    if (reset || (!host.trim() && !port.trim())) clearConnection()
    else saveConnection({ host: host.trim(), port: port.trim() })
    resetClient()
    window.location.reload()
  }
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            connected ? "text-status-lime-text" : "text-status-rose-text"
          }
        >
          {connected ? <CheckCircle2 /> : <Unplug />}
          {connected ? "API connected" : "API disconnected"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="w-80 space-y-4 rounded-2xl p-5"
      >
        <div>
          <h2 className="text-body-medium">API connection</h2>
          <p className="mt-1 text-caption-1-regular text-text-secondary">
            Choose the Easy API server for this dashboard.
          </p>
        </div>
        <div className="rounded-xl border bg-muted/50 p-3">
          <p className="text-caption-1-regular text-text-secondary">
            Current server
          </p>
          <code className="mt-1 block text-xs break-all">{currentUrl}</code>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            reconnect()
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor={`${id}-host`} className="text-body-medium">
              Host
            </label>
            <Input
              id={`${id}-host`}
              value={host}
              onChange={(event) => setHost(event.target.value)}
              placeholder={
                typeof window !== "undefined"
                  ? window.location.hostname
                  : "localhost"
              }
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-port`} className="text-body-medium">
              Port
            </label>
            <Input
              id={`${id}-port`}
              type="number"
              min={1}
              max={65535}
              value={port}
              onChange={(event) => setPort(event.target.value)}
              placeholder="8002"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => reconnect(true)}
            >
              Use defaults
            </Button>
            <Button type="submit" size="sm">
              Reconnect
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
