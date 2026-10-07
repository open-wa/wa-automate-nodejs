import { CheckCircle2, Unplug } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { Chip } from "@/components/boardui/chip"

export function SessionStatusBadge() {
  const { connected } = useSocket()
  return (
    <Chip
      color={connected ? "lime" : "rose"}
      variant="caption"
      className="justify-start gap-2"
      title="Connection to the Easy API server. WhatsApp readiness is shown on the overview."
    >
      {connected ? (
        <CheckCircle2 className="size-3.5" />
      ) : (
        <Unplug className="size-3.5" />
      )}
      {connected ? "API connected" : "API disconnected"}
    </Chip>
  )
}
