import { useState } from "react"
import { ExternalLink, ShieldCheck, Ticket } from "lucide-react"
import { Button } from "@open-wa/ui-components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@open-wa/ui-components/popover"
import { useLicense } from "@/lib/hooks/use-license"
import { useSession } from "@/lib/hooks/use-session"

// The first-party docs site owns the real checkout entry. Only non-secret
// session context is forwarded; API/licence keys never leave the dashboard.
const CHECKOUT_ORIGIN = "https://openwa.dev/checkout"

function buildCheckoutUrl(sessionId: string | null, hostNumber: string | null) {
  const url = new URL(CHECKOUT_ORIGIN)
  const session = sessionId?.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 160)
  const phone = hostNumber?.replace(/\D/g, "").slice(0, 32)
  if (session) url.searchParams.set("session", session)
  if (phone) url.searchParams.set("phone", phone)
  return url.href
}

export function SessionLicenseBadge() {
  const license = useLicense()
  const { session } = useSession()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const checkoutUrl = buildCheckoutUrl(session.sessionId, session.hostNumber)

  const label =
    license.state === "licensed"
      ? license.tier === "insiders"
        ? license.source === "demo" ? "Demo · Insiders" : "Insiders"
        : license.source === "demo" ? "Demo · Restricted" : "Restricted"
      : license.state === "unlicensed"
        ? "No licence"
        : license.state === "unavailable"
          ? "Licence unavailable"
          : license.state === "unknown"
            ? "Licence unknown"
            : "Checking licence"

  const isLicensed = license.state === "licensed" && license.tier !== null
  const isUnlicensed = license.state === "unlicensed"

  return (
    <div className="flex items-center gap-1">
    <Popover open={detailsOpen} onOpenChange={setDetailsOpen}>
      <PopoverTrigger asChild>
      <Button
        type="button"
        variant={isLicensed ? "outline" : "ghost"}
        size="sm"
        className={
          isLicensed
            ? "ow-license-foil shadow-none"
            : "text-muted-foreground"
        }
        aria-expanded={detailsOpen}
        aria-label="Selected session licence status"
      >
        {isLicensed ? <Ticket size={14} /> : <ShieldCheck size={14} />}
        <span>{label}</span>
      </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 max-w-[calc(100vw-1rem)] rounded-2xl p-4 text-popover-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Selected session</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Licence status is read from this runtime session.
              </p>
            </div>
            {isLicensed && <span className="ow-license-foil rounded-md px-2 py-1 text-xs font-medium">{license.source === "demo" ? "Demo data" : "Verified"}</span>}
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-muted/40 p-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{label}</span>
            </div>
            {isLicensed && (
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">License type</span>
                <span className="font-medium">{license.tier === "insiders" ? "Insiders" : "Restricted"}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Session</span>
              <code className="max-w-44 truncate">{session.sessionId || "Unavailable"}</code>
            </div>
          </div>

          {license.detail && <p className="mt-3 text-xs text-muted-foreground">{license.detail}</p>}

          {isUnlicensed && (
            <div className="mt-4 flex flex-col items-start gap-3">
              <p className="text-xs text-muted-foreground">Choose the current open-wa offer at openwa.dev. Your session and phone are passed as support context; checkout does not preselect a license tier or fill purchase fields.</p>
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Get a license
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {license.state === "unknown" || license.state === "unavailable" ? (
            <p className="mt-4 text-xs text-muted-foreground">
              The dashboard cannot verify a tier for this session yet, so it will not label the session as unlicensed.
            </p>
          ) : null}
      </PopoverContent>
    </Popover>
    {isUnlicensed ? <a href={checkoutUrl} target="_blank" rel="noreferrer" className="hidden rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground sm:inline-flex">Get a license</a> : null}
    </div>
  )
}
