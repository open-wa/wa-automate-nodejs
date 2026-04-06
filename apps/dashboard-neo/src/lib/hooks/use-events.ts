import { useState, useEffect, useCallback, useRef } from "react"
import { getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { demoEvents, demoEventDrips, type DemoEvent } from "@/lib/demo/demo-data"

export type EventLog = {
  id: number
  timestamp: string
  name: string
  args: unknown[]
}

const MAX_EVENTS = 500

export function useEvents() {
  const { isDemo } = useDemo()
  const [events, setEvents] = useState<EventLog[]>(isDemo ? demoEvents : [])
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState("")
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    if (typeof window === "undefined") return

    // Demo mode — drip-feed events periodically
    if (isDemo) {
      let dripIdx = 0
      const interval = setInterval(() => {
        if (pausedRef.current) return
        const drip = demoEventDrips[dripIdx % demoEventDrips.length]
        dripIdx++
        setEvents((prev) =>
          [
            {
              id: Date.now() + Math.random(),
              timestamp: new Date().toLocaleTimeString(),
              name: drip.name,
              args: drip.payload ? [drip.payload] : [],
            } satisfies DemoEvent,
            ...prev,
          ].slice(0, MAX_EVENTS),
        )
      }, 3000 + Math.random() * 3000)
      return () => clearInterval(interval)
    }

    let mounted = true

    async function init() {
      try {
        const client = await getClient()
        if (!mounted) return

        // Use EventEmitter2 wildcard to capture ALL events
        client.ev.onAny((event: string | string[], ...args: unknown[]) => {
          if (!mounted || pausedRef.current) return
          const eventName = Array.isArray(event) ? event.join('.') : event
          setEvents((prev) =>
            [
              {
                id: Date.now() + Math.random(),
                timestamp: new Date().toLocaleTimeString(),
                name: eventName,
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
  }, [isDemo])

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

