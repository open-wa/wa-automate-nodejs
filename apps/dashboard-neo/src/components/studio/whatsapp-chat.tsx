import type { ReactNode } from "react"
import { Clock3, UserRound } from "lucide-react"

export function WhatsAppChat({ children }: { children: ReactNode }) {
  return <div className="studio-wa-chat" aria-label="WhatsApp chat preview">
    <div className="studio-wa-header">
      <div className="studio-wa-avatar" aria-hidden><UserRound /></div>
      <div className="studio-wa-contact"><strong>Example chat</strong><span>WhatsApp Web preview</span></div>
      <span className="studio-wa-preview-tag">Preview</span>
    </div>
    <div className="studio-wa-wallpaper">
      <div className="studio-wa-date">Nothing sent to WhatsApp</div>
      <div className="studio-wa-messages">{children}</div>
    </div>
  </div>
}

export function WhatsAppMessageMeta() {
  return <div className="studio-wa-message-meta"><Clock3 aria-hidden /><span>Not sent</span></div>
}
