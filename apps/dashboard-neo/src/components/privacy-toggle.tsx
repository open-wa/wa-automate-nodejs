import { EyeOff, Eye } from "lucide-react"
import { usePrivacy } from "@/lib/hooks/use-privacy"

/**
 * Privacy mode toggle button for the header bar.
 * When active, redacts all chat names, phone numbers, and host number.
 */
export function PrivacyToggle() {
  const { privacyMode, togglePrivacy } = usePrivacy()

  return (
    <button
      onClick={togglePrivacy}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium shadow-sm transition-all ${
        privacyMode
          ? "border-violet-500/40 bg-violet-500/15 text-violet-600 hover:bg-violet-500/25 dark:text-violet-400"
          : "border-input bg-background/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      title={privacyMode ? "Disable privacy mode" : "Enable privacy mode"}
    >
      {privacyMode ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      <span>Privacy</span>
    </button>
  )
}
