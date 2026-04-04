import { useState, useEffect, useCallback, useRef } from "react"
import { getClient } from "@/lib/api-client"

export type EventLog = {
  id: number
  timestamp: string
  name: string
  args: unknown[]
}

const MAX_EVENTS = 500

export function useEvents() {
  const [events, setEvents] = useState<EventLog[]>([])
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState("")
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    if (typeof window === "undefined") return

    let mounted = true

    async function init() {
      try {
        const client = await getClient()
        if (!mounted) return

        // Use EventEmitter2 wildcard to capture ALL events
        client.ev.onAny((event: string, ...args: unknown[]) => {
          if (!mounted || pausedRef.current) return
          setEvents((prev) =>
            [
              {
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString(),
                name: event,
                args,
              },
              ...prev,
            ].slice(0, MAX_EVENTS),
          )
        })

        // Also capture raw socket events for completeness
        client.socket.onAny((event: string, ...args: unknown[]) => {
          if (!mounted || pausedRef.current) return
          // Avoid duplicating events already captured via ev
          if (event.startsWith("on") || event === "connect" || event === "disconnect") return
          setEvents((prev) =>
            [
              {
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString(),
                name: `socket:${event}`,
                args,
              },
              ...prev,
            ].slice(0, MAX_EVENTS),
          )
        })
      } catch {
        // Not connected yet
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const clear = useCallback(() => setEvents([]), [])

  const filteredEvents = filter
    ? events.filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()))
    : events

  return {
    events: filteredEvents,
    allEvents: events,
    paused,
    setPaused,
    filter,
    setFilter,
    clear,
    count: events.length,
  }
}
