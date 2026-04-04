import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useMatches } from "@tanstack/react-router"
import { SessionStatusBadge } from "@/components/session-status-badge"
import { useEffect, useState } from "react"

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

const navItems = [
  {
    group: "Overview",
    items: [
      { title: "Session", href: "/", icon: "⚡" },
      { title: "Events", href: "/events", icon: "📡" },
    ],
  },
  {
    group: "Developer",
    items: [
      { title: "API Docs", href: "/api-docs", icon: "📖" },
      { title: "Playground", href: "/playground", icon: "🧪" },
      { title: "Debug", href: "/debug", icon: "🔧" },
    ],
  },
  {
    group: "Communication",
    items: [
      { title: "Chat", href: "/chat", icon: "💬" },
      { title: "Portal", href: "/portal", icon: "🪄" },
    ],
  },
]

/**
 * Fetches the plugin manifest from the API server.
 * Returns empty array if the API is unreachable.
 */
function usePluginManifest() {
  const [plugins, setPlugins] = useState<PluginManifestEntry[]>([])

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const base = (window as unknown as { __OPENWA_API_BASE__?: string }).__OPENWA_API_BASE__ ?? ""
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

export function AppSidebar() {
  const matches = useMatches()
  const currentPath = matches[matches.length - 1]?.pathname || "/"
  const plugins = usePluginManifest()

  // Build plugin nav items from manifest
  const pluginNavItems = plugins.flatMap((plugin) =>
    plugin.pages.map((page) => ({
      title: page.title,
      href: `/plugins/${plugin.name}${page.path === "/" ? "" : `/${page.path}`}`,
      icon: page.icon ?? "🧩",
    }))
  )

  // Also add plugins that have routes but no custom pages (show a default status page)
  const pluginsWithRoutesOnly = plugins.filter(
    (p) => p.hasRoutes && p.pages.length === 0
  )
  for (const plugin of pluginsWithRoutesOnly) {
    pluginNavItems.push({
      title: plugin.name,
      href: `/plugins/${plugin.name}`,
      icon: "🔌",
    })
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            W
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">open-wa</span>
            <span className="text-[10px] text-muted-foreground">Session Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.href}>
                          <span className="text-base">{item.icon}</span>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Dynamic plugin pages from manifest */}
        {pluginNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Plugins</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {pluginNavItems.map((item) => {
                  const isActive = currentPath.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.href}>
                          <span className="text-base">{item.icon}</span>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2">
          <SessionStatusBadge />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
