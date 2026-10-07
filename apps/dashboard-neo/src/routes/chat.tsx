import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare, ArrowLeft, Send, Loader2 } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { getClient } from "@/lib/api-client"
import { useHealth } from "@/lib/hooks/use-health"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDemo } from "@/lib/demo/use-demo"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/chat")({
  validateSearch: (search: Record<string, unknown>) => ({
    chatId: typeof search.chatId === "string" ? search.chatId : undefined,
  }),
  component: ChatPage,
})

type ChatItem = {
  id: string
  name: string
  lastMessage?: string
  timestamp?: number
  unreadCount?: number
}

type MessageItem = {
  id: string
  body: string
  fromMe: boolean
  timestamp: number
  sender?: string
  type: string
}

function ChatPage() {
  const { connected, ask } = useSocket()
  const { isDemo } = useDemo()
  const { chatId } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { canInvokeRuntime } = useHealth()
  const { privacyMode, redactName, redact } = usePrivacy()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatSearch, setChatSearch] = useState("")
  const [chatError, setChatError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [sending, setSending] = useState(false)
  const activeChat = useRef(selectedChat?.id)
  activeChat.current = selectedChat?.id
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatId)
      setSelectedChat(
        chats.find((chat) => chat.id === chatId) || { id: chatId, name: chatId }
      )
  }, [chatId, chats])

  // Fetch chats.
  useEffect(() => {
    if ((!connected || !canInvokeRuntime) && !isDemo) return
    let mounted = true
    setLoading(true)
    setChatError(null)
    ask<ChatItem[]>("getAllChats")
      .then((data) => {
        if (!mounted) return
        const chatList = (data || []).map((c: any) => ({
          id: c.id || c._serialized,
          name: c.name || c.formattedTitle || c.id,
          lastMessage: c.lastMessage?.body,
          timestamp: c.lastMessage?.timestamp,
          unreadCount: c.unreadCount || 0,
        }))
        setChats(
          chatList.sort(
            (a: ChatItem, b: ChatItem) =>
              (b.timestamp || 0) - (a.timestamp || 0)
          )
        )
      })
      .catch(() => {
        if (mounted) setChatError("Chats couldn't be loaded.")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [connected, canInvokeRuntime, ask, isDemo, refresh])

  // Fetch messages for selected chat
  useEffect(() => {
    setMessages([])
    setMessagesLoading(false)
    setMessageError(null)
    if (!selectedChat || ((!connected || !canInvokeRuntime) && !isDemo)) return
    setMessagesLoading(true)
    let mounted = true
    let scrollTimer: ReturnType<typeof setTimeout> | undefined

    ask<MessageItem[]>("getAllMessages", {
      chatId: selectedChat.id,
      includeMe: true,
      includeNotifications: false,
    })
      .then((data) => {
        if (!mounted) return

        const msgs = (data || [])
          .map((m: any) => ({
            id: m.id || m._serialized || String(Math.random()),
            body: m.body || "",
            fromMe: m.fromMe || false,
            timestamp: m.timestamp || 0,
            sender: m.sender?.pushname || m.sender?.formattedName,
            type: m.type || "chat",
          }))
          .slice(-50)
        setMessages(msgs)
        scrollTimer = setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        )
      })
      .catch(() => {
        if (mounted)
          setMessageError(
            "Messages couldn't be loaded. Your draft is still available."
          )
      })
      .finally(() => {
        if (mounted) setMessagesLoading(false)
      })

    return () => {
      mounted = false
      if (scrollTimer) clearTimeout(scrollTimer)
    }
  }, [selectedChat, connected, canInvokeRuntime, ask, isDemo, refresh])

  // Listen for new messages
  useEffect(() => {
    if (isDemo || !connected || !canInvokeRuntime) return
    let mounted = true
    let scrollTimer: ReturnType<typeof setTimeout> | undefined
    let listenerId: string | undefined
    let listenerClient: Awaited<ReturnType<typeof getClient>> | undefined

    void getClient()
      .then(async (client) => {
        listenerClient = client
        const id = await client.listen("onMessage" as any, (msg: any) => {
          if (!mounted) return

          if (
            msg.chatId === selectedChat?.id ||
            msg.chat?.id === selectedChat?.id
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: msg.id || String(Date.now()),
                body: msg.body || "",
                fromMe: msg.fromMe || false,
                timestamp: msg.timestamp || Date.now() / 1000,
                sender: msg.sender?.pushname,
                type: msg.type || "chat",
              },
            ])
            scrollTimer = setTimeout(
              () =>
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
              100
            )
          }
        })
        if (mounted) {
          listenerId = id
        } else {
          client.stopListener("onMessage" as any, id)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
      if (scrollTimer) clearTimeout(scrollTimer)
      if (listenerId)
        listenerClient?.stopListener("onMessage" as any, listenerId)
    }
  }, [connected, canInvokeRuntime, selectedChat, isDemo])

  const sendMessage = useCallback(async () => {
    if (
      !input.trim() ||
      !selectedChat ||
      sending ||
      ((!connected || !canInvokeRuntime) && !isDemo)
    )
      return
    const text = input
    const target = selectedChat.id
    setSending(true)
    try {
      const id = await ask<string>("sendText", { to: target, content: text })
      if (activeChat.current === target) {
        setMessages((previous) =>
          previous.some((message) => message.id === id)
            ? previous
            : [
                ...previous,
                {
                  id: id || String(Date.now()),
                  body: text,
                  fromMe: true,
                  timestamp: Date.now() / 1000,
                  type: "chat",
                },
              ]
        )
        setInput((previous) => (previous === text ? "" : previous))
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
      }
    } catch {
      toast.error("Message couldn't be sent. Your draft has been kept.")
    } finally {
      setSending(false)
    }
  }, [input, selectedChat, sending, connected, canInvokeRuntime, isDemo, ask])

  const filteredChats = chatSearch
    ? chats.filter((c) =>
        c.name.toLowerCase().includes(chatSearch.toLowerCase())
      )
    : chats

  return (
    <div className="flex h-full min-h-0">
      <section
        aria-label="Chat list"
        className={cn(
          "min-h-0 w-full shrink-0 flex-col border-e md:flex md:w-72 lg:w-80",
          selectedChat ? "hidden" : "flex"
        )}
      >
        <div className="space-y-3 border-b p-4">
          <h1 className="text-title-3-medium">Chats</h1>
          <Input
            type="search"
            aria-label="Search chats"
            placeholder="Search conversations…"
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div
              role="status"
              aria-label="Loading chats"
              className="space-y-3 p-4"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : chatError ? (
            <div role="alert" className="space-y-3 p-4 text-body-regular">
              <p>{chatError}</p>
              <Button
                variant="outline"
                onClick={() => setRefresh((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          ) : !filteredChats.length ? (
            <p className="p-6 text-center text-body-regular text-text-secondary">
              {(connected && canInvokeRuntime) || isDemo
                ? "No conversations match your search."
                : "Connect your WhatsApp session to see chats."}
            </p>
          ) : (
            filteredChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                disabled={sending}
                onClick={() => {
                  setSelectedChat(chat)
                  setInput("")
                  void navigate({
                    search: (previous) => ({ ...previous, chatId: chat.id }),
                  })
                }}
                aria-pressed={selectedChat?.id === chat.id}
                className={cn(
                  "h-auto w-full justify-start gap-3 rounded-none border-b px-4 py-4 text-start",
                  selectedChat?.id === chat.id &&
                    "bg-background-secondary-active"
                )}
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-body-medium"
                >
                  {privacyMode ? "••" : chat.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-body-medium">
                      {redactName(chat.name, chat.id)}
                    </span>
                    {!!chat.unreadCount && (
                      <span className="rounded-full bg-accent-600 px-1.5 text-caption-1-medium text-text-white">
                        {chat.unreadCount}
                      </span>
                    )}
                  </span>
                  {chat.lastMessage && (
                    <span className="mt-1 block truncate text-caption-1-regular text-text-secondary">
                      {privacyMode ? "Message hidden" : chat.lastMessage}
                    </span>
                  )}
                </span>
              </Button>
            ))
          )}
        </div>
      </section>
      <section
        aria-label="Conversation"
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col",
          selectedChat ? "flex" : "hidden md:flex"
        )}
      >
        {selectedChat ? (
          <>
            <header className="flex shrink-0 items-center gap-3 border-b px-4 py-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Back to chats"
                disabled={sending}
                onClick={() => {
                  setSelectedChat(null)
                  void navigate({
                    search: (previous) => ({ ...previous, chatId: undefined }),
                  })
                }}
              >
                <ArrowLeft />
              </Button>
              <div className="min-w-0">
                <h2 className="truncate text-body-medium">
                  {redactName(selectedChat.name, selectedChat.id)}
                </h2>
                <p className="truncate text-caption-1-regular text-text-tertiary">
                  {redact(selectedChat.id)}
                </p>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/25 p-4 sm:p-6">
              {messagesLoading ? (
                <div
                  role="status"
                  aria-label="Loading messages"
                  className="space-y-4"
                >
                  <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-muted" />
                  <div className="ms-auto h-16 w-2/3 animate-pulse rounded-2xl bg-muted" />
                </div>
              ) : messageError ? (
                <div
                  role="alert"
                  className="space-y-3 rounded-xl border bg-card p-5"
                >
                  <p className="text-body-regular">{messageError}</p>
                  <Button
                    variant="outline"
                    onClick={() => setRefresh((value) => value + 1)}
                  >
                    Try again
                  </Button>
                </div>
              ) : !messages.length ? (
                <p className="p-6 text-center text-body-regular text-text-secondary">
                  No messages to display in this conversation.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.fromMe
                          ? "flex justify-end"
                          : "flex justify-start"
                      }
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl border px-4 py-3 text-body-regular sm:max-w-[75%]",
                          message.fromMe
                            ? "rounded-br-md border-accent-600 bg-accent-600 text-text-white"
                            : "rounded-bl-md bg-background"
                        )}
                      >
                        {message.sender && !message.fromMe && (
                          <p className="mb-1 text-caption-1-semibold text-primary">
                            {redactName(message.sender)}
                          </p>
                        )}
                        <p className="break-words whitespace-pre-wrap">
                          {privacyMode
                            ? "Message hidden by privacy mode"
                            : message.body || `[${message.type}]`}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-end text-caption-2-regular",
                            message.fromMe
                              ? "text-white/70"
                              : "text-text-tertiary"
                          )}
                        >
                          {new Date(
                            message.timestamp * 1000
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              className="shrink-0 border-t p-4"
              onSubmit={(event) => {
                event.preventDefault()
                void sendMessage()
              }}
            >
              <div className="flex gap-2">
                <Input
                  aria-label="Message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={
                    sending || ((!connected || !canInvokeRuntime) && !isDemo)
                  }
                  placeholder={
                    isDemo ? "Write a demo message…" : "Write a message…"
                  }
                />
                <Button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    sending ||
                    ((!connected || !canInvokeRuntime) && !isDemo)
                  }
                >
                  {sending ? <Loader2 className="animate-spin" /> : <Send />}
                  <span className="hidden sm:inline">
                    {sending ? "Sending…" : "Send"}
                  </span>
                  <span className="sr-only sm:hidden">Send message</span>
                </Button>
              </div>
              {!isDemo && (!connected || !canInvokeRuntime) && (
                <p className="mt-2 text-caption-1-regular text-status-orange-text">
                  Reconnect WhatsApp to send messages.
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <MessageSquare className="size-10 text-text-tertiary" />
            <p className="text-title-3-medium">Open a conversation</p>
            <p className="max-w-sm text-body-regular text-text-secondary">
              Choose a chat or open one from a contact's detail sheet.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
