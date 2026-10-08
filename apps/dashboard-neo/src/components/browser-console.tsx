import { useEffect, useRef, useState } from "react"
import { ArrowUp, Copy, Pause, Play, RefreshCw, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useBrowserConsole, type BrowserConsoleRecord } from "@/lib/hooks/use-browser-console"

const levelStyles = {
  error: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
  warn: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  info: "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-400",
  debug: "border-border bg-muted/20 text-muted-foreground",
}

function sourceLabel(record: BrowserConsoleRecord) {
  if (!record.location) return record.source === "pageerror" ? "Uncaught browser error" : "Browser console"
  const { url, lineNumber, columnNumber } = record.location
  return `${url}${lineNumber == null ? "" : `:${lineNumber + 1}`}${columnNumber == null ? "" : `:${columnNumber + 1}`}`
}

function ConsoleEntry({ record }: { record: BrowserConsoleRecord }) {
  const preview = record.text.replace(/\s+/g, " ").slice(0, 320)
  return (
    <details className={`group rounded-lg border ${levelStyles[record.level]}`}>
      <summary className="cursor-pointer rounded-lg px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="inline-flex w-[calc(100%-1rem)] flex-col gap-1.5 align-middle sm:flex-row sm:items-start sm:gap-3">
          <div className="flex shrink-0 items-center gap-2 pt-0.5 font-mono text-[11px]">
            <time className="text-muted-foreground" dateTime={new Date(record.lastSeen).toISOString()}>
              {new Date(record.lastSeen).toLocaleTimeString()}
            </time>
            <span className="w-10 font-semibold uppercase">{record.level}</span>
            {record.count > 1 && <span className="rounded bg-background px-1.5 py-0.5 text-muted-foreground" title="Repeated occurrences">×{record.count}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words font-mono text-xs leading-relaxed text-foreground">{preview}{preview.length < record.text.replace(/\s+/g, " ").length ? "…" : ""}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground" title={sourceLabel(record)}>{sourceLabel(record)}</p>
          </div>
        </div>
      </summary>
      <div className="space-y-3 border-t border-inherit px-4 py-3 text-foreground">
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{record.text}</pre>
        {record.stack && <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Stack trace</p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{record.stack}</pre>
        </div>}
        <p className="text-[11px] text-muted-foreground">First seen {new Date(record.timestamp).toLocaleTimeString()} · Last seen {new Date(record.lastSeen).toLocaleTimeString()} · {record.count} {record.count === 1 ? "occurrence" : "occurrences"}</p>
      </div>
    </details>
  )
}

export function BrowserConsole() {
  const feed = useBrowserConsole()
  const [filter, setFilter] = useState("")
  const [level, setLevel] = useState("problems")
  const [follow, setFollow] = useState(true)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const needle = filter.toLowerCase().trim()
  const visible = feed.records.filter((record) => {
    const matchesLevel = level === "all" || (level === "problems" ? record.level === "error" || record.level === "warn" : record.level === level)
    return matchesLevel && (!needle || `${record.text}\n${record.stack ?? ""}\n${sourceLabel(record)}`.toLowerCase().includes(needle))
  })
  const errorCount = feed.records.filter((record) => record.level === "error").reduce((sum, record) => sum + record.count, 0)
  const warningCount = feed.records.filter((record) => record.level === "warn").reduce((sum, record) => sum + record.count, 0)

  useEffect(() => {
    if (follow && !feed.paused) scrollRef.current?.scrollTo({ top: 0 })
  }, [feed.records, follow, feed.paused])

  async function copyVisible() {
    const text = visible.map((record) => `[${new Date(record.lastSeen).toISOString()}] ${record.level.toUpperCase()}${record.count > 1 ? ` ×${record.count}` : ""} ${record.text}\n${sourceLabel(record)}${record.stack ? `\n${record.stack}` : ""}`).join("\n\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus("Visible entries copied")
    } catch { setCopyStatus("Clipboard access unavailable") }
  }

  const statusLabel = feed.paused ? "Paused" : ({ connecting: "Connecting…", live: "Live", reconnecting: "Reconnecting…", unauthorized: "API key required", unavailable: "Unavailable", demo: "Demo mode" }[feed.status])

  return (
    <section className="flex h-full min-h-0 flex-col gap-4" aria-label="Browser console">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Browser console</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground" role="status">
              <span className={`size-1.5 rounded-full ${feed.status === "live" && !feed.paused ? "bg-emerald-500" : "bg-amber-500"}`} />
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Live console output and uncaught errors from the WhatsApp browser.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => feed.setPaused(!feed.paused)} aria-pressed={feed.paused}>
            {feed.paused ? <Play /> : <Pause />}{feed.paused ? "Resume" : "Pause"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void copyVisible()} disabled={!visible.length}><Copy />Copy visible</Button>
          <Button variant="ghost" size="sm" onClick={feed.clear} disabled={!feed.records.length}><Trash2 />Clear view</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" />
          <Input type="search" aria-label="Search browser console" placeholder="Search errors, modules or source files…" value={filter} onChange={(event) => setFilter(event.target.value)} className="ps-9" />
        </div>
        <select aria-label="Browser console severity" className="h-9 rounded-lg border bg-background px-3 text-xs" value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="problems">Warnings & errors</option>
          <option value="all">All levels</option>
          <option value="error">Errors</option>
          <option value="warn">Warnings</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
        <Button variant={follow ? "secondary" : "ghost"} size="sm" onClick={() => setFollow(!follow)} aria-pressed={follow}><ArrowUp />Follow latest</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>{visible.length} shown · <span className="text-rose-600 dark:text-rose-400">{errorCount} errors</span> · <span className="text-amber-700 dark:text-amber-400">{warningCount} warnings</span></p>
        <p>Latest {feed.captureLimit} grouped entries · Newest first</p>
      </div>
      {copyStatus && <p className="text-xs text-muted-foreground" role="status">{copyStatus}</p>}
      {feed.error && <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm" role="status">
        <p>{feed.error}</p><Button variant="outline" size="sm" onClick={feed.reconnect}><RefreshCw />Reconnect</Button>
      </div>}

      <div ref={scrollRef} className="min-h-48 flex-1 space-y-2 overflow-auto pe-1" onWheel={() => setFollow(false)}>
        {visible.map((record) => <ConsoleEntry key={record.id} record={record} />)}
        {!visible.length && <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-5 text-center">
          <p className="text-sm font-medium">{feed.status === "demo" ? "Browser logs need a live session" : feed.records.length ? "No matching browser logs" : "Waiting for browser output"}</p>
          <p className="max-w-md text-xs text-muted-foreground">{feed.status === "demo" ? "Connect to Easy API to stream actual browser console output." : feed.records.length ? "Change the severity or search filter to see more entries." : feed.captureAvailable ? "Keep this tab open while reproducing the issue. New entries appear automatically." : "Browser output will appear when the browser starts. The stream stays available while the session is connecting."}</p>
        </div>}
      </div>
      <p className="text-[11px] text-muted-foreground">Repeated messages are grouped. Common credentials, chat IDs and personal fields are redacted.</p>
    </section>
  )
}
