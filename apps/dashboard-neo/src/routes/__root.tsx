import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { SessionStatusBadge } from "@/components/session-status-badge"
import { Separator } from "@/components/ui/separator"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "open-wa Dashboard" },
      { name: "description", content: "Session management dashboard for open-wa" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en" dir="rtl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ms-2" />
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="flex flex-1 items-center justify-between">
                  <h1 className="text-sm font-medium">open-wa Dashboard</h1>
                  <SessionStatusBadge />
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <Outlet />
              </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
