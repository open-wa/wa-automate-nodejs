import { Outlet, createRootRoute } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { ConnectionBadge } from "@/components/connection-badge"
import { SessionLicenseBadge } from "@/components/session-license-badge"
import { ReportIssueDialog } from "@/components/report-issue-dialog"
import { Separator } from "@/components/ui/separator"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { DemoToggle } from "@/components/demo-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { PrivacyProvider } from "@/lib/hooks/use-privacy"
import { Toaster } from "@/components/ui/sonner"
import { useMessageToasts } from "@/lib/hooks/use-message-toasts"
import { MoreHorizontal } from "lucide-react"
import { CallingProvider, useCalling } from "@/lib/hooks/use-calling"
import type { CSSProperties } from "react"
import { CallIsland } from "@/components/call-island"
import { Popover, PopoverContent, PopoverTrigger } from "@open-wa/ui-components/popover"

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      port: search.port ? Number(search.port) : undefined,
      demo: search.demo === 'true' || search.demo === true,
    }
  },
  component: RootComponent,
})

function MessageToastListener() {
  useMessageToasts()
  return null
}

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="wa-dashboard-theme">
      <PrivacyProvider>
        <CallingProvider>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-primary/15 bg-background/95 px-2 sm:px-4 shadow-[0_1px_0_rgb(37_99_235_/_0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <SidebarTrigger className="-ms-2" />
                <Separator orientation="vertical" className="mx-1 h-4 sm:mx-2" />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <h1 className="min-w-0 truncate text-sm font-medium">open-wa Dashboard</h1>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <ReportIssueDialog />
                    <SessionLicenseBadge />
                    <div className="hidden items-center gap-2 md:flex">
                      <PrivacyToggle />
                      <DemoToggle />
                      <ThemeToggle />
                      <ConnectionBadge />
                    </div>
                    <HeaderOverflow />
                  </div>
                </div>
              </header>
              <DashboardOutlet />
            </SidebarInset>
            <CallIsland />
          </SidebarProvider>
        </TooltipProvider>
        <MessageToastListener />
        <Toaster position="bottom-right" />
        </CallingProvider>
      </PrivacyProvider>
    </ThemeProvider>
  )
}

function DashboardOutlet() {
  const { call, pendingPeer } = useCalling()
  const space = call || pendingPeer ? '4.5rem' : '0rem'
  return <div className="min-w-0 flex-1 overflow-auto" style={{ '--call-dock-space': space, paddingTop: space } as CSSProperties}><Outlet /></div>
}

function HeaderOverflow() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="More dashboard controls"
          className="inline-flex size-8 items-center justify-center rounded-md border border-input bg-background/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-64 p-2">
        <div className="flex flex-col gap-2 [&>div>button]:w-full [&>div>button]:justify-start">
          <div><PrivacyToggle /></div>
          <div><DemoToggle /></div>
          <div><ThemeToggle /></div>
          <div><ConnectionBadge /></div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
