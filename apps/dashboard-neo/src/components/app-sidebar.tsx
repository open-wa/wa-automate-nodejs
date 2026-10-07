import { Link, useMatches, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
  Zap,
  Activity,
  HeartPulse,
  BookOpen,
  FlaskConical,
  Bug,
  MessageSquare,
  Contact,
  Tv,
  Puzzle,
  Plug,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SessionStatusBadge } from "@/components/session-status-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { useHealth } from "@/lib/hooks/use-health"
import { cn } from "@/lib/utils"

interface PluginPage {
  path: string
  title: string
  icon?: string
  order?: number
  description?: string
}

interface PluginManifestEntry {
  name: string
  version?: string
  description?: string
  pages: PluginPage[]
  hasRoutes: boolean
  tools: string[]
}

/**
 * Fetches the plugin manifest from the API server.
 * Returns empty array if the API is unreachable.
 */
function usePluginManifest() {
  const [plugins, setPlugins] = useState<PluginManifestEntry[]>([])

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const base =
          (window as unknown as { __OPENWA_API_BASE__?: string })
            .__OPENWA_API_BASE__ ?? ""
        const res = await fetch(`${base}/plugins/manifest`)
        if (res.ok) {
          const data = await res.json()
          setPlugins(data.plugins ?? [])
        }
      } catch {
        // API not available — that's fine, no plugins to show
      }
    }

    fetchManifest()
    // Refresh every 30s in case plugins are hot-loaded
    const interval = setInterval(fetchManifest, 30000)
    return () => clearInterval(interval)
  }, [])

  return plugins
}
// Adapted from Faloos's installed Board UI dashboard sidebar.
export function AppSidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean
  onClose?: () => void
}) {
  const matches = useMatches()
  const search = useSearch({ from: "__root__" })
  const currentPath = matches[matches.length - 1]?.pathname || "/"
  const plugins = usePluginManifest()
  const { mcpAvailable } = useHealth()
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState("")
  const rail = collapsed && !mobile
  const pluginItems = plugins.flatMap((plugin) =>
    plugin.pages.length
      ? [...plugin.pages]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((page) => ({
            title: page.title,
            href: `/plugins/${plugin.name}${page.path === "/" ? "" : `/${page.path.replace(/^\//, "")}`}`,
            icon: page.icon ? (
              <span className="text-lg">{page.icon}</span>
            ) : (
              <Puzzle size={20} />
            ),
          }))
      : plugin.hasRoutes
        ? [
            {
              title: plugin.name,
              href: `/plugins/${plugin.name}`,
              icon: <Plug size={20} />,
            },
          ]
        : []
  )
  const groups = [
    {
      label: "Session",
      items: [
        { title: "Overview", href: "/", icon: <Zap size={20} /> },
        { title: "Health", href: "/health", icon: <HeartPulse size={20} /> },
        { title: "Live events", href: "/events", icon: <Activity size={20} /> },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Chats", href: "/chat", icon: <MessageSquare size={20} /> },
        { title: "Contacts", href: "/contacts", icon: <Contact size={20} /> },
        { title: "Live portal", href: "/portal", icon: <Tv size={20} /> },
      ],
    },
    {
      label: "Developer tools",
      items: [
        {
          title: "API reference",
          href: "/api-docs",
          icon: <BookOpen size={20} />,
        },
        {
          title: "Playground",
          href: "/playground",
          icon: <FlaskConical size={20} />,
        },
        ...(mcpAvailable
          ? [{ title: "MCP", href: "/mcp", icon: <Bot size={20} /> }]
          : []),
        { title: "Diagnostics", href: "/debug", icon: <Bug size={20} /> },
      ],
    },
    ...(pluginItems.length ? [{ label: "Plugins", items: pluginItems }] : []),
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          rail ||
          item.title
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase().trim())
      ),
    }))
    .filter((group) => group.items.length)

  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col gap-5 border border-border-button-white bg-background-secondary-default shadow-sidebar transition-[width] duration-300 motion-reduce:transition-none",
        mobile
          ? "w-full border-0 p-3"
          : rail
            ? "w-[68px] rounded-3xl p-2"
            : "w-[260px] rounded-3xl p-3"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2",
          rail ? "flex-col" : "p-2"
        )}
      >
        <Link
          to="/"
          search={search}
          onClick={onClose}
          aria-label="open-wa overview"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-600 font-semibold text-text-white">
            W
          </span>
          {!rail && (
            <span className="text-title-3-semibold text-text-primary">
              open-wa
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            mobile
              ? "Close navigation"
              : rail
                ? "Expand navigation"
                : "Collapse navigation"
          }
          aria-expanded={!rail}
          onClick={() => (mobile ? onClose?.() : setCollapsed(!collapsed))}
        >
          {mobile ? <X /> : rail ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
      {!rail && (
        <div className="space-y-3 px-1">
          <p className="text-caption-1-semibold tracking-wide text-text-tertiary uppercase">
            Session workspace
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-text-tertiary" />
            <Input
              aria-label="Find a page"
              placeholder="Find a page…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ps-9"
            />
          </div>
        </div>
      )}
      <nav
        aria-label="Pages"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-1"
      >
        {groups.map((group, index) => (
          <section
            key={group.label}
            aria-label={group.label}
            className="space-y-1"
          >
            {rail && index > 0 && (
              <div className="mx-1 mb-3 border-t border-separator-border" />
            )}
            <h2
              className={
                rail
                  ? "sr-only"
                  : "px-2 pb-1 text-caption-1-semibold tracking-wide text-text-secondary uppercase"
              }
            >
              {group.label}
            </h2>
            {group.items.map((item) => {
              const active =
                item.href === "/"
                  ? currentPath === "/"
                  : currentPath === item.href ||
                    currentPath.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  search={search}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.title}
                  title={rail ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-2.5 overflow-hidden rounded-2lg p-2 text-body-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                    rail ? "justify-center" : "w-full",
                    active
                      ? "bg-linear-to-b from-accent-500 to-accent-600 text-text-white shadow-nav-selected"
                      : "text-text-secondary hover:bg-background-secondary-hover"
                  )}
                >
                  <span className="shrink-0" aria-hidden>
                    {item.icon}
                  </span>
                  {!rail && <span className="truncate">{item.title}</span>}
                </Link>
              )
            })}
          </section>
        ))}
        {!groups.length && (
          <p className="px-2 text-body-regular text-text-secondary">
            No pages match your search.
          </p>
        )}
      </nav>
      <footer className="flex shrink-0 flex-col gap-3 border-t border-separator-border px-1 pt-3">
        {!rail && <SessionStatusBadge />}
        <PrivacyToggle collapsed={rail} />
        <ThemeToggle collapsed={rail} />
      </footer>
    </aside>
  )
}
