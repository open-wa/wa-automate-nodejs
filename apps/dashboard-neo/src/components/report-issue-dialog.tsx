import { useDemo } from "@/lib/demo/use-demo"
import { useEffect, useMemo, useRef, useState } from "react"
import { Bug, Clipboard, Download, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DetailSheet,
  DetailSheetTrigger,
} from "@/components/application/detail-sheet"
import { Textarea } from "@/components/ui/textarea"
import { Chip } from "@/components/boardui/chip"
import {
  useDiagnostics,
  type DiagnosticError,
} from "@/lib/hooks/use-diagnostics"
import {
  buildBugReportPayload,
  buildGitHubReportUrl,
  payloadAsText,
} from "@/lib/report-issue"

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function ReportIssueDialog() {
  const diagnostics = useDiagnostics()
  const { isDemo } = useDemo()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<DiagnosticError | null>(null)
  const [reproduction, setReproduction] = useState("")
  const [expected, setExpected] = useState("")
  const [notice, setNotice] = useState<string | null>(null)
  const previousSessionId = useRef(diagnostics.sessionId)

  useEffect(() => {
    if (previousSessionId.current === diagnostics.sessionId) return
    previousSessionId.current = diagnostics.sessionId
    setSelectedId(diagnostics.errors[0]?.id || null)
    setSelectedSnapshot(diagnostics.errors[0] || null)
    setReproduction("")
    setExpected("")
    setNotice(null)
  }, [diagnostics.errors, diagnostics.sessionId])

  const selected =
    selectedId === "manual"
      ? null
      : diagnostics.errors.find((error) => error.id === selectedId) ||
        selectedSnapshot
  const payload = useMemo(
    () =>
      selected
        ? buildBugReportPayload(selected, diagnostics.environment, {
            reproduction,
            expected,
          })
        : null,
    [selected, diagnostics.environment, reproduction, expected]
  )
  const manualPayload = useMemo(
    () =>
      selected
        ? null
        : buildBugReportPayload(
            {
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
            },
            diagnostics.environment,
            { reproduction, expected }
          ),
    [selected, diagnostics.environment, reproduction, expected]
  )
  const basePayload = payload || manualPayload
  const activePayload =
    basePayload && isDemo
      ? {
          ...basePayload,
          title: `DEMO / SIMULATED DATA: ${basePayload.title}`,
          curr_b: `DEMO / SIMULATED DATA. This report contains illustrative values, not live session diagnostics.\n\n${basePayload.curr_b}`,
          extra: `DEMO / SIMULATED DATA. Do not treat these values as a real incident.\n\n${basePayload.extra.replace("Error-history source: server history.", "Error-history source: simulated demo fixture.")}`,
        }
      : basePayload
  const reportLink = useMemo(
    () => (activePayload ? buildGitHubReportUrl(activePayload) : null),
    [activePayload]
  )
  const templateUrl = useMemo(
    () =>
      activePayload
        ? `https://github.com/open-wa/wa-automate-nodejs/issues/new?template=bug_report.yaml&title=${encodeURIComponent(activePayload.title)}`
        : "https://github.com/open-wa/wa-automate-nodejs/issues/new?template=bug_report.yaml",
    [activePayload]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    // A dismissed report keeps its draft until the selected session changes.
    if (nextOpen) {
      setNotice(null)
      if (selectedId === null) {
        const firstError = diagnostics.errors[0] || null
        setSelectedId(firstError?.id || "manual")
        setSelectedSnapshot(firstError)
      }
    }
    setOpen(nextOpen)
  }

  const copyDiagnostics = async () => {
    if (!activePayload) return
    const text = payloadAsText(activePayload)
    try {
      await navigator.clipboard.writeText(text)
      setNotice(
        "Sanitized diagnostics copied. Paste them into the GitHub report's log field or attach the downloaded file."
      )
    } catch {
      setNotice(
        "Clipboard access was unavailable. Download the sanitized diagnostics instead."
      )
    }
  }

  const downloadDiagnostics = () => {
    if (!activePayload) return
    const blob = new Blob([payloadAsText(activePayload)], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "open-wa-dashboard-diagnostics.txt"
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice(
      "Sanitized diagnostics downloaded. Attach the file to the editable GitHub report."
    )
  }

  const selectError = (error: DiagnosticError) => {
    if (selectedId !== error.id) {
      setReproduction("")
      setExpected("")
    }
    setSelectedId(error.id)
    setSelectedSnapshot(error)
    setNotice(null)
  }

  return (
    <DetailSheet
      open={open}
      onOpenChange={handleOpenChange}
      size="wide"
      title={isDemo ? "Preview a demo issue report" : "Report an issue"}
      description={
        isDemo
          ? "These are simulated errors. Turn off Demo to report a real session."
          : "Describe what happened and review the diagnostics before opening GitHub."
      }
      trigger={
        <DetailSheetTrigger
          render={
            <Button variant="ghost" size="sm" aria-label="Report issue" />
          }
        >
          <Bug size={14} />
          <span className="hidden sm:inline">Report issue</span>
        </DetailSheetTrigger>
      }
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void copyDiagnostics()}
            disabled={!activePayload}
          >
            <Clipboard />
            Copy diagnostics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadDiagnostics}
            disabled={!activePayload}
          >
            <Download />
            Download
          </Button>
          <Button
            size="sm"
            disabled={
              !activePayload || !reproduction.trim() || !expected.trim()
            }
            onClick={() => {
              const url = reportLink?.tooLong ? templateUrl : reportLink?.url
              if (url) window.open(url, "_blank", "noopener,noreferrer")
            }}
          >
            {reportLink?.tooLong
              ? "Open GitHub template"
              : "Continue to GitHub"}
            <ExternalLink />
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-body-medium">Recent errors</h2>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh diagnostics"
              onClick={() => void diagnostics.refresh()}
            >
              <RefreshCw />
            </Button>
          </div>
          <p className="text-caption-1-regular text-text-secondary">
            Session event history · up to {diagnostics.captureLimit} grouped
            errors. Process logger history is not complete.
          </p>
          {!diagnostics.errors.length && (
            <div className="rounded-xl border border-dashed p-4 text-body-regular text-text-secondary">
              {!diagnostics.connected
                ? "Reconnect the selected session to load its error history."
                : diagnostics.serverDiagnosticsAvailable
                  ? "No errors have been captured for this session."
                  : "Server diagnostics are unavailable. You can still describe an issue."}
            </div>
          )}
          <div className="space-y-2">
            {diagnostics.errors.map((error) => (
              <Button
                key={error.id}
                variant={selected?.id === error.id ? "secondary" : "ghost"}
                aria-pressed={selected?.id === error.id}
                onClick={() => selectError(error)}
                className="h-auto w-full flex-col items-start gap-2 rounded-xl border p-3 text-start whitespace-normal"
              >
                <span className="line-clamp-2 text-caption-1-semibold">
                  {error.message}
                </span>
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-caption-1-regular text-text-tertiary">
                    {isDemo ? "Demo data" : error.source}
                  </span>
                  <Chip color="rose" variant="caption">
                    {error.count}×
                  </Chip>
                </span>
                <span className="text-caption-1-regular text-text-secondary">
                  Last seen {formatTimestamp(error.lastSeen)}
                </span>
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedId("manual")
              setReproduction("")
              setExpected("")
              setNotice(
                "Describe a new issue. No captured error will be attached."
              )
            }}
          >
            Report another issue
          </Button>
          {diagnostics.errors.length > 0 && !diagnostics.connected && (
            <p className="text-caption-1-regular text-text-secondary">
              The session is disconnected. Previously captured errors remain
              available for review.
            </p>
          )}
          {diagnostics.connected && !diagnostics.serverDiagnosticsAvailable && (
            <p className="text-caption-1-regular text-text-secondary">
              {diagnostics.environment.metadata.diagnostics === "unauthorized"
                ? "Server history requires the configured API key. Check your connection settings and refresh."
                : "Server history is unavailable; captured live events may still be listed."}
            </p>
          )}
        </aside>
        <section className="min-w-0 space-y-5">
          <ReportAnswersFields
            reproduction={reproduction}
            expected={expected}
            setReproduction={setReproduction}
            setExpected={setExpected}
          />
          <details className="rounded-2xl border bg-muted/30 p-4" open>
            <summary className="cursor-pointer text-body-medium">
              Technical details to include
            </summary>
            {activePayload && (
              <pre
                data-base-ui-swipe-ignore
                className="mt-3 max-h-80 overflow-auto rounded-xl bg-background p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
              >
                {payloadAsText(activePayload)}
              </pre>
            )}
            <p className="mt-3 text-caption-1-regular text-text-secondary">
              Review these details before sharing. Unavailable fields are
              marked. Opening GitHub creates an editable draft.
            </p>
          </details>
          {reportLink?.tooLong && (
            <p className="text-caption-1-regular text-status-orange-text">
              The diagnostics are too long for a prefilled link. Copy or
              download them and attach them to the GitHub template.
            </p>
          )}
          {notice && (
            <p className="text-body-regular text-text-secondary" role="status">
              {notice}
            </p>
          )}
        </section>
      </div>
    </DetailSheet>
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
    <div className="space-y-4">
      <label className="space-y-2 text-sm font-medium">
        Steps to reproduce <span className="text-destructive">*</span>
        <Textarea
          value={reproduction}
          onChange={(event) => setReproduction(event.target.value)}
          rows={3}
          placeholder="What did you do before the error appeared? Include the method or route you called."
          required
        />
      </label>
      <label className="space-y-2 text-sm font-medium">
        Expected behavior <span className="text-destructive">*</span>
        <Textarea
          value={expected}
          onChange={(event) => setExpected(event.target.value)}
          rows={3}
          placeholder="What did you expect to happen? If you aren't sure, say that."
          required
        />
      </label>
    </div>
  )
}
