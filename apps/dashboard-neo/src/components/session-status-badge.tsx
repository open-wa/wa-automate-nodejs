import { useSocket } from "@/lib/hooks/use-socket"

export function SessionStatusBadge() {
  const { connected } = useSocket()

  return (
    <div className="flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium">
      <span
        className={`size-2 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"}`}
      />
      <span className={connected ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  )
}
