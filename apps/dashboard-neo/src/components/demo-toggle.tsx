import { FlaskConical } from "lucide-react"
import { useNavigate, useSearch } from "@tanstack/react-router"

/**
 * Demo mode toggle button for the header bar.
 * Uses TanStack Router search params so the `demo` flag
 * survives page navigation automatically.
 */
export function DemoToggle() {
  const search = useSearch({ from: "__root__" }) as { demo?: boolean }
  const navigate = useNavigate()
  const isDemo = search.demo === true

  const toggle = () => {
    navigate({
      to: window.location.pathname.replace(/^\/dashboard/, "") || "/",
      search: isDemo ? { demo: false } : { demo: true },
    } as any)
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium shadow-sm transition-all ${
        isDemo
          ? "border-amber-500/40 bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
          : "border-input bg-background/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      title={isDemo ? "Disable demo mode" : "Enable demo mode"}
    >
      <FlaskConical className="size-3.5" />
      <span>Demo</span>
    </button>
  )
}
