import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/boardui/table"
import { createFileRoute } from "@tanstack/react-router"
import { useEvents, type EventLog } from "@/lib/hooks/use-events"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { useRef, useState } from "react"
import {
  Activity,
  Pause,
  Play,
  Search,
  Trash2,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/boardui/chip"
import { PageHeader } from "@/components/application/page-header"
import { EventSheet } from "@/components/application/event-sheet"

export const Route = createFileRoute("/events")({ component: EventsPage })

function EventsPage() {
  const { events, paused, setPaused, filter, setFilter, clear, count } =
    useEvents()
  const { privacyMode } = usePrivacy()
  const [selected, setSelected] = useState<EventLog | null>(null)
  const [open, setOpen] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)
  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Live events"
        description="Follow session activity and inspect captured payloads."
        badge={
          <Chip variant="caption" color={paused ? "orange" : "lime"}>
            {paused ? "Feed paused" : "Live feed"}
          </Chip>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setPaused(!paused)}
              aria-pressed={paused}
            >
              {paused ? <Play /> : <Pause />}
              {paused ? "Resume feed" : "Pause feed"}
            </Button>
            <Button variant="ghost" onClick={clear} disabled={!count}>
              <Trash2 />
              Clear feed
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-text-tertiary" />
          <Input
            type="search"
            aria-label="Filter events by name"
            placeholder="Filter by event name…"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="ps-9"
          />
        </div>
        <p className="text-caption-1-regular text-text-secondary">
          {events.length} shown · {count} captured
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border-button-default">
        {!events.length ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <Activity className="size-8 text-text-tertiary" />
            <p className="text-body-medium">
              {filter
                ? "No matching events"
                : paused
                  ? "The feed is paused"
                  : "Waiting for activity"}
            </p>
            <p className="max-w-sm text-body-regular text-text-secondary">
              {filter
                ? "Try a different event name or clear the filter."
                : paused
                  ? "Resume the feed to see newly captured events."
                  : "Captured session events will appear here when the session is active."}
            </p>
            {filter && (
              <Button variant="outline" onClick={() => setFilter("")}>
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              aria-label="Captured session events"
              selectionMode="none"
              size="sm"
            >
              <TableHeader>
                <TableColumn id="time" className="w-28">
                  Time
                </TableColumn>
                <TableColumn id="name" isRowHeader>
                  Event
                </TableColumn>
                <TableColumn id="payload" className="hidden md:table-cell">
                  Payload preview
                </TableColumn>
                <TableColumn id="actions" textValue="Inspect">
                  <span className="sr-only">Inspect</span>
                </TableColumn>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} id={event.id} textValue={event.name}>
                    <TableCell className="font-mono text-xs text-text-secondary">
                      {event.timestamp}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-text-primary">
                        {event.name}
                      </code>
                    </TableCell>
                    <TableCell className="hidden max-w-md md:table-cell">
                      <span className="line-clamp-1 font-mono text-xs text-text-tertiary">
                        {privacyMode
                          ? "Hidden by privacy mode"
                          : JSON.stringify(event.args).slice(0, 160)}
                      </span>
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Inspect ${event.name} at ${event.timestamp}`}
                        onClick={(click) => {
                          returnFocus.current = click.currentTarget
                          setSelected(event)
                          setOpen(true)
                        }}
                      >
                        Inspect
                        <ArrowUpRight />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <EventSheet
        event={selected}
        open={open}
        onOpenChange={setOpen}
        onClosed={() => setSelected(null)}
        finalFocus={returnFocus}
      />
    </div>
  )
}
