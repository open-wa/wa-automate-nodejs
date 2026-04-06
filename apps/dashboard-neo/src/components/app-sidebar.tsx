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
} from "lucide-react"

const navItems = [
  {
    group: "Overview",
    items: [
      { title: "Session", href: "/", icon: <Zap size={18} /> },
      { title: "Health", href: "/health", icon: <HeartPulse size={18} /> },
      { title: "Events", href: "/events", icon: <Activity size={18} /> },
    ],
  },
  {
    group: "Developer",
    items: [
      { title: "API Docs", href: "/api-docs", icon: <BookOpen size={18} /> },
      { title: "Playground", href: "/playground", icon: <FlaskConical size={18} /> },
      { title: "Debug", href: "/debug", icon: <Bug size={18} /> },
    ],
  },
  {
    group: "Communication",
    items: [
      { title: "Chat", href: "/chat", icon: <MessageSquare size={18} /> },
      { title: "Contacts", href: "/contacts", icon: <Contact size={18} /> },
      { title: "Portal", href: "/portal", icon: <Tv size={18} /> },
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
      icon: page.icon ?? <Puzzle size={18} />,
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
      icon: <Plug size={18} />,
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
                      <SidebarMenuButton isActive={isActive} render={<Link to={item.href} />}>
                        <span className="text-base">{item.icon}</span>
                        <span>{item.title}</span>
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
                      <SidebarMenuButton isActive={isActive} render={<Link to={item.href} />}>
                        <span className="text-base">{item.icon}</span>
                        <span>{item.title}</span>
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
