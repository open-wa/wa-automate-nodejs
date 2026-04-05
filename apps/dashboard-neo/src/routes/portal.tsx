import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef, useCallback } from "react"
import { useSocket } from "@/lib/hooks/use-socket"
import { ScreencastClient } from "@open-wa/screencaster/client"
import type { FrameMessage, NavStateMessage } from "@open-wa/screencaster/client"
import { getApiUrl } from "@/lib/api-client"

export const Route = createFileRoute("/portal")({ component: PortalPage })

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
  const [portalActive, setPortalActive] = useState(false)
  const [status, setStatus] = useState<"idle" | "connecting" | "streaming" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [navState, setNavState] = useState<NavStateMessage | null>(null)
  const [pageBound, setPageBound] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clientRef = useRef<ScreencastClient | null>(null)
  const fpsCountRef = useRef(0)

  // Create and configure the ScreencastClient
  const startPortal = useCallback(() => {
    if (!connected) return

    setStatus("connecting")
    setErrorMsg(null)

    const wsUrl = getApiUrl().replace(/^http/, "ws") + "/screencast"
    const client = new ScreencastClient({ url: wsUrl, autoStart: true })
    clientRef.current = client

    client.on("state-change", (state) => {
      setStatus(state)
      if (state === "streaming") setPortalActive(true)
      if (state === "idle") setPortalActive(false)
    })

    client.on("frame", (data, metadata) => {
      fpsCountRef.current++
      renderFrame(data, metadata)
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
  }, [connected])

  const stopPortal = useCallback(() => {
    clientRef.current?.stop()
    clientRef.current?.disconnect()
    clientRef.current?.destroy()
    clientRef.current = null
    setPortalActive(false)
    setStatus("idle")
    setNavState(null)
  }, [])

  const renderFrame = (base64Data: string, metadata?: FrameMessage["metadata"]) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.destroy()
    }
  }, [])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <h1 className="text-lg font-semibold">🪄 Magic Portal</h1>
        <span className="text-xs text-muted-foreground">Headless Head — See your session live</span>
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
              ←
            </button>
            <button
              onClick={() => clientRef.current?.goForward()}
              disabled={!navState.canGoForward}
              className="rounded p-1 text-xs hover:bg-muted disabled:opacity-30"
              title="Go forward"
            >
              →
            </button>
          </div>
        )}

        {status === "idle" || status === "error" ? (
          <button
            onClick={startPortal}
            disabled={!connected}
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
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/5 dark:bg-black/20">
        {status === "idle" && (
          <div className="text-center text-muted-foreground">
            <div className="text-6xl">🪄</div>
            <p className="mt-4 text-sm">Click "Start Portal" to see your WhatsApp session in real-time</p>
            <p className="mt-1 text-xs">Targeting API server at: {getApiUrl()}</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center text-destructive">
            <div className="text-4xl">❌</div>
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
