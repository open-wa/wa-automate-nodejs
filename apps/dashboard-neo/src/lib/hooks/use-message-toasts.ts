import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { getClient } from "@/lib/api-client"
import { useDemo } from "@/lib/demo/use-demo"
import { usePrivacy } from "@/lib/hooks/use-privacy"

/**
 * Listens for incoming messages via the raw socket's `message.received`
 * event and shows a toast notification for each new message.
 *
 * The event payload shape (from the events page) is:
 *   { ctx: { correlationId, ts }, message: { body, sender, from, ... } }
 *
 * Respects privacy mode — redacts sender names/IDs when enabled.
 */
export function useMessageToasts() {
  const { isDemo } = useDemo()
  const { privacyMode } = usePrivacy()
  const privacyRef = useRef(privacyMode)
  privacyRef.current = privacyMode
  const listenerRef = useRef(false)

  useEffect(() => {
    if (isDemo || typeof window === "undefined") return
    if (listenerRef.current) return
    listenerRef.current = true

    getClient()
      .then((client) => {
        // Listen on the raw socket — the event name is "message.received"
        // (shows as "socket:message.received" in the events page)
        client.socket.on("message.received", (data: unknown) => {
          const payload = data as Record<string, any> | undefined
          if (!payload) return

          // The message is nested inside `payload.message`
          const m = payload.message || payload
          if (!m) return

          const sender =
            m.sender?.pushname ||
            m.sender?.formattedName ||
            m.sender?.name ||
            m.chat?.formattedTitle ||
            m.notifyName ||
            m.from ||
            m.chatId ||
            "Unknown"

          const body = m.body || m.text || m.caption || `[${m.type || "message"}]`
          const displaySender = privacyRef.current ? "REDACTED" : sender
          const displayBody =
            typeof body === "string" && body.length > 80
              ? body.slice(0, 80) + "…"
              : body

          toast(displaySender, {
            description: displayBody,
            duration: 5000,
          })
        })
      })
      .catch(() => {
        listenerRef.current = false
      })

    return () => {
      listenerRef.current = false
    }
  }, [isDemo])
}
