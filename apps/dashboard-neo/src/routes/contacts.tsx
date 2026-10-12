import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/boardui/table"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect, useMemo, useRef } from "react"
import {
  Search,
  LayoutGrid,
  List,
  Building2,
  UserCheck,
  Users,
  Copy,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { useDemo } from "@/lib/demo/use-demo"
import { usePrivacy } from "@/lib/hooks/use-privacy"
import { useHealth } from "@/lib/hooks/use-health"
import { demoContacts } from "@/lib/demo/demo-data"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/boardui/chip"
import { PageHeader } from "@/components/application/page-header"
import {
  DetailSheet,
  DetailSheetClose,
} from "@/components/application/detail-sheet"
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
  const { canInvokeRuntime } = useHealth()
  const { privacyMode, redactName, redact } = usePrivacy()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("list")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [filterBusiness, setFilterBusiness] = useState(false)
  const [filterMyContacts, setFilterMyContacts] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [open, setOpen] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let active = true
    setError(null)
    if (isDemo) {
      setContacts(demoContacts as Contact[])
      setLoading(false)
      return
    }
    if (!connected || !canInvokeRuntime) {
      setContacts([])
      setLoading(false)
      return
    }
    setLoading(true)
    ask<Contact[]>("getAllContacts")
      .then((data) => {
        if (!active) return
        const seen = new Map<string, Contact>()
        for (const c of data || []) {
          const id =
            typeof c.id === "object" && c.id
              ? (c.id as { _serialized?: string })._serialized
              : c.id
          if (!id || seen.has(id)) continue
          seen.set(id, {
            ...c,
            id,
            name: c.name || c.formattedName || c.pushname || id,
            pushname: c.pushname || "",
          })
        }
        setContacts(
          Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
        )
      })
      .catch(() => {
        if (active) {
          setContacts([])
          setError(
            "Contacts couldn't be loaded. Check the session connection and try again."
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [connected, canInvokeRuntime, ask, isDemo, refresh])

  useEffect(() => {
    setOpen(false)
    setSelected(null)
  }, [isDemo])

  const filtered = useMemo(
    () =>
      contacts.filter((c) => {
        const query = search.toLocaleLowerCase().trim()
        return (
          (!query ||
            `${c.name} ${c.pushname} ${c.id}`
              .toLocaleLowerCase()
              .includes(query)) &&
          (!filterBusiness || c.isBusiness) &&
          (!filterMyContacts || c.isMyContact)
        )
      }),
    [contacts, search, filterBusiness, filterMyContacts]
  )

  const copyId = async () => {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.id)
      toast.success("Chat ID copied")
    } catch {
      toast.error("Clipboard unavailable. Select the ID to copy it.")
    }
  }
  const openContact = (contact: Contact, trigger: HTMLElement) => {
    returnFocus.current = trigger
    setSelected(contact)
    setOpen(true)
  }
  const name = (contact: Contact) => redactName(contact.name, contact.id)
  const resetFilters = () => {
    setSearch("")
    setFilterBusiness(false)
    setFilterMyContacts(false)
  }

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Contacts"
        description="Find a contact, review their details, and open a conversation."
        badge={
          <Chip variant="caption">
            {loading
              ? "Loading…"
              : error || (!isDemo && (!connected || !canInvokeRuntime))
                ? "Unavailable"
                : `${contacts.length} contacts`}
          </Chip>
        }
      />
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-text-tertiary" />
          <Input
            type="search"
            aria-label="Search contacts"
            placeholder="Search by name or chat ID…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="ps-9"
          />
        </div>
        <Button
          variant={filterBusiness ? "secondary" : "ghost"}
          aria-pressed={filterBusiness}
          onClick={() => setFilterBusiness(!filterBusiness)}
        >
          <Building2 />
          Business
        </Button>
        <Button
          variant={filterMyContacts ? "secondary" : "ghost"}
          aria-pressed={filterMyContacts}
          onClick={() => setFilterMyContacts(!filterMyContacts)}
        >
          <UserCheck />
          Saved contacts
        </Button>
        <div
          className="flex gap-1 rounded-xl border bg-muted/50 p-1"
          role="group"
          aria-label="Contact layout"
        >
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid />
          </Button>
        </div>
      </div>
      {loading ? (
        <div role="status" aria-label="Loading contacts" className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border p-6">
          <p className="mb-4 text-body-regular text-text-secondary">{error}</p>
          <Button
            variant="outline"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Try again
          </Button>
        </div>
      ) : !filtered.length ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-6 text-center">
          <Users className="size-8 text-text-tertiary" />
          <h2 className="text-body-medium">
            {!isDemo && (!connected || !canInvokeRuntime)
              ? "Connect your session"
              : "No contacts found"}
          </h2>
          <p className="max-w-sm text-body-regular text-text-secondary">
            {!isDemo && (!connected || !canInvokeRuntime)
              ? "Contacts become available when WhatsApp is ready."
              : "Try another search or remove the filters."}
          </p>
          {(search || filterBusiness || filterMyContacts) && (
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-border-button-default">
          <div className="overflow-x-auto">
            <Table
              aria-label="WhatsApp contacts"
              selectionMode="none"
              size="sm"
            >
              <TableHeader>
                <TableColumn id="name" isRowHeader>
                  Contact
                </TableColumn>
                <TableColumn id="id" className="hidden sm:table-cell">
                  Chat ID
                </TableColumn>
                <TableColumn id="details" className="hidden md:table-cell">
                  Details
                </TableColumn>
                <TableColumn id="actions" textValue="Review">
                  <span className="sr-only">Review</span>
                </TableColumn>
              </TableHeader>
              <TableBody>
                {filtered.map((contact) => (
                  <TableRow
                    key={contact.id}
                    id={contact.id}
                    textValue={name(contact)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar contact={contact} privateMode={privacyMode} />
                        <span className="min-w-0 truncate font-medium">
                          {name(contact)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-text-secondary sm:table-cell">
                      {redact(contact.id)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ContactChips contact={contact} />
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) =>
                          openContact(contact, event.currentTarget)
                        }
                        aria-label={`Review ${name(contact)}`}
                      >
                        Review
                        <ArrowUpRight />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((contact) => (
            <Button
              key={contact.id}
              variant="ghost"
              onClick={(event) => openContact(contact, event.currentTarget)}
              className="h-auto flex-col items-start gap-4 rounded-2xl border border-border-button-default bg-card p-5 text-start whitespace-normal hover:border-border-button-hover"
              aria-label={`Review ${name(contact)}`}
            >
              <Avatar contact={contact} privateMode={privacyMode} />
              <span className="max-w-full truncate text-body-medium">
                {name(contact)}
              </span>
              <ContactChips contact={contact} />
            </Button>
          ))}
        </div>
      )}
      {!!filtered.length && (
        <p className="text-caption-1-regular text-text-secondary">
          Showing {filtered.length} of {contacts.length} contacts
        </p>
      )}
      <DetailSheet
        title={selected ? name(selected) : "Contact details"}
        description="Contact details from the selected WhatsApp session."
        open={open}
        onOpenChange={setOpen}
        onClosed={() => setSelected(null)}
        finalFocus={returnFocus}
        footer={
          <>
            <DetailSheetClose render={<Button variant="outline" />}>
              Close
            </DetailSheetClose>
            <Button
              variant="outline"
              onClick={() => void copyId()}
              disabled={!selected}
            >
              <Copy />
              Copy chat ID
            </Button>
            {selected && (
              <Link
                to="/chat"
                search={(previous) => ({ ...previous, chatId: selected.id })}
                className={buttonVariants()}
              >
                <MessageSquare />
                Open chat
              </Link>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar contact={selected} privateMode={privacyMode} />
              <div>
                <p className="text-title-3-medium">{name(selected)}</p>
                <ContactChips contact={selected} />
              </div>
            </div>
            <dl className="space-y-4 rounded-2xl border bg-muted/30 p-5">
              {[
                ["Chat ID", redact(selected.id)],
                [
                  "Display name",
                  redactName(selected.pushname) || "Not provided",
                ],
                [
                  "Saved name",
                  selected.isMyContact
                    ? name(selected)
                    : "Not saved in your contacts",
                ],
                [
                  "Account type",
                  selected.isBusiness ? "Business account" : "Personal account",
                ],
              ].map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <dt className="text-caption-1-regular text-text-secondary">
                    {label}
                  </dt>
                  <dd className="text-body-medium break-all select-text">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {privacyMode && (
              <p className="text-caption-1-regular text-text-secondary">
                Names and identifiers are hidden. Copy chat ID copies the
                original identifier for your use.
              </p>
            )}
          </div>
        )}
      </DetailSheet>
    </div>
  )
}

function ContactChips({ contact }: { contact: Contact }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {contact.isBusiness && (
        <Chip color="blue" variant="caption">
          Business
        </Chip>
      )}
      {contact.isMyContact && (
        <Chip color="neutral" variant="caption">
          Saved contact
        </Chip>
      )}
    </span>
  )
}

function Avatar({
  contact,
  privateMode,
}: {
  contact: Contact
  privateMode: boolean
}) {
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background-tertiary-default text-body-medium text-text-secondary"
    >
      {privateMode
        ? "••"
        : contact.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join("")
            .toUpperCase()}
    </span>
  )
}
