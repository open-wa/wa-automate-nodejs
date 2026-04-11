import { createFileRoute } from "@tanstack/react-router"
import { useSession } from "@/lib/hooks/use-session"
import { useSocket } from "@/lib/hooks/use-socket"
import { useEvents, type EventLog } from "@/lib/hooks/use-events"
import { useHealth } from "@/lib/hooks/use-health"
import { getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { demoMessageVolume, demoMessageTypes, demoStats, demoLaunchLogs, demoPostScanLogs } from "@/lib/demo/demo-data"
import { LaunchConsole, type LogLine } from "@/components/launch-console"
import {
  Zap,
  MessageSquare,
  Users,
  Clock,
  Smartphone,
  Tag,
  Globe,
  Plug,
  ChevronRight,
  QrCode,
  Rocket,
  ScanLine,
  Loader2,
  Hash,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState, useEffect, useRef } from "react"

export const Route = createFileRoute("/")({ component: SessionPage })

// ─── Helpers ─────────────────────────────────────────────────────
function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function getEventIcon(name: string): { color: string; letter: string } {
  if (name.startsWith("message")) return { color: "hsl(210, 80%, 60%)", letter: "M" }
  if (name.startsWith("ack")) return { color: "hsl(150, 70%, 50%)", letter: "✓" }
  if (name.startsWith("device")) return { color: "hsl(40, 85%, 55%)", letter: "D" }
  if (name.startsWith("session")) return { color: "hsl(280, 70%, 60%)", letter: "S" }
  if (name.startsWith("group")) return { color: "hsl(330, 70%, 60%)", letter: "G" }
  if (name.startsWith("call")) return { color: "hsl(0, 70%, 60%)", letter: "C" }
  if (name.startsWith("reaction")) return { color: "hsl(50, 90%, 55%)", letter: "R" }
  if (name.startsWith("commerce")) return { color: "hsl(120, 60%, 45%)", letter: "$" }
  if (name.startsWith("label")) return { color: "hsl(190, 70%, 50%)", letter: "L" }
  if (name.startsWith("chat")) return { color: "hsl(230, 60%, 55%)", letter: "C" }
  return { color: "hsl(0, 0%, 60%)", letter: "·" }
}

// ─── Determine launch phase from health data ────────────────────
type LaunchPhase = "connecting" | "launching" | "qr" | "ready"

function getLaunchPhase(
  healthConnected: boolean,
  healthSession: Record<string, unknown> | null,
): LaunchPhase {
  if (!healthConnected || !healthSession) return "connecting"

  if (healthSession.ready) return "ready"
  
  const state = healthSession.state as string | undefined
  if (state === "READY" || state === "CONNECTED") return "ready"
  if (state === "AUTHENTICATING" || state === "WAITING_FOR_SCAN") return "qr"
  return "launching"
}

// ─── Pre-Launch View ─────────────────────────────────────────────
function PreLaunchView({
  phase,
  qr,
  isDemo,
}: {
  phase: LaunchPhase
  qr: string | null
  isDemo: boolean
}) {
  const [logLines, setLogLines] = useState<LogLine[]>([])
  const [demoPhase, setDemoPhase] = useState<LaunchPhase | "post-scan">("launching")
  const demoTimeoutIds = useRef<ReturnType<typeof setTimeout>[]>([])

  console.log({
  phase,
  qr,
  isDemo,
})
if(qr) phase = "qr"
  // In demo mode, drip-feed log lines to simulate a real launch
  useEffect(() => {
    if (!isDemo) return

    let cumulativeDelay = 0
    const ids: ReturnType<typeof setTimeout>[] = []

    // Phase 1: Drip the launch logs
    for (const line of demoLaunchLogs) {
      cumulativeDelay += line.delay
      const thisDelay = cumulativeDelay
      const id = setTimeout(() => {
        setLogLines((prev) => [
          ...prev,
          { text: line.text, type: line.type, timestamp: new Date().toLocaleTimeString() },
        ])
      }, thisDelay)
      ids.push(id)
    }

    // Phase 2: After launch logs, switch to QR view
    const qrDelay = cumulativeDelay + 1500
    ids.push(
      setTimeout(() => {
        setDemoPhase("qr")
      }, qrDelay),
    )

    // Phase 3: After some time, auto-scan QR and play post-scan logs
    const scanDelay = qrDelay + 8000 // 8s of showing QR
    ids.push(
      setTimeout(() => {
        setDemoPhase("post-scan")
        let postDelay = 0
        for (const line of demoPostScanLogs) {
          postDelay += line.delay
          const thisDelay = scanDelay + postDelay
          const id = setTimeout(() => {
            setLogLines((prev) => [
              ...prev,
              { text: line.text, type: line.type, timestamp: new Date().toLocaleTimeString() },
            ])
          }, thisDelay - scanDelay) // Relative to this timeout
          ids.push(id)
        }

        // Phase 4: Mark as ready after post-scan logs
        const readyDelay = postDelay + 1000
        ids.push(
          setTimeout(() => {
            setDemoPhase("ready")
          }, readyDelay),
        )
      }, scanDelay),
    )

    demoTimeoutIds.current = ids
    return () => ids.forEach(clearTimeout)
  }, [isDemo])

  // In live mode, convert launch timeline events to log lines
  const { timeline } = useHealth()
  useEffect(() => {
    if (isDemo) return
    const lines: LogLine[] = timeline.map((step) => ({
      text: `${step.step}${step.durationMs > 0 ? ` (${step.durationMs}ms)` : ""}`,
      type: step.status === "done" ? "success" as const : "error" as const,
      timestamp: step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : undefined,
    }))
    if (lines.length > 0) setLogLines(lines)
  }, [timeline, isDemo])

  const effectivePhase = isDemo ? demoPhase : phase
  const showQr = (effectivePhase === "qr" || phase === "qr") && !isDemo
    ? !!qr
    : isDemo && demoPhase === "qr"
  const isWaitingForQr = effectivePhase === "qr"

  // Progress computation for launch
  const completedSteps = isDemo
    ? logLines.filter((l) => l.type === "success").length
    : timeline.filter((s) => s.status === "done").length
  const totalSteps = isDemo ? demoLaunchLogs.length : 14 // approximate total
  const progressPct = Math.min((completedSteps / Math.max(totalSteps, 1)) * 100, 100)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Session Setup</h1>
          {isDemo && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Demo
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {effectivePhase === "connecting"
            ? "Connecting to API server…"
            : isWaitingForQr
              ? "Scan the QR code on your phone to connect"
              : effectivePhase === "ready"
                ? "Session ready!"
                : "Launching WhatsApp session…"}
        </p>
      </div>

      {/* Progress bar */}
      {effectivePhase !== "ready" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              {effectivePhase === "connecting"
                ? "Connecting…"
                : isWaitingForQr
                  ? "Waiting for QR scan"
                  : `Step ${completedSteps}/${totalSteps}`}
            </span>
            <span className="tabular-nums">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isWaitingForQr
                  ? "bg-amber-500 animate-pulse"
                  : "bg-primary"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main content: QR + Console side by side */}
      <div className={`grid gap-6 ${showQr ? "lg:grid-cols-2" : ""}`}>
        {/* QR Code Panel */}
        {showQr && (
          <div className="flex flex-col items-center justify-center gap-6 rounded-xl border bg-card p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <QrCode size={16} />
              <span>Scan QR Code</span>
            </div>
            <div className="relative">
              {/* Scanning animation border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse" />
              <div className="rounded-xl border-2 border-white bg-white p-3 shadow-lg dark:border-zinc-200">
                {isDemo ? (
                  // In demo mode, show a placeholder QR
                  <div className="relative flex size-56 items-center justify-center bg-zinc-100 dark:bg-zinc-200">
                    <svg viewBox="0 0 100 100" className="size-52 opacity-80">
                      {/* Simple QR-like pattern */}
                      {Array.from({ length: 10 }).map((_, row) =>
                        Array.from({ length: 10 }).map((_, col) => {
                          const filled = (row + col) % 3 !== 0 && Math.sin(row * col + 1) > -0.3
                          if (!filled) return null
                          return (
                            <rect
                              key={`${row}-${col}`}
                              x={col * 10}
                              y={row * 10}
                              width={9}
                              height={9}
                              fill="black"
                              rx={1}
                            />
                          )
                        }),
                      )}
                      {/* Corner markers */}
                      <rect x={0} y={0} width={30} height={30} fill="none" stroke="black" strokeWidth={4} rx={4} />
                      <rect x={5} y={5} width={20} height={20} fill="black" rx={3} />
                      <rect x={70} y={0} width={30} height={30} fill="none" stroke="black" strokeWidth={4} rx={4} />
                      <rect x={75} y={5} width={20} height={20} fill="black" rx={3} />
                      <rect x={0} y={70} width={30} height={30} fill="none" stroke="black" strokeWidth={4} rx={4} />
                      <rect x={5} y={75} width={20} height={20} fill="black" rx={3} />
                    </svg>
                    {/* Scanning line */}
                    <div className="absolute inset-x-3 h-0.5 bg-primary/60 animate-scan" />
                  </div>
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr!)}`}
                    alt="QR Code"
                    className="size-56"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-center">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ScanLine size={14} className="text-primary" />
                WhatsApp → Settings → Linked Devices → Link a Device
              </p>
              <p className="text-xs text-muted-foreground/60">
                The QR code refreshes automatically every 20 seconds
              </p>
            </div>
          </div>
        )}

        {/* Launch Console */}
        <LaunchConsole
          lines={logLines}
          title="open-wa launch"
          autoScroll
          showTimestamps
          showControls
          onClear={() => setLogLines([])}
        />
      </div>

      {/* Status cards during launch */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatusStep
          label="API Server"
          status={effectivePhase !== "connecting" ? "done" : "pending"}
          icon={Globe}
        />
        <StatusStep
          label="Browser Launch"
          status={
            effectivePhase === "connecting"
              ? "pending"
              : completedSteps >= 5
                ? "done"
                : "running"
          }
          icon={Rocket}
        />
        <StatusStep
          label="Authentication"
          status={
            effectivePhase === "qr"
              ? "waiting"
              : effectivePhase === "ready"
                ? "done"
                : completedSteps >= 9
                  ? "running"
                  : "pending"
          }
          icon={QrCode}
        />
      </div>
    </div>
  )
}

function StatusStep({
  label,
  status,
  icon: Icon,
}: {
  label: string
  status: "pending" | "running" | "done" | "waiting"
  icon: LucideIcon
}) {
  const styles = {
    pending: "border-border bg-card text-muted-foreground",
    running: "border-primary/30 bg-primary/5 text-primary",
    done: "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    waiting: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  }
  const statusLabels = { pending: "Pending", running: "In Progress", done: "Complete", waiting: "Waiting" }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${styles[status]}`}>
      <div className="relative">
        <Icon size={18} />
        {status === "running" && (
          <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary animate-pulse" />
        )}
        {status === "waiting" && (
          <div className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[10px] uppercase tracking-wider opacity-60">{statusLabels[status]}</div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────
function SessionPage() {
  const { session, qr, loading } = useSession()
  const { connected } = useSocket()
  const { isDemo } = useDemo()
  const { redact } = usePrivacy()
  const { events } = useEvents()
  const h = useHealth()
  const { connected: healthConnected, session: healthSession, qr: healthQr } = h
  // Compute launch phase
  const phase = getLaunchPhase(healthConnected, healthSession)

  // In demo mode, allow the pre-launch experience to play, then transition
  const [demoReady, setDemoReady] = useState(false)
  // Track if demo should start in pre-launch mode
  const [showPreLaunch, setShowPreLaunch] = useState(isDemo)

  // Listen for the demo "ready" transition
  useEffect(() => {
    if (!isDemo) return
    // After the full demo animation (~25s), transition to the main dashboard
    const total = demoLaunchLogs.reduce((acc, l) => acc + l.delay, 0) + 1500 + 8000 +
      demoPostScanLogs.reduce((acc, l) => acc + l.delay, 0) + 2000
    const id = setTimeout(() => {
      setDemoReady(true)
      setShowPreLaunch(false)
    }, total)
    return () => clearTimeout(id)
  }, [isDemo])

  // Stats state for the connected dashboard
  const [liveStats, setLiveStats] = useState({
    activeChats: 0,
    totalContacts: 0,
    totalChats: 0,
    unreadTotal: 0,
    messagesToday: { inbound: 0, outbound: 0 },
  })

  // Fetch true stats from client when connected
  useEffect(() => {
    if (isDemo || !session.connected) return

    let mounted = true
    async function loadStats() {
      try {
        const c = await getClient()
        if (!mounted) return
        
        // Fetch concurrently
        // Type cast to any because ask types might be strict, but backend handlers exist
        const [chats, contacts] = await Promise.allSettled([
          c.ask("getAllChats" as any, {}),
          c.ask("getAllContacts" as any, {}),
        ])
        
        if (!mounted) return
        
        let tChats = 0
        let aChats = 0
        let tContacts = 0
        let unreadCount = 0
        
        if (chats.status === "fulfilled" && Array.isArray(chats.value)) {
          tChats = chats.value.length
          // Active chats = chats with messages within the past hour
          const oneHourAgo = Date.now() / 1000 - 3600
          aChats = chats.value.filter((ch: any) => {
            const lastMsgTs = ch.t || ch.timestamp || 0
            return lastMsgTs > oneHourAgo
          }).length
          unreadCount = chats.value.reduce((acc: number, ch: any) => acc + (ch.unreadCount || 0), 0)
        }
        
        if (contacts.status === "fulfilled" && Array.isArray(contacts.value)) {
          tContacts = contacts.value.length
        }

        // Count messages today from the rolling event cache
        let inbound = 0
        let outbound = 0
        for (const evt of events) {
          if (!evt.name.includes("message")) continue
          // Count inbound vs outbound
          const payload = evt.args?.[0] as Record<string, unknown> | undefined
          if (evt.name.includes("message.sent") || payload?.fromMe === true) {
            outbound++
          } else {
            inbound++
          }
        }

        setLiveStats({
          activeChats: aChats,
          totalContacts: tContacts,
          totalChats: tChats,
          unreadTotal: unreadCount,
          messagesToday: { inbound, outbound },
        })
      } catch (err) {
        console.error("Failed to load live stats:", err)
      }
    }
    
    // Slight delay so socket connection finishes booting its plugins
    const delay = setTimeout(loadStats, 1000)
    // Refresh stats periodically to keep "active chats" and "messages today" fresh
    const refreshInterval = setInterval(loadStats, 30_000)

    return () => {
      mounted = false
      clearTimeout(delay)
      clearInterval(refreshInterval)
    }
  }, [isDemo, session.connected, events])

  const stats = useMemo(() => {
    if (isDemo) return demoStats
    const totalMessages = liveStats.messagesToday.inbound + liveStats.messagesToday.outbound
    return {
      messagesToday: totalMessages,
      messagesIn: liveStats.messagesToday.inbound,
      messagesOut: liveStats.messagesToday.outbound,
      activeChats: liveStats.activeChats,
      totalContacts: liveStats.totalContacts,
      totalChats: liveStats.totalChats,
      unreadTotal: liveStats.unreadTotal,
    }
  }, [isDemo, liveStats])

  if (loading && !isDemo) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Connecting to session…</p>
        </div>
      </div>
    )
  }

  // Show pre-launch experience when session isn't ready
  const sessionReady = isDemo ? demoReady : (healthSession?.ready === true || healthSession?.state === "READY" || healthSession?.state === "CONNECTED")
  // console.log(sessionReady, )
  if (!sessionReady || (isDemo && showPreLaunch)) {
    return <PreLaunchView phase={phase} qr={healthQr || qr} isDemo={isDemo} />
  }

  // ─── Connected Dashboard ─────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Session Overview</h1>
          {isDemo && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Demo Mode
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Monitor your WhatsApp session in real-time</p>
      </div>

      {/* Row 1 — Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Status"
          value={session.connected ? "Connected" : "Disconnected"}
          icon={Zap}
          variant={session.connected ? "success" : "destructive"}
        />
        <StatCard
          title="Messages Today"
          value={String(stats.messagesToday)}
          icon={MessageSquare}
          subtitle={isDemo ? `${stats.unreadTotal} unread` : `↓${(stats as any).messagesIn || 0} ↑${(stats as any).messagesOut || 0}`}
        />
        <StatCard
          title="Active Chats"
          value={String(isDemo ? stats.activeChats : stats.activeChats || "—")}
          icon={Users}
          subtitle={isDemo ? undefined : "messages in past hour"}
        />
        <StatCard
          title="Uptime"
          value={formatUptime(session.uptime)}
          icon={Clock}
          subtitle={session.connected ? "running" : "stopped"}
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Message Volume — Last 7 Days</h3>
          <MessageVolumeChart data={isDemo ? demoMessageVolume : []} />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Message Types Breakdown</h3>
          <MessageTypesDonut data={isDemo ? demoMessageTypes : []} />
        </div>
      </div>

      {/* Row 3 — Activity Feed + Session Details */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Recent Activity</h3>
              <span className="text-xs text-muted-foreground">{events.length} events</span>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {events.slice(0, 15).map((evt) => (
                <ActivityRow key={evt.id} event={evt} />
              ))}
              {events.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  No events yet — waiting for activity…
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">Session Details</h3>
          <div className="space-y-4">
            <DetailRow icon={Smartphone} label="Host Number" value={redact(session.hostNumber || "—")} />
            <DetailRow icon={Tag} label="WA Version" value={session.waVersion || "—"} />
            <DetailRow
              icon={Hash}
              label="Patch Hash"
              value={(() => {
                // Derive a compact patch hash from the applied patches in health data
                const appliedPatches = h.patches?.filter(p => p.outcome === 'applied').map(p => p.patchId) ?? []
                if (appliedPatches.length === 0) return "—"
                // Create a short hash from the sorted patch IDs
                const patchStr = appliedPatches.sort().join(',')
                let hash = 0
                for (let i = 0; i < patchStr.length; i++) {
                  hash = ((hash << 5) - hash) + patchStr.charCodeAt(i)
                  hash |= 0 // Convert to 32bit integer
                }
                return Math.abs(hash).toString(36).toUpperCase().slice(0, 8)
              })()}
            />
            <DetailRow
              icon={Plug}
              label="Socket"
              value={connected ? "Connected" : "Disconnected"}
              valueColor={connected ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  variant,
  subtitle,
}: {
  title: string
  value: string
  icon: LucideIcon
  variant?: "success" | "destructive"
  subtitle?: string
}) {
  return (
    <div className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted/60 transition-colors group-hover:bg-primary/10">
          <Icon size={18} className="text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </div>
      <div className="mt-2">
        <span
          className={`text-xl font-bold tabular-nums ${
            variant === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : variant === "destructive"
                ? "text-red-600 dark:text-red-400"
                : ""
          }`}
        >
          {value}
        </span>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Activity Row ────────────────────────────────────────────────
function ActivityRow({ event }: { event: EventLog }) {
  const { color, letter } = getEventIcon(event.name)
  const payload = event.args?.[0]
  const summary = typeof payload === "object" && payload !== null
    ? (payload as { body?: string; reason?: string; action?: string }).body
      || (payload as { reason?: string }).reason
      || (payload as { action?: string }).action
      || ""
    : ""

  return (
    <div className="group flex items-center gap-3 border-b border-border/50 px-5 py-2.5 last:border-0 hover:bg-muted/30 transition-colors">
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {letter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="text-xs font-semibold">{event.name}</code>
          {summary && (
            <span className="truncate text-xs text-muted-foreground">— {summary}</span>
          )}
        </div>
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{event.timestamp}</span>
      <ChevronRight size={14} className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

// ─── Detail Row ──────────────────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueColor || ""}`}>{value}</span>
    </div>
  )
}

// ─── Message Volume Chart (SVG Bar Chart) ────────────────────────
function MessageVolumeChart({ data }: { data: Array<{ day: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Connect a session to see message volume
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count))
  const barWidth = 36
  const gap = 16
  const chartHeight = 160
  const chartWidth = data.length * (barWidth + gap) - gap
  const paddingBottom = 28

  return (
    <svg
      viewBox={`0 0 ${chartWidth + 20} ${chartHeight + paddingBottom + 10}`}
      className="w-full"
      style={{ maxHeight: 220 }}
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(210, 80%, 60%)" />
          <stop offset="100%" stopColor="hsl(210, 80%, 45%)" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = max > 0 ? (d.count / max) * chartHeight : 0
        const x = i * (barWidth + gap) + 10
        const y = chartHeight - barH + 5
        return (
          <g key={d.day}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={6}
              fill="url(#barGrad)"
              className="transition-all duration-500"
              opacity={0.85}
            >
              <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
              <animate attributeName="y" from={chartHeight + 5} to={y} dur="0.6s" fill="freeze" />
            </rect>
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold"
            >
              {d.count}
            </text>
            <text
              x={x + barWidth / 2}
              y={chartHeight + paddingBottom}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {d.day}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Message Types Donut (SVG) ───────────────────────────────────
function MessageTypesDonut({ data }: { data: Array<{ type: string; count: number; color: string }> }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Connect a session to see message types
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const cx = 90
  const cy = 90
  const r = 70
  const strokeWidth = 24

  let cumulativeAngle = -90

  const arcs = data.map((d) => {
    const angle = (d.count / total) * 360
    const startAngle = cumulativeAngle
    cumulativeAngle += angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = ((startAngle + angle) * Math.PI) / 180

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)

    const largeArc = angle > 180 ? 1 : 0

    return {
      ...d,
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      pct: Math.round((d.count / total) * 100),
    }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 180 180" className="size-44 shrink-0">
        {arcs.map((arc) => (
          <path
            key={arc.type}
            d={arc.path}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-2xl font-bold">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          total
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.type} className="flex items-center gap-2 text-sm">
            <div className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.type}</span>
            <span className="ml-auto tabular-nums font-medium">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
