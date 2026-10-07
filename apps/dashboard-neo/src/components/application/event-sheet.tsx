import type { EventLog } from "@/lib/hooks/use-events"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/boardui/chip"
import { DetailSheet, DetailSheetClose } from "./detail-sheet"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import type { ComponentProps } from "react"

export function EventSheet({
  event,
  ...props
}: { event: EventLog | null } & Pick<
  ComponentProps<typeof DetailSheet>,
  "open" | "onOpenChange" | "onClosed" | "finalFocus"
>) {
  const { privacyMode } = usePrivacy()
  const copy = async () => {
    if (!event || privacyMode) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2))
      toast.success("Event copied")
    } catch {
      toast.error("Clipboard unavailable. Select the payload to copy it.")
    }
  }
  return (
    <DetailSheet
      {...props}
      title={event?.name || "Event details"}
      description="Inspect a captured event while keeping your place in the activity feed."
      size="wide"
      footer={
        <>
          <DetailSheetClose render={<Button variant="outline" />}>
            Close
          </DetailSheetClose>
          <Button onClick={() => void copy()} disabled={!event || privacyMode}>
            <Copy />
            Copy event
          </Button>
        </>
      }
    >
      {event && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Chip color="blue" variant="caption">
              Captured event
            </Chip>
            <span className="text-caption-1-regular text-text-secondary">
              {event.timestamp}
            </span>
          </div>
          <section className="space-y-3">
            <h2 className="text-body-medium">Payload</h2>
            {privacyMode ? (
              <p className="rounded-xl border border-dashed p-5 text-body-regular text-text-secondary">
                Payloads are hidden while privacy mode is on. Turn privacy off
                in the sidebar to inspect this event.
              </p>
            ) : (
              <pre
                data-base-ui-swipe-ignore
                className="max-h-[60vh] overflow-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
              >
                {JSON.stringify(event.args, null, 2)}
              </pre>
            )}
          </section>
        </div>
      )}
    </DetailSheet>
  )
}
