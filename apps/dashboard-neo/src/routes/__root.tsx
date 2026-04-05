import { Outlet, createRootRoute } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { SessionStatusBadge } from "@/components/session-status-badge"
import { Separator } from "@/components/ui/separator"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export const Route = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      port: search.port ? Number(search.port) : undefined,
    }
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="wa-dashboard-theme">
      <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ms-2" />
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="flex flex-1 items-center justify-between">
                  <h1 className="text-sm font-medium">open-wa Dashboard</h1>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <SessionStatusBadge />
                  </div>
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
    </ThemeProvider>
  )
}
