import { useCallback, useEffect, useRef, useState } from "react"
import { getApiKey, getApiUrl, getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"

export type BrowserConsoleRecord = {
  id: number
  sequence: number
  timestamp: number
  lastSeen: number
  level: "error" | "warn" | "info" | "debug"
  text: string
  stack: string | null
  source: "console" | "pageerror"
  location: { url: string; lineNumber?: number; columnNumber?: number } | null
  count: number
}

type ConsoleSnapshot = {
  streamId: string
  sequence: number
  available: boolean
  captureLimit: number
  records: BrowserConsoleRecord[]
}
type StreamStatus = "connecting" | "live" | "reconnecting" | "unauthorized" | "unavailable" | "demo"

export function useBrowserConsole() {
  const { isDemo } = useDemo()
  const apiUrl = getApiUrl()
  const apiKey = getApiKey(apiUrl)
  const [records, setRecords] = useState<BrowserConsoleRecord[]>([])
  const [status, setStatus] = useState<StreamStatus>(isDemo ? "demo" : "connecting")
  const [captureAvailable, setCaptureAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPausedState] = useState(false)
  const [captureLimit, setCaptureLimit] = useState(300)
  const [retry, setRetry] = useState(0)
  const pausedRef = useRef(false)
  const clearBefore = useRef(0)
  const latest = useRef<ConsoleSnapshot>({ streamId: "", sequence: 0, available: false, captureLimit: 300, records: [] })
  const target = useRef(apiUrl)

  const publishRecords = useCallback(() => {
    if (pausedRef.current) return
    setRecords(latest.current.records.filter((record) => record.sequence > clearBefore.current).slice().reverse())
  }, [])

  useEffect(() => {
    if (target.current !== apiUrl || isDemo) {
      target.current = apiUrl
      latest.current = { streamId: "", sequence: 0, available: false, captureLimit: 300, records: [] }
      clearBefore.current = 0
      setRecords([])
      setCaptureAvailable(false)
    }
    if (isDemo) {
      setStatus("demo")
      setRecords([])
      return
    }
    let active = true
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    let removeListeners: (() => void) | undefined
    let historyController: AbortController | undefined

    function consume(payload: ConsoleSnapshot, isHistory = false) {
      if (!active) return
      const changedStream = latest.current.streamId !== payload.streamId
      if (changedStream) clearBefore.current = 0
      const retained = changedStream ? [] : latest.current.records.filter(
        (record) => !isHistory || record.sequence > payload.sequence,
      )
      const next = new Map(retained.map((record) => [record.id, record]))
      for (const record of payload.records) {
        if ((next.get(record.id)?.sequence ?? 0) <= record.sequence) {
          next.set(record.id, record)
        }
      }
      latest.current = {
        ...payload,
        sequence: changedStream ? payload.sequence : Math.max(latest.current.sequence, payload.sequence),
        records: [...next.values()].sort((a, b) => a.sequence - b.sequence).slice(-payload.captureLimit),
      }
      setCaptureAvailable(payload.available)
      setCaptureLimit(payload.captureLimit)
      publishRecords()
    }

    async function loadHistory() {
      historyController?.abort()
      const requestController = new AbortController()
      historyController = requestController
      try {
        const response = await fetch(new URL("/meta/debug/browser-console/history", apiUrl), {
          headers: apiKey ? { "X-API-Key": apiKey } : {},
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, requestController.signal, AbortSignal.timeout(10_000)]),
        })
        if (!active) return
        if (response.status === 401) {
          setStatus("unauthorized")
          setError("Enter the Easy API key in your connection settings, then reconnect.")
          return
        }
        if (response.status === 404) {
          setStatus("unavailable")
          setError("This Easy API process does not have browser console streaming. Restart it with the updated library.")
          return
        }
        if (!response.ok) {
          throw new Error("Browser console history unavailable")
        }
        consume(await response.json(), true)
        setError(null)
      } catch {
        if (!active || controller.signal.aborted || requestController.signal.aborted) return
        setError("Browser console history couldn't be loaded. Retrying…")
        clearTimeout(retryTimer)
        retryTimer = setTimeout(() => void loadHistory(), 3000)
      }
    }

    async function connect() {
      try {
        const client = await getClient()
        if (!active) return
        const handleEntries = (payload: ConsoleSnapshot) => {
          consume(payload)
          setStatus("live")
          setError(null)
        }
        const handleConnect = () => {
          setStatus("live")
          void loadHistory()
        }
        const handleDisconnect = () => {
          setStatus("reconnecting")
          setError("The API event stream disconnected. Reconnecting…")
        }
        // Console batches share the dashboard's existing event connection.
        client.socket.on("browser.console", handleEntries)
        client.socket.on("connect", handleConnect)
        client.socket.on("disconnect", handleDisconnect)
        removeListeners = () => {
          client.socket.off("browser.console", handleEntries)
          client.socket.off("connect", handleConnect)
          client.socket.off("disconnect", handleDisconnect)
        }
        setStatus(client.socket.connected ? "live" : "reconnecting")
        void loadHistory()
      } catch {
        if (!active) return
        setStatus("reconnecting")
        setError("The API event stream couldn't connect. Retrying…")
        retryTimer = setTimeout(() => void connect(), 3000)
      }
    }

    setStatus("connecting")
    setError(null)
    void connect()
    return () => {
      active = false
      controller.abort()
      historyController?.abort()
      removeListeners?.()
      clearTimeout(retryTimer)
    }
  }, [apiUrl, apiKey, isDemo, retry, publishRecords])

  const setPaused = useCallback((next: boolean) => {
    pausedRef.current = next
    setPausedState(next)
    if (!next) publishRecords()
  }, [publishRecords])

  const clear = useCallback(() => {
    clearBefore.current = latest.current.sequence
    setRecords([])
  }, [])

  return { records, status, captureAvailable, captureLimit, error, paused, setPaused, clear, reconnect: () => setRetry((value) => value + 1) }
}
