import { createFileRoute } from "@tanstack/react-router"
import { useSession } from "@/lib/hooks/use-session"
import { useSocket } from "@/lib/hooks/use-socket"
import { Zap, Smartphone, Tag, Clock, Battery, Globe, Plug } from "lucide-react"
import type { ReactNode } from "react"
export const Route = createFileRoute("/")({ component: SessionPage })

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function SessionPage() {
  const { session, qr, loading } = useSession()
  const { connected } = useSocket()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Connecting to session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Session Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor your WhatsApp session in real-time</p>
      </div>

      {/* QR Code Display */}
      {qr && !session.connected && (
        <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border bg-card p-8">
          <h2 className="text-lg font-semibold">Scan QR Code</h2>
          <div className="rounded-lg border-4 border-white bg-white p-2">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}`} alt="QR Code" className="size-64" />
          </div>
          <p className="text-sm text-muted-foreground">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Status"
          value={session.connected ? "Connected" : "Disconnected"}
          icon={<Zap size={20} className="text-muted-foreground" />}
          variant={session.connected ? "success" : "destructive"}
        />
        <StatCard
          title="Host Number"
          value={session.hostNumber || "—"}
          icon={<Smartphone size={20} className="text-muted-foreground" />}
        />
        <StatCard
          title="WA Version"
          value={session.waVersion || "—"}
          icon={<Tag size={20} className="text-muted-foreground" />}
        />
        <StatCard
          title="Uptime"
          value={formatUptime(session.uptime)}
          icon={<Clock size={20} className="text-muted-foreground" />}
        />
        <StatCard
          title="Battery"
          value={session.battery !== null ? `${session.battery}%` : "—"}
          icon={<Battery size={20} className="text-muted-foreground" />}
        />
        <StatCard
          title="Connection State"
          value={session.connectionState}
          icon={<Globe size={20} className="text-muted-foreground" />}
        />
        <StatCard
          title="Socket"
          value={connected ? "Connected" : "Disconnected"}
          icon={<Plug size={20} className="text-muted-foreground" />}
          variant={connected ? "success" : "destructive"}
        />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  variant,
}: {
  title: string
  value: string
  icon: ReactNode
  variant?: "success" | "destructive"
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-2">
        <span
          className={`text-lg font-semibold ${
            variant === "success"
              ? "text-emerald-600 dark:text-emerald-400"
              : variant === "destructive"
                ? "text-red-600 dark:text-red-400"
                : ""
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}
