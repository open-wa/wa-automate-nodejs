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

/**
 * Module-level event cache.
 * Persists across page navigations within the SPA so the Live Events
 * page isn't empty when you navigate to it. Capped at MAX_EVENTS.
 */
let _cachedEvents: EventLog[] = []
let _listenerAttached = false

/**
 * Push an event into the module-level cache.
 * Called from the one-time listener setup below.
 */
function pushCachedEvent(event: EventLog) {
  _cachedEvents = [event, ..._cachedEvents].slice(0, MAX_EVENTS)
}

/**
 * Attach a one-time global listener that captures events into the cache
 * even when the Events page isn't mounted. This runs once per app lifecycle.
 */
function ensureGlobalListener() {
  if (_listenerAttached) return
  _listenerAttached = true

  getClient()
    .then((client) => {
      // Capture HyperEmitter events
      client.ev.onAny((event: string | string[], ...args: unknown[]) => {
        const eventName = Array.isArray(event) ? event.join('.') : event
        pushCachedEvent({
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          name: eventName,
          args,
        })
      })

      // Capture raw socket events
      client.socket.onAny((event: string, ...args: unknown[]) => {
        if (event.startsWith("on") || event === "connect" || event === "disconnect") return
        pushCachedEvent({
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          name: `socket:${event}`,
          args,
        })
      })
    })
    .catch(() => {
      // Not connected yet — will retry when useEvents mounts
      _listenerAttached = false
    })
}

export function useEvents() {
  const { isDemo } = useDemo()
  // Initialize from module-level cache so events survive page navigation
  const [events, setEvents] = useState<EventLog[]>(isDemo ? demoEvents : _cachedEvents)
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

    // Ensure the global listener is running (idempotent)
    ensureGlobalListener()

    // Sync local state from the module cache periodically
    // This picks up events that arrived via the global listener
    const syncInterval = setInterval(() => {
      if (pausedRef.current) return
      setEvents([..._cachedEvents])
    }, 1000)

    return () => {
      clearInterval(syncInterval)
    }
  }, [isDemo])

  const clear = useCallback(() => {
    _cachedEvents = []
    setEvents([])
  }, [])

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

