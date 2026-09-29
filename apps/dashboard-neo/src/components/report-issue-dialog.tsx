import { useDemo } from "@/lib/demo/use-demo"
import { useMemo, useState } from "react"
import { Bug, Clipboard, Download, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@open-wa/ui-components/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@open-wa/ui-components/dialog"
import { useDiagnostics, type DiagnosticError } from "@/lib/hooks/use-diagnostics"
import { buildBugReportPayload, buildGitHubReportUrl, payloadAsText } from "@/lib/report-issue"

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function ReportIssueDialog() {
  const diagnostics = useDiagnostics()
  const { isDemo } = useDemo()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reproduction, setReproduction] = useState("")
  const [expected, setExpected] = useState("")
  const [notice, setNotice] = useState<string | null>(null)

  const selected = selectedId === "manual"
    ? null
    : diagnostics.errors.find((error) => error.id === selectedId) || diagnostics.errors[0] || null
  const payload = useMemo(
    () => selected ? buildBugReportPayload(selected, diagnostics.environment, { reproduction, expected }) : null,
    [selected, diagnostics.environment, reproduction, expected],
  )
  const manualPayload = useMemo(
    () => selected ? null : buildBugReportPayload({
      id: "manual",
      message: "User reported a dashboard issue",
      stack: null,
      context: [],
      method: null,
      route: null,
      component: null,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      count: 1,
      source: "not collected",
    }, diagnostics.environment, { reproduction, expected }),
    [selected, diagnostics.environment, reproduction, expected],
  )
  const basePayload = payload || manualPayload
  const activePayload = basePayload && isDemo
    ? {
        ...basePayload,
        title: `DEMO / SIMULATED DATA: ${basePayload.title}`,
        curr_b: `DEMO / SIMULATED DATA. This report contains illustrative values, not live session diagnostics.\n\n${basePayload.curr_b}`,
        extra: `DEMO / SIMULATED DATA. Do not treat these values as a real incident.\n\n${basePayload.extra.replace("Error-history source: server history.", "Error-history source: simulated demo fixture.")}`,
      }
    : basePayload
  const reportLink = useMemo(() => activePayload ? buildGitHubReportUrl(activePayload) : null, [activePayload])
  const templateUrl = useMemo(
    () => activePayload
      ? `https://github.com/open-wa/wa-automate-nodejs/issues/new?template=bug_report.yaml&title=${encodeURIComponent(activePayload.title)}`
      : "https://github.com/open-wa/wa-automate-nodejs/issues/new?template=bug_report.yaml",
    [activePayload],
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedId(diagnostics.errors[0]?.id || null)
      setNotice(null)
    }
    setOpen(nextOpen)
  }

  const copyDiagnostics = async () => {
    if (!activePayload) return
    const text = payloadAsText(activePayload)
    try {
      await navigator.clipboard.writeText(text)
      setNotice("Sanitized diagnostics copied. Paste them into the GitHub report's log field or attach the downloaded file.")
    } catch {
      setNotice("Clipboard access was unavailable. Download the sanitized diagnostics instead.")
    }
  }

  const downloadDiagnostics = () => {
    if (!activePayload) return
    const blob = new Blob([payloadAsText(activePayload)], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "open-wa-dashboard-diagnostics.txt"
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice("Sanitized diagnostics downloaded. Attach the file to the editable GitHub report.")
  }

  const selectError = (error: DiagnosticError) => {
    setSelectedId(error.id)
    setNotice(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" aria-label="Report issue" className="gap-1.5 text-muted-foreground">
          <Bug size={14} />
          <span className="hidden sm:inline">Report issue</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="top-4 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl translate-y-0 gap-0 overflow-y-auto rounded-2xl p-0">
            <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
              <div>
                <DialogTitle className="text-lg font-semibold">{isDemo ? "Preview a demo issue report" : "Report an issue"}</DialogTitle>
                <DialogDescription className="mt-1">{isDemo ? "These are simulated errors. Switch off Demo to report a real session." : "Select an error, describe what happened, then review the details before opening GitHub."}</DialogDescription>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[20rem_1fr]">
              <aside className="border-b p-5 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Recent errors</p>
                    <p className="mt-1 text-xs text-muted-foreground">Session event history · up to {diagnostics.captureLimit} grouped errors. Process logger history is not complete.</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Refresh diagnostics" onClick={() => void diagnostics.refresh()}><RefreshCw size={14} /></Button>
                </div>

                {diagnostics.errors.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed p-4 text-sm">
                    <p className="font-medium">
                      {!diagnostics.connected
                        ? "Session disconnected"
                        : diagnostics.serverDiagnosticsAvailable
                          ? "No captured errors"
                          : diagnostics.environment.metadata.diagnostics === "available"
                            ? "Server capture is inactive"
                            : "Diagnostics unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {!diagnostics.connected
                        ? "Reconnect the selected session to load its diagnostic history."
                        : diagnostics.serverDiagnosticsAvailable
                          ? "No errors have been captured for this selected session."
                          : diagnostics.environment.metadata.diagnostics === "available"
                            ? "The diagnostic endpoint responded, but the session event bridge is not attached."
                            : diagnostics.environment.metadata.diagnostics === "unauthorized"
                              ? "Captured server history requires the configured API key. Check the connection settings, then refresh."
                              : "Captured server history is unavailable. Check the connection, then refresh."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-2">
                    {diagnostics.errors.map((error) => (
                      <button
                        key={error.id}
                        type="button"
                        onClick={() => selectError(error)}
                        className={`w-full rounded-2xl border p-3 text-left transition-colors ${selected?.id === error.id ? "border-primary bg-primary/8" : "border-border hover:bg-muted/60"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 text-xs font-semibold">{error.message}</span>
                          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">×{error.count}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">{isDemo ? "simulated demo data" : error.source}</p>
                        <p className="mt-2 text-[10px] text-muted-foreground">First {formatTimestamp(error.firstSeen)} · Last {formatTimestamp(error.lastSeen)}</p>
                        {(error.method || error.route || error.component) && <p className="mt-1 truncate text-[10px] text-muted-foreground">{[error.method, error.route, error.component].filter(Boolean).join(" · ")}</p>}
                      </button>
                    ))}
                  </div>
                )}

                {diagnostics.errors.length > 0 && !diagnostics.connected && (
                  <div className="mt-4 rounded-2xl border border-dashed p-3 text-xs text-muted-foreground">
                    The selected session is disconnected. Captured errors remain available for review; reconnecting refreshes this session's diagnostics.
                  </div>
                )}
                {diagnostics.connected && !diagnostics.serverDiagnosticsAvailable && (
                  <div className="mt-4 rounded-2xl border border-dashed p-3 text-xs text-muted-foreground">
                    {diagnostics.environment.metadata.diagnostics === "available"
                      ? "The diagnostic endpoint responded, but the session event bridge is not attached. Live captured events may still be listed."
                      : diagnostics.environment.metadata.diagnostics === "unauthorized"
                        ? "Server error history requires the configured API key. Live captured events may still be listed; check connection settings and refresh."
                        : "Server error history is unavailable. Live captured events may still be listed; check the connection and refresh."}
                  </div>
                )}

                <button type="button" className="mt-5 text-xs font-medium text-primary underline-offset-4 hover:underline" onClick={() => { setSelectedId("manual"); setNotice("Describe the new issue below; no captured error will be attached.") }}>
                  Report another issue
                </button>
              </aside>

              <section className="min-w-0 space-y-5 p-5 md:p-6">
                <ReportAnswersFields reproduction={reproduction} expected={expected} setReproduction={setReproduction} setExpected={setExpected} />
                {!selected ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">No captured error is selected. Available session details will still be included.</div>
                    <div className="rounded-2xl border bg-muted/30 p-4"><p className="text-sm font-semibold">Technical details to include</p><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-100">{payloadAsText(activePayload!)}</pre><p className="mt-3 text-[11px] text-muted-foreground">Review these details before sharing them. Unavailable fields are marked.</p></div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
                      {reportLink?.tooLong ? (
                        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-amber-700 dark:text-amber-300"><span>The report is too long for a reliable URL; attach copied or downloaded diagnostics after opening the template.</span><Button type="button" variant="outline" size="sm" disabled={!reproduction.trim() || !expected.trim()} onClick={() => window.open(templateUrl, "_blank", "noopener,noreferrer")}>Open template <ExternalLink size={13} /></Button></div>
                      ) : (
                        <Button type="button" size="sm" disabled={!reproduction.trim() || !expected.trim()} onClick={() => reportLink && window.open(reportLink.url, "_blank", "noopener,noreferrer")}>
                          Continue to GitHub <ExternalLink size={14} />
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void copyDiagnostics()}><Clipboard size={14} /> Copy diagnostics</Button>
                        <Button type="button" variant="outline" size="sm" onClick={downloadDiagnostics}><Download size={14} /> Download diagnostics</Button>
                      </div>
                    </div>
                    {notice && <p className="text-xs text-muted-foreground" role="status">{notice}</p>}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">Technical details to include</p>
                        <span className="text-xs text-muted-foreground">{selected.count} occurrence{selected.count === 1 ? "" : "s"} · {formatTimestamp(selected.firstSeen)} – {formatTimestamp(selected.lastSeen)}</span>
                      </div>
                      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-[11px] leading-relaxed text-slate-100">{payloadAsText(activePayload!)}</pre>
                      <p className="mt-3 text-[11px] text-muted-foreground">Captured details and report answers are sanitized. Review the complete payload before sharing it.</p>
                    </div>

                    

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => void copyDiagnostics()}><Clipboard size={14} /> Copy diagnostics</Button>
                        <Button type="button" variant="outline" size="sm" onClick={downloadDiagnostics}><Download size={14} /> Download diagnostics</Button>
                      </div>
                      {reportLink?.tooLong ? (
                        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-amber-700 dark:text-amber-300"><span>Payload is too long for a reliable GitHub URL; copy or download it, then attach it after opening the template.</span><Button type="button" variant="outline" size="sm" disabled={!reproduction.trim() || !expected.trim()} onClick={() => window.open(templateUrl, "_blank", "noopener,noreferrer")}>Open template <ExternalLink size={13} /></Button></div>
                      ) : (
                        <Button type="button" size="sm" disabled={!reproduction.trim() || !expected.trim()} onClick={() => reportLink && window.open(reportLink.url, "_blank", "noopener,noreferrer")}>
                          Continue to GitHub <ExternalLink size={14} />
                        </Button>
                      )}
                    </div>
                    {notice && <p className="text-xs text-muted-foreground" role="status">{notice}</p>}
                  </div>
                )}
              </section>
            </div>
      </DialogContent>
    </Dialog>
  )
}

function ReportAnswersFields({
  reproduction,
  expected,
  setReproduction,
  setExpected,
}: {
  reproduction: string
  expected: string
  setReproduction: (value: string) => void
  setExpected: (value: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2 text-sm font-medium">
        Steps to reproduce <span className="text-destructive">*</span>
        <textarea value={reproduction} onChange={(event) => setReproduction(event.target.value)} rows={3} placeholder="What did you do before the error appeared? Include the method or route you called." className="w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/30" />
      </label>
      <label className="space-y-2 text-sm font-medium">
        Expected behavior <span className="text-destructive">*</span>
        <textarea value={expected} onChange={(event) => setExpected(event.target.value)} rows={3} placeholder="What did you expect to happen? If you aren't sure, say that." className="w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/30" />
      </label>
    </div>
  )
}
