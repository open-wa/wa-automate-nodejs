import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef, useCallback } from "react"
import { Tv, ArrowLeft, ArrowRight, XCircle } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { ScreencastClient } from "@open-wa/screencaster/client"
import type { NavStateMessage } from "@open-wa/screencaster/client"
import { getApiUrl } from "@/lib/api-client"
import { z } from "zod"

const portalSearchSchema = z.object({
  ws: z.string().optional(), // Override WS URL, e.g. ?ws=ws://localhost:3222
})

export const Route = createFileRoute("/portal")({
  component: PortalPage,
  validateSearch: portalSearchSchema,
})

/**
 * Magic Portal — Headless Head
 *
 * Streams the browser page using CDP Page.startScreencast and forwards
 * user input events back through the ScreencastClient from
 * @open-wa/screencaster/client.
 *
 * All coordinates are sent as normalized (0-1) values — the server
 * converts them to absolute pixel coordinates based on the viewport.
 */
function PortalPage() {
  const { connected } = useSocket()
  const { ws: wsOverride } = Route.useSearch()
  const [portalActive, setPortalActive] = useState(false)
  const [status, setStatus] = useState<"idle" | "connecting" | "streaming" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [navState, setNavState] = useState<NavStateMessage | null>(null)
  const [pageBound, setPageBound] = useState(false)
  const [activeWsUrl, setActiveWsUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<ScreencastClient | null>(null)
  const fpsCountRef = useRef(0)

  // Create and configure the ScreencastClient
  const startPortal = useCallback(() => {
    if (!connected && !wsOverride) return

    setStatus("connecting")
    setErrorMsg(null)

    // Capture initial dimensions from wrapper
    let maxWidth = 1280
    let maxHeight = 720
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      // Reduce dimensions slightly to account for margins/padding if needed
      maxWidth = Math.floor(rect.width) || maxWidth
      maxHeight = Math.floor(rect.height) || maxHeight
    }

    const wsUrl = wsOverride || (getApiUrl().replace(/^http/, "ws") + "/screencast")
    setActiveWsUrl(wsUrl)
    console.log(`[Portal] Connecting to WS: ${wsUrl}${wsOverride ? ' (OVERRIDE)' : ''}`)
    const client = new ScreencastClient({ 
      url: wsUrl, 
      autoStart: true,
      defaultOptions: { maxWidth, maxHeight }
    })
    clientRef.current = client

    client.on("state-change", (state) => {
      setStatus(state)
      if (state === "streaming") setPortalActive(true)
      if (state === "idle") setPortalActive(false)
    })

    client.on("frame", (data) => {
      fpsCountRef.current++
      renderFrame(data)
    })

    client.on("nav-state", (state) => {
      setNavState(state)
    })

    client.on("ready", (bound) => {
      setPageBound(bound)
    })

    client.on("error", (message) => {
      setErrorMsg(message)
    })

    client.connect()

    // FPS counter
    const fpsInterval = setInterval(() => {
      setFps(fpsCountRef.current)
      fpsCountRef.current = 0
    }, 1000)

    // Clean up FPS counter on disconnect
    const cleanup = () => clearInterval(fpsInterval)
    client.on("state-change", (s) => {
      if (s === "idle" || s === "error") cleanup()
    })
  }, [connected, wsOverride])

  const stopPortal = useCallback(() => {
    clientRef.current?.stop()
    clientRef.current?.disconnect()
    clientRef.current?.destroy()
    clientRef.current = null
    setPortalActive(false)
    setStatus("idle")
    setNavState(null)
  }, [])

  const renderFrame = (base64Data: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
    img.src = `data:image/jpeg;base64,${base64Data}`
  }

  // Forward mouse events with normalized coords
  const handleMouseEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, action: "move" | "down" | "up") => {
      const client = clientRef.current
      if (!client) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      const button = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left"
      client.sendMouse(action, x, y, button)
    },
    [],
  )

  // Forward keyboard events
  useEffect(() => {
    if (!portalActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const client = clientRef.current
      if (!client) return
      e.preventDefault()
      const modifiers =
        (e.altKey ? 1 : 0) | (e.ctrlKey ? 2 : 0) | (e.metaKey ? 4 : 0) | (e.shiftKey ? 8 : 0)
      client.sendKey("down", e.key, e.code, modifiers)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const client = clientRef.current
      if (!client) return
      e.preventDefault()
      client.sendKey("up", e.key, e.code)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [portalActive])

  // Forward scroll events with normalized coords
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const client = clientRef.current
    if (!client) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    client.sendScroll(e.deltaX, e.deltaY, x, y)
  }, [])

  // Cleanup on unmount — deferred to survive React StrictMode double-mount
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    // If we're remounting (StrictMode), cancel the pending destroy
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current)
      cleanupTimeoutRef.current = null
    }
    return () => {
      // Defer the destroy so StrictMode's immediate remount can cancel it
      cleanupTimeoutRef.current = setTimeout(() => {
        clientRef.current?.destroy()
        clientRef.current = null
      }, 100)
    }
  }, [])

  // Handle ResizeObserver
  useEffect(() => {
    if (!portalActive) return
    const wrapper = wrapperRef.current
    if (!wrapper) return

    let timeoutId: ReturnType<typeof setTimeout>

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          clientRef.current?.resize(Math.floor(width), Math.floor(height))
        }, 300)
      }
    })

    observer.observe(wrapper)
    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [portalActive])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <h1 className="text-lg font-semibold flex items-center gap-2"><Tv size={20} /> Magic Portal</h1>
        <span className="text-xs text-muted-foreground">Headless Head — See your session live</span>
        {wsOverride && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-mono text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" title={activeWsUrl || wsOverride}>
            🔌 {wsOverride}
          </span>
        )}
        <div className="flex-1" />

        {portalActive && !pageBound && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Waiting for session…
          </span>
        )}

        {portalActive && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            {fps} FPS
          </span>
        )}

        {navState && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => clientRef.current?.goBack()}
              disabled={!navState.canGoBack}
              className="rounded p-1 text-xs hover:bg-muted disabled:opacity-30"
              title="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => clientRef.current?.goForward()}
              disabled={!navState.canGoForward}
              className="rounded p-1 text-xs hover:bg-muted disabled:opacity-30"
              title="Go forward"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {status === "idle" || status === "error" ? (
          <button
            onClick={startPortal}
            disabled={!connected && !wsOverride}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Start Portal
          </button>
        ) : status === "connecting" ? (
          <span className="text-xs text-muted-foreground">Connecting...</span>
        ) : (
          <button
            onClick={stopPortal}
            className="rounded-md bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            Stop
          </button>
        )}
      </div>

      {/* Canvas Area */}
      <div 
        ref={wrapperRef}
        className="flex flex-1 items-center justify-center overflow-hidden bg-black/5 dark:bg-black/20"
      >
        {status === "idle" && (
          <div className="text-center text-muted-foreground">
            <Tv size={64} className="mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="mt-4 text-sm">Click "Start Portal" to see your WhatsApp session in real-time</p>
            <p className="mt-1 text-xs">Targeting API server at: {getApiUrl()}</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center text-destructive">
            <XCircle size={48} className="mx-auto text-destructive opacity-80 mb-2" />
            <p className="mt-2 text-sm">{errorMsg}</p>
          </div>
        )}

        {(status === "streaming" || status === "connecting") && (
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full cursor-pointer"
            style={{ imageRendering: "auto" }}
            onMouseDown={(e) => handleMouseEvent(e, "down")}
            onMouseUp={(e) => handleMouseEvent(e, "up")}
            onMouseMove={(e) => handleMouseEvent(e, "move")}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </div>
    </div>
  )
}
