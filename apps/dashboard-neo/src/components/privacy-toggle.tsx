import { EyeOff, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivacy } from "@/lib/hooks/use-privacy"

export function PrivacyToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { privacyMode, togglePrivacy } = usePrivacy()
  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      className={collapsed ? "" : "w-full justify-start"}
      onClick={togglePrivacy}
      aria-pressed={privacyMode}
      aria-label={
        privacyMode ? "Turn off privacy mode" : "Turn on privacy mode"
      }
      title={collapsed ? "Privacy mode" : undefined}
    >
      {privacyMode ? <EyeOff /> : <Eye />}
      {!collapsed && <span>Privacy {privacyMode ? "on" : "off"}</span>}
    </Button>
  )
}
