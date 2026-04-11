import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { getClient } from "@/lib/api-client"
import { toast } from "sonner"

export const Route = createFileRoute("/chat")({ component: ChatPage })

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
  const { privacyMode, redactName, redact } = usePrivacy()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatSearch, setChatSearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch chats
  useEffect(() => {
    if (!connected) return
    setLoading(true)
    ask<ChatItem[]>("getAllChats")
      .then((data) => {
        const chatList = (data || []).map((c: any) => ({
          id: c.id || c._serialized,
          name: c.name || c.formattedTitle || c.id,
          lastMessage: c.lastMessage?.body,
          timestamp: c.lastMessage?.timestamp,
          unreadCount: c.unreadCount || 0,
        }))
        setChats(chatList.sort((a: ChatItem, b: ChatItem) => (b.timestamp || 0) - (a.timestamp || 0)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [connected, ask])

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat || !connected) return
    ask<MessageItem[]>("getAllMessages", { chatId: selectedChat.id, includeMe: true, includeNotifications: false })
      .then((data) => {
        const msgs = (data || []).map((m: any) => ({
          id: m.id || m._serialized || String(Math.random()),
          body: m.body || "",
          fromMe: m.fromMe || false,
          timestamp: m.timestamp || 0,
          sender: m.sender?.pushname || m.sender?.formattedName,
          type: m.type || "chat",
        })).slice(-50)
        setMessages(msgs)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      })
      .catch(() => {})
  }, [selectedChat, connected, ask])

  // Listen for new messages
  useEffect(() => {
    if (!connected) return
    getClient().then((client) => {
      client.listen("onMessage" as any, (msg: any) => {
        if (msg.chatId === selectedChat?.id || msg.chat?.id === selectedChat?.id) {
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
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
        }
      })
    })
  }, [connected, selectedChat])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedChat) return
    try {
      await ask("sendText", { to: selectedChat.id, content: input })
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          body: input,
          fromMe: true,
          timestamp: Date.now() / 1000,
          type: "chat",
        },
      ])
      setInput("")
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch {
      // Error sending
    }
  }, [input, selectedChat, ask])

  const filteredChats = chatSearch
    ? chats.filter((c) => c.name.toLowerCase().includes(chatSearch.toLowerCase()))
    : chats

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Chat List */}
      <div className="flex w-80 flex-col border-e">
        <div className="border-b p-3">
          <input
            type="text"
            placeholder="Search chats..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className="h-8 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {connected ? "No chats found" : "Connect to see chats"}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setSelectedChat(chat)
                  if (privacyMode) {
                    navigator.clipboard.writeText(chat.id).then(() => {
                      toast.success("Chat ID copied to clipboard")
                    }).catch(() => {})
                  }
                }}
                className={`flex w-full items-center gap-3 border-b px-3 py-3 text-start transition-colors hover:bg-muted/50 ${
                  selectedChat?.id === chat.id ? "bg-primary/10" : ""
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {privacyMode ? "••" : chat.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{redactName(chat.name, chat.id)}</span>
                    {(chat.unreadCount ?? 0) > 0 && (
                      <span className="ms-2 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex flex-1 flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                {privacyMode ? "••" : selectedChat.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{redactName(selectedChat.name, selectedChat.id)}</div>
                <div className="text-[10px] text-muted-foreground">{redact(selectedChat.id)}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex flex-col gap-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        msg.fromMe
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted"
                      }`}
                    >
                      {msg.sender && !msg.fromMe && (
                        <div className="mb-0.5 text-[10px] font-semibold text-primary">{privacyMode ? "REDACTED" : msg.sender}</div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{msg.body || `[${msg.type}]`}</div>
                      <div
                        className={`mt-1 text-end text-[10px] ${
                          msg.fromMe ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="h-10 flex-1 rounded-lg border bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="flex justify-center mb-2 opacity-50">
                <MessageSquare size={48} />
              </div>
              <p className="mt-2 text-sm">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
