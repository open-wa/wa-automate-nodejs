import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useMemo } from "react"
import { Search, LayoutGrid, List, Building2, UserCheck, Globe } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { useDemo } from "@/lib/demo/use-demo"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { demoContacts } from "@/lib/demo/demo-data"
import { toast } from "sonner"

export const Route = createFileRoute("/contacts")({ component: ContactsPage })

type Contact = {
  id: string
  name: string
  pushname: string
  shortName?: string
  formattedName?: string
  isBusiness: boolean
  isMyContact: boolean
  isWAContact: boolean
  type?: string
}

function ContactsPage() {
  const { connected, ask } = useSocket()
  const { isDemo } = useDemo()
  const { privacyMode, redactName, redact } = usePrivacy()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(false)
  const [filterBusiness, setFilterBusiness] = useState(false)
  const [filterMyContacts, setFilterMyContacts] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setContacts(demoContacts as Contact[])
      return
    }
    if (!connected) return
    setLoading(true)
    ask<Contact[]>("getAllContacts")
      .then((data) => {
        // Deduplicate by ID — API can return the same contact twice
        const seen = new Map<string, Contact>()
        for (const c of data || []) {
          const idStr = (typeof c.id === "object" && c.id ? (c.id as any)._serialized : c.id) || (c as any)._serialized
          if (!idStr || seen.has(idStr)) continue
          seen.set(idStr, {
            id: idStr,
            name: c.name || c.formattedName || c.pushname || idStr,
            pushname: c.pushname || "",
            shortName: c.shortName || "",
            formattedName: c.formattedName || "",
            isBusiness: c.isBusiness || false,
            isMyContact: c.isMyContact || false,
            isWAContact: c.isWAContact || false,
            type: c.type || "",
          })
        }
        const list = Array.from(seen.values())
        setContacts(list.sort((a: Contact, b: Contact) => a.name.localeCompare(b.name)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [connected, ask, isDemo])

  const filtered = useMemo(() => {
    let result = contacts
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.pushname.toLowerCase().includes(q) ||
          c.id.includes(q),
      )
    }
    if (filterBusiness) result = result.filter((c) => c.isBusiness)
    if (filterMyContacts) result = result.filter((c) => c.isMyContact)
    return result
  }, [contacts, search, filterBusiness, filterMyContacts])

  const handleContactClick = (contact: Contact) => {
    if (privacyMode) {
      navigator.clipboard.writeText(contact.id).then(() => {
        toast.success("Chat ID copied to clipboard")
      }).catch(() => {
        toast.error("Failed to copy")
      })
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {filtered.length}
          </span>
          {isDemo && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Demo
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Browse and search your WhatsApp contacts</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Filters */}
        <button
          onClick={() => setFilterBusiness(!filterBusiness)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            filterBusiness
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building2 size={13} />
          Business
        </button>
        <button
          onClick={() => setFilterMyContacts(!filterMyContacts)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            filterMyContacts
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <UserCheck size={13} />
          My Contacts
        </button>

        {/* View Toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Globe size={40} className="opacity-30" />
          <p className="text-sm">{connected || isDemo ? "No contacts match your filters" : "Connect to see contacts"}</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              privacyMode={privacyMode}
              redactName={redactName}
              redact={redact}
              onClick={handleContactClick}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {filtered.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              privacyMode={privacyMode}
              redactName={redactName}
              redact={redact}
              onClick={handleContactClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Grid Card ───────────────────────────────────────────────────
function ContactCard({
  contact,
  privacyMode,
  redactName,
  redact: _redact,
  onClick,
}: {
  contact: Contact
  privacyMode: boolean
  redactName: (name: string, id?: string) => string
  redact: (value: string) => string
  onClick: (contact: Contact) => void
}) {
  const displayName = redactName(contact.name, contact.id)
  const displayPushname = redactName(contact.pushname, contact.id)
  const initials = privacyMode ? "••" : getInitials(contact.name)
  const color = getAvatarColor(contact.name)

  return (
    <div
      className={`group rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20 ${privacyMode ? "cursor-pointer" : ""}`}
      onClick={() => onClick(contact)}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-3 flex size-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: privacyMode ? "hsl(0, 0%, 45%)" : color }}
        >
          {initials}
        </div>
        <h3 className="text-sm font-semibold leading-tight truncate max-w-full">{displayName}</h3>
        {contact.pushname && contact.pushname !== contact.name && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-full">~{displayPushname}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5">
          {contact.isBusiness && (
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Business
            </span>
          )}
          {contact.isMyContact && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── List Row ────────────────────────────────────────────────────
function ContactRow({
  contact,
  privacyMode,
  redactName,
  redact,
  onClick,
}: {
  contact: Contact
  privacyMode: boolean
  redactName: (name: string, id?: string) => string
  redact: (value: string) => string
  onClick: (contact: Contact) => void
}) {
  const displayName = redactName(contact.name, contact.id)
  const displayPushname = redactName(contact.pushname, contact.id)
  const displayId = redact(contact.id.replace("@c.us", ""))
  const initials = privacyMode ? "••" : getInitials(contact.name)
  const color = getAvatarColor(contact.name)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${privacyMode ? "cursor-pointer" : ""}`}
      onClick={() => onClick(contact)}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: privacyMode ? "hsl(0, 0%, 45%)" : color }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {contact.isBusiness && (
            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Business
            </span>
          )}
        </div>
        {contact.pushname && contact.pushname !== contact.name && (
          <p className="text-xs text-muted-foreground">~{displayPushname}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground font-mono">
        {displayId}
      </span>
    </div>
  )
}

// ─── Utilities ───────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 55%, 50%)`
}
