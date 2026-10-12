import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { setTheme } = useTheme()
  const toggle = () =>
    setTheme(
      document.documentElement.classList.contains("dark") ? "light" : "dark"
    )
  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      className={collapsed ? "relative" : "relative w-full justify-start"}
      onClick={toggle}
      aria-label="Switch color theme"
      title={collapsed ? "Switch color theme" : undefined}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
      {!collapsed && <span>Switch theme</span>}
    </Button>
  )
}
