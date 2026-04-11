import { Outlet, createRootRoute } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { ConnectionBadge } from "@/components/connection-badge"
import { Separator } from "@/components/ui/separator"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { DemoToggle } from "@/components/demo-toggle"
import { PrivacyToggle } from "@/components/privacy-toggle"
import { PrivacyProvider } from "@/lib/hooks/use-privacy"
import { Toaster } from "@/components/ui/sonner"
import { useMessageToasts } from "@/lib/hooks/use-message-toasts"

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
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ms-2" />
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="flex flex-1 items-center justify-between">
                  <h1 className="text-sm font-medium">open-wa Dashboard</h1>
                  <div className="flex items-center gap-2">
                    <PrivacyToggle />
                    <DemoToggle />
                    <ThemeToggle />
                    <ConnectionBadge />
                  </div>
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <MessageToastListener />
        <Toaster position="bottom-right" />
      </PrivacyProvider>
    </ThemeProvider>
  )
}
