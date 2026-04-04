import { createFileRoute } from "@tanstack/react-router"
import { useEvents } from "@/lib/hooks/use-events"
import { useState } from "react"

export const Route = createFileRoute("/events")({ component: EventsPage })

function EventsPage() {
  const { events, paused, setPaused, filter, setFilter, clear, count } = useEvents()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Live Events</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count}
        </span>

        <div className="flex-1" />

        <input
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 w-48 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />

        <button
          onClick={() => setPaused(!paused)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            paused
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
          }`}
        >
          {paused ? "⏸ Paused" : "▶ Live"}
        </button>

        <button
          onClick={clear}
          className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          Clear
        </button>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-auto">
        {events.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {paused ? "Event capture paused" : "Waiting for events..."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-muted/50 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-2 text-start font-medium text-muted-foreground w-24">Time</th>
                <th className="px-4 py-2 text-start font-medium text-muted-foreground w-56">Event</th>
                <th className="px-4 py-2 text-start font-medium text-muted-foreground">Payload</th>
                <th className="px-4 py-2 text-start font-medium text-muted-foreground w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                >
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{event.timestamp}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                      {event.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {expandedId === event.id ? (
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3">
                        {JSON.stringify(event.args, null, 2)}
                      </pre>
                    ) : (
                      <span className="line-clamp-1 text-muted-foreground">
                        {JSON.stringify(event.args).slice(0, 120)}
                        {JSON.stringify(event.args).length > 120 && "..."}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(JSON.stringify(event, null, 2))
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Copy"
                    >
                      📋
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
