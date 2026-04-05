import { createFileRoute } from "@tanstack/react-router"
import { Puzzle } from "lucide-react"

export const Route = createFileRoute("/apps")({ component: AppsPage })

/**
 * Apps / Plugins page — Phase 2 placeholder.
 *
 * Will eventually let users browse and install "skills" (plugins)
 * into their session at runtime.
 */
function AppsPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-4 text-muted-foreground opacity-70">
          <Puzzle size={56} />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Apps & Plugins</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse and install skills, plugins, and extensions into your running session.
        </p>
        <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/30 p-4">
          <p className="text-xs text-muted-foreground">
            🚧 Coming in Phase 2 — this feature is under development.
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Apps will be downloadable modules that extend your session with new capabilities like
            auto-replies, translation, scheduling, and more.
          </p>
        </div>
      </div>
    </div>
  )
}
