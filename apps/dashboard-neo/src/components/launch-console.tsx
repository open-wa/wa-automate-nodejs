/**
 * LaunchConsole
 *
 * Terminal-style output display for launch events and logs.
 * Inspired by shadcn CLI Output, built inline without ANSI parsing dep.
 * Features: auto-scroll, copy, clear, timestamps, macOS-style window dots.
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { Copy, Trash2, ChevronDown, Check, Terminal } from "lucide-react"

export interface LogLine {
  text: string
  timestamp?: string
  type?: "info" | "success" | "error" | "warning" | "dim"
}

interface LaunchConsoleProps {
  lines: LogLine[]
  title?: string
  autoScroll?: boolean
  maxLines?: number
  showControls?: boolean
  showTimestamps?: boolean
  onClear?: () => void
  className?: string
}

const typeColors: Record<string, string> = {
  info: "text-[hsl(210,80%,65%)]",
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  dim: "text-zinc-500",
}

const typePrefixes: Record<string, string> = {
  info: "ℹ",
  success: "✓",
  error: "✗",
  warning: "⚠",
  dim: "·",
}

export function LaunchConsole({
  lines,
  title = "Launch Log",
  autoScroll = true,
  maxLines,
  showControls = true,
  showTimestamps = true,
  onClear,
  className = "",
}: LaunchConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [copied, setCopied] = useState(false)

  const displayLines = maxLines ? lines.slice(-maxLines) : lines

  // Auto-scroll when new lines arrive
  useEffect(() => {
    if (autoScroll && isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines.length, autoScroll, isAtBottom])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 40)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      setIsAtBottom(true)
    }
  }, [])

  const copyAll = useCallback(async () => {
    const text = lines.map((l) => {
      const prefix = l.timestamp ? `[${l.timestamp}] ` : ""
      return `${prefix}${l.text}`
    }).join("\n")
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [lines])

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ${className}`}>
      {/* Title bar — macOS-style */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Window dots */}
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-amber-500/80" />
            <div className="size-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal size={13} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-400">{title}</span>
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-1">
            <button
              onClick={copyAll}
              className="flex size-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              title="Copy all"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            {onClear && (
              <button
                onClick={onClear}
                className="flex size-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                title="Clear"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Log content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-[120px] max-h-[340px] overflow-auto p-3 font-mono text-[13px] leading-relaxed"
      >
        {displayLines.length === 0 && (
          <div className="flex h-20 items-center justify-center text-zinc-600 text-xs">
            Waiting for launch events…
          </div>
        )}
        {displayLines.map((line, idx) => {
          const typeClass = typeColors[line.type || "info"] || "text-zinc-300"
          const prefix = typePrefixes[line.type || "info"] || ""

          return (
            <div
              key={idx}
              className="flex gap-2 py-px hover:bg-zinc-900/50 transition-colors"
            >
              {showTimestamps && line.timestamp && (
                <span className="shrink-0 text-zinc-600 tabular-nums select-none">
                  {line.timestamp}
                </span>
              )}
              <span className={`shrink-0 w-3 text-center ${typeClass}`}>
                {prefix}
              </span>
              <span className={typeClass}>{line.text}</span>
            </div>
          )
        })}

        {/* Blinking cursor at the end */}
        {lines.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-emerald-400">❯</span>
            <span className="inline-block h-4 w-[7px] animate-pulse bg-zinc-400/80" />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom indicator */}
      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-12 right-4 flex size-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-lg transition-all hover:bg-zinc-700 hover:text-zinc-200"
        >
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  )
}
