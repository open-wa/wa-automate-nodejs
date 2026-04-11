import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type PrivacyContextValue = {
  privacyMode: boolean
  togglePrivacy: () => void
  redact: (value: string) => string
  redactName: (name: string, id?: string) => string
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

const STORAGE_KEY = "wa-dashboard-privacy"

/**
 * Redacts any value that looks like a WhatsApp ID (contains @c.us, @g.us, etc.)
 * or a phone number. Returns "REDACTED" when privacy mode is on.
 */
function redactValue(value: string, enabled: boolean): string {
  if (!enabled) return value
  if (!value || value === "—") return value
  // Redact anything that contains @c.us, @g.us, @broadcast, or looks like a phone number
  if (
    value.includes("@c.us") ||
    value.includes("@g.us") ||
    value.includes("@broadcast") ||
    /^\+?\d[\d\s\-]{6,}$/.test(value.trim())
  ) {
    return "REDACTED"
  }
  return value
}

/**
 * Redacts a contact name. In privacy mode, all names are redacted.
 * If an ID is provided and it contains @c.us, the name is always redacted.
 */
function redactContactName(name: string, _id: string | undefined, enabled: boolean): string {
  if (!enabled) return name
  if (!name || name === "—") return name
  return "REDACTED"
}

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })

  const togglePrivacy = useCallback(() => {
    setPrivacyMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const redact = useCallback(
    (value: string) => redactValue(value, privacyMode),
    [privacyMode],
  )

  const redactName = useCallback(
    (name: string, id?: string) => redactContactName(name, id, privacyMode),
    [privacyMode],
  )

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy, redact, redactName }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error("usePrivacy must be used within a PrivacyProvider")
  return ctx
}
