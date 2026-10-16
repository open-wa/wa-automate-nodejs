import { useEffect, useRef, useState } from "react"
import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronDown } from "lucide-react"
import { InteractiveResponseSchema } from "@open-wa/schema/interactive"
import { DetailSheet } from "@/components/application/detail-sheet"
import { Button } from "@/components/ui/button"
import { useSocket } from "@/lib/hooks/use-socket"
import { useHealth } from "@/lib/hooks/use-health"
import { useDemo } from "@/lib/demo/use-demo"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { getClient } from "@/lib/api-client"

type Recipient = { id: string; name: string }

export function StudioSendSheet({ open, onOpenChange, valid, onSend, interactive = false }: {
  open: boolean; onOpenChange: (open: boolean) => void; valid: boolean; onSend: (to: string) => Promise<unknown>; interactive?: boolean
}) {
  const { connected, ask } = useSocket()
  const { canInvokeRuntime } = useHealth()
  const { isDemo } = useDemo()
  const { redact, redactName, privacyMode } = usePrivacy()
  const [query, setQuery] = useState("")
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [chats, setChats] = useState<Recipient[]>([])
  const [loadingChats, setLoadingChats] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [chatError, setChatError] = useState("")
  const [submitted, setSubmitted] = useState<unknown>(undefined)
  const [reply, setReply] = useState<unknown>(null)
  const recipientRef = useRef(recipient)
  recipientRef.current = recipient
  const available = connected && canInvokeRuntime && !isDemo
  useEffect(() => {
    if (!open || !available) return
    let active = true
    setLoadingChats(true); setChatError("")
    ask<{ id: string; name?: string; formattedTitle?: string }[]>("getAllChats").then(items => {
      if (active) setChats(items.filter(item => typeof item.id === "string").map(item => ({ id: item.id, name: item.name || item.formattedTitle || item.id })))
    }).catch(error => { if (active) setChatError(error instanceof Error ? error.message : "Chats couldn't be loaded.") })
      .finally(() => { if (active) setLoadingChats(false) })
    return () => { active = false }
  }, [open, available, ask])
  useEffect(() => {
    if (!open || !available || !interactive) return
    let dispose: (() => void) | undefined
    let active = true
    void getClient().then(client => {
      if (!active) return
      client.ensureStreamEventRegistered("interactive.response")
      const receive = (payload: unknown) => {
        if (!payload || typeof payload !== "object" || !("response" in payload)) return
        const result = InteractiveResponseSchema.safeParse(payload.response)
        if (result.success && result.data.chatId === recipientRef.current?.id) setReply(result.data)
      }
      client.ev.on("interactive.response", receive)
      dispose = () => { client.ev.off("interactive.response", receive) }
    }).catch(() => { /* The send result still reports connection failures. */ })
    return () => { active = false; dispose?.() }
  }, [open, available, interactive])
  useEffect(() => { setReply(null); setSubmitted(undefined); setError("") }, [recipient?.id])
  useEffect(() => { if (recipient) setQuery(redactName(recipient.name, recipient.id)) }, [privacyMode, recipient, redactName])
  const send = async () => {
    if (!recipient || !valid || !available || sending) return
    setSending(true); setError(""); setSubmitted(undefined); setReply(null)
    try { setSubmitted(await onSend(recipient.id)) }
    catch (error) { setError(error instanceof Error ? error.message : "The message couldn't be sent.") }
    finally { setSending(false) }
  }
  const search = query.toLocaleLowerCase().trim()
  const items = chats.filter(chat => (chat.name + " " + chat.id).toLocaleLowerCase().includes(search)).slice(0, 50)
  const manual = normalizeRecipient(query)
  if (manual && !items.some(item => item.id === manual)) items.unshift({ id: manual, name: query.trim() })
  const label = (item: Recipient) => redactName(item.name, item.id)
  return <DetailSheet title="Send to chat" description="Choose the recipient for this message." open={open} onOpenChange={(next, details) => {
    if (sending && !next) { details.cancel(); return }
    onOpenChange(next)
  }} footer={<Button disabled={!recipient || !valid || !available || sending} onClick={() => void send()}>{sending ? "Sending…" : "Send message"}</Button>}>
    <div className="space-y-5">
      {!available && <p role="status" className="text-sm text-text-secondary">{isDemo ? "Sending is unavailable in demo mode." : "Connect WhatsApp before sending. You can keep editing and copying code."}</p>}
      {!valid && <p role="alert" className="text-sm text-status-rose-text">Finish the highlighted fields before sending.</p>}
      <div className="space-y-2">
        <label htmlFor="studio-recipient" className="text-sm font-medium">Recipient</label>
        <Combobox.Root<Recipient> items={items} filter={null} value={recipient} inputValue={query} itemToStringLabel={label}
          isItemEqualToValue={(a, b) => a.id === b.id}
          onInputValueChange={(value, details) => { setQuery(value); if (details.reason === "input-change" || details.reason === "input-clear") setRecipient(null) }}
          onValueChange={value => { setRecipient(value); if (value) setQuery(label(value)) }}>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border px-3">
            <Combobox.Input id="studio-recipient" placeholder="Search chats or enter an international number" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Combobox.Trigger aria-label="Show recipients" className="p-2"><ChevronDown className="size-4" /></Combobox.Trigger>
          </div>
          <Combobox.Portal><Combobox.Positioner sideOffset={4} className="z-50 w-(--anchor-width) max-w-[calc(100vw-2rem)]"><Combobox.Popup className="rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
            <Combobox.Empty className="p-3 text-sm text-text-secondary">{loadingChats ? "Loading chats…" : "Enter a full chat ID or a number with its country code."}</Combobox.Empty>
            <Combobox.List className="max-h-64 overflow-y-auto">{(item: Recipient) => <Combobox.Item key={item.id} value={item} className="flex min-h-11 cursor-default items-center gap-3 rounded-md p-3 text-sm outline-none data-highlighted:bg-muted">
              <span className="min-w-0 flex-1"><span className="block truncate">{label(item)}</span><span className="block text-xs text-text-secondary">{redact(item.id)}</span></span><Combobox.ItemIndicator><Check className="size-4" /></Combobox.ItemIndicator>
            </Combobox.Item>}</Combobox.List>
          </Combobox.Popup></Combobox.Positioner></Combobox.Portal>
        </Combobox.Root>
        {recipient && <p className="text-sm text-text-secondary">{"Selected: " + redact(recipient.id)}</p>}
        {chatError && <p role="status" className="text-sm text-text-secondary">{chatError + " You can still enter a recipient."}</p>}
      </div>
      {error && <p role="alert" className="text-sm text-status-rose-text">{error}</p>}
      {submitted !== undefined && <section className="space-y-2" aria-live="polite"><h3 className="text-sm font-semibold">Message submitted</h3>
        <pre className="overflow-auto whitespace-pre-wrap break-all rounded-lg border p-3 text-xs">{privacyMode ? "Result hidden while privacy mode is on." : JSON.stringify(submitted, null, 2)}</pre></section>}
      {reply && <section className="space-y-2" aria-live="polite"><h3 className="text-sm font-semibold">Reply received in this chat</h3><pre className="overflow-auto whitespace-pre-wrap break-all rounded-lg border p-3 text-xs">{privacyMode ? "Reply hidden while privacy mode is on." : JSON.stringify(reply, null, 2)}</pre></section>}
    </div>
  </DetailSheet>
}

function normalizeRecipient(value: string) {
  const text = value.trim()
  if (/^[^\s@]+@(c\.us|g\.us|lid)$/.test(text)) return text
  if (/^\+[1-9][\d\s()-]{6,18}$/.test(text)) return text.replace(/\D/g, "") + "@c.us"
  return null
}
