import {
  Outlet,
  createRootRoute,
  useMatches,
  useSearch,
} from "@tanstack/react-router"
import { Drawer } from "@base-ui/react/drawer"
import { useState } from "react"
import { Menu, SlidersHorizontal } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { ConnectionBadge } from "@/components/connection-badge"
import { SessionLicenseBadge } from "@/components/session-license-badge"
import { ReportIssueDialog } from "@/components/report-issue-dialog"
import { ThemeProvider } from "@/components/theme-provider"
import { DemoToggle } from "@/components/demo-toggle"
import { PrivacyProvider } from "@/lib/hooks/use-privacy"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/boardui/chip"
import { useMessageToasts } from "@/lib/hooks/use-message-toasts"
import { CallingProvider, useCalling } from "@/lib/hooks/use-calling"
import { CallIsland } from "@/components/call-island"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@open-wa/ui-components/popover"

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      port: search.port ? Number(search.port) : undefined,
      demo: search.demo === "true" || search.demo === true,
    }
  },
  component: RootComponent,
})

function MessageToastListener() {
  useMessageToasts()
  return null
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/health": "Health",
  "/events": "Live events",
  "/contacts": "Contacts",
  "/chat": "Chats",
  "/calls": "Calls",
  "/portal": "Live portal",
  "/api-docs": "API reference",
  "/playground": "Playground",
  "/mcp": "MCP",
  "/debug": "Diagnostics",
  "/integrations": "Integrations",
  "/apps": "Applications",
}

function Workspace() {
  const { call, pendingPeer } = useCalling()
  const callSpace = call || pendingPeer ? "4.5rem" : "0rem"
  const matches = useMatches()
  const pathname = matches[matches.length - 1]?.pathname || "/"
  const search = useSearch({ from: "__root__" })
  const [navigationOpen, setNavigationOpen] = useState(false)
  return (
    <div className="dashboard-shell">
      <div className="hidden min-h-0 md:flex">
        <AppSidebar />
      </div>
      <section className="dashboard-workspace">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-separator-border px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Drawer.Root
              open={navigationOpen}
              onOpenChange={setNavigationOpen}
              swipeDirection="left"
            >
              <Drawer.Trigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open navigation"
                    className="md:hidden"
                  />
                }
              >
                <Menu />
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Backdrop className="detail-sheet-backdrop" />
                <Drawer.Viewport className="navigation-viewport">
                  <Drawer.Popup className="navigation-popup">
                    <Drawer.Title className="sr-only">
                      Session navigation
                    </Drawer.Title>
                    <Drawer.Description className="sr-only">
                      Find a page in the session dashboard.
                    </Drawer.Description>
                    <AppSidebar
                      mobile
                      onClose={() => setNavigationOpen(false)}
                    />
                  </Drawer.Popup>
                </Drawer.Viewport>
              </Drawer.Portal>
            </Drawer.Root>
            <div className="min-w-0">
              <p className="hidden text-caption-1-regular text-text-tertiary sm:block">
                Session workspace
              </p>
              <p className="truncate text-body-medium text-text-primary">
                {PAGE_TITLES[pathname] || "Plugin workspace"}
              </p>
            </div>
            {search.demo && (
              <Chip variant="caption" color="orange">
                Demo
              </Chip>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden lg:block">
              <ConnectionBadge />
            </div>
            <SessionLicenseBadge />
            <ReportIssueDialog />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Dashboard settings"
                >
                  <SlidersHorizontal />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={12}
                className="w-72 space-y-4 rounded-2xl p-4"
              >
                <div>
                  <p className="text-body-medium">Dashboard settings</p>
                  <p className="mt-1 text-caption-1-regular text-text-secondary">
                    Connect to a server or explore sample data.
                  </p>
                </div>
                <ConnectionBadge />
                <DemoToggle />
              </PopoverContent>
            </Popover>
          </div>
        </header>
        {search.demo && (
          <div
            role="status"
            className="border-b border-separator-border bg-status-orange-background px-4 py-2 text-caption-1-regular text-status-orange-text sm:px-6"
          >
            You're viewing sample data. Turn off Demo in dashboard settings to
            return to your session.
          </div>
        )}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <CallIsland />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-auto"
            style={{ paddingTop: callSpace }}
          >
            <Outlet />
          </main>
        </div>
      </section>
    </div>
  )
}

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="wa-dashboard-theme">
      <PrivacyProvider>
        <CallingProvider>
          <TooltipProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:p-3 focus:text-primary"
            >
              Skip to content
            </a>
            <Workspace />
          </TooltipProvider>
          <MessageToastListener />
          <Toaster position="bottom-right" />
        </CallingProvider>
      </PrivacyProvider>
    </ThemeProvider>
  )
}
