import type { DiagnosticEnvironment, DiagnosticError } from "@/lib/hooks/use-diagnostics"
import { MAX_REPORT_URL_LENGTH, sanitizeDiagnosticBlock, sanitizeDiagnosticText } from "@/lib/hooks/use-diagnostics"

export type ReportAnswers = {
  reproduction: string
  expected: string
}

export type BugReportPayload = {
  title: string
  curr_b: string
  expected_b: string
  repro: string
  c_code: string
  d_info: string
  enviro: string
  screenshots: string
  extra: string
  mode?: string
  acc_type?: string
  session_type?: string
}

function value(value: string | number | null | undefined) {
  return value == null || value === "" ? "Unavailable" : String(value)
}

function formatConfig(config: Record<string, unknown> | null) {
  if (!config) return "Unavailable (the runtime did not expose an allowlisted config snapshot)."
  return JSON.stringify(config, null, 2)
}

function formatPatches(patches: unknown[]) {
  if (!patches.length) return "Unavailable"
  return patches.map((patch) => sanitizeDiagnosticText(typeof patch === "string" ? patch : JSON.stringify(patch), 800)).join("\n")
}

export function buildBugReportPayload(error: DiagnosticError, environment: DiagnosticEnvironment, answers: ReportAnswers): BugReportPayload {
  const first = new Date(error.firstSeen).toISOString()
  const last = new Date(error.lastSeen).toISOString()
  const context = error.context.length ? error.context.join("\n") : "Unavailable"
  const current = [
    error.message,
    error.method ? `Method: ${error.method}` : null,
    error.route ? `Route: ${error.route}` : null,
    error.component ? `Component: ${error.component}` : null,
    `First seen: ${first}`,
    `Last seen: ${last}`,
    `Occurrences: ${error.count}`,
  ].filter(Boolean).join("\n")
  const debugInfo = [
    `open-wa version: ${value(environment.openWaVersion)}`,
    `WhatsApp Web version: ${value(environment.waVersion)}`,
    `Node/runtime: ${value(environment.node)}`,
    `Browser: ${value(environment.browser)}`,
    `Driver: ${value(environment.driver)}`,
    `Backend OS: ${value(environment.os)}`,
    `Backend architecture: ${value(environment.architecture)}`,
    `Execution mode: ${value(environment.executionMode)}`,
    "Session identifier: omitted for privacy",
    `Metadata endpoints: info=${environment.metadata.info}, config=${environment.metadata.config}, health=${environment.metadata.health}, diagnostics endpoint=${environment.metadata.diagnostics}`,
    `Session event-bridge capture: ${environment.metadata.diagnosticsCapture}; this only confirms the server-side capture hook is attached, not that earlier process logger history is complete.`,
    "",
    "Observed error stack:",
    error.stack || "Unavailable",
  ].join("\n")
  const environmentInfo = [
    `- OS: ${value(environment.os)} (${value(environment.architecture)})`,
    `- Node: ${value(environment.node)}`,
    "- Package manager: unavailable (not exposed by runtime diagnostics).",
    "- Container: unavailable (not exposed by runtime diagnostics).",
    `- Browser: ${value(environment.browser)}`,
    `- Driver: ${value(environment.driver)}`,
    `- Execution mode: ${value(environment.executionMode)}`,
    "- Dashboard browser: not collected; values above describe the backend runtime.",
  ].join("\n")

  const mode = environment.executionMode?.toLowerCase().includes("easy")
    ? "EASY API/CLI"
    : environment.executionMode?.toLowerCase().includes("code")
      ? "My own code"
      : undefined
  const sessionType = environment.sessionType?.toLowerCase().includes("multi")
    ? "Multi-device (multiDevice: true or --multi-device)"
    : environment.sessionType?.toLowerCase().includes("single") || environment.sessionType?.toLowerCase().includes("legacy")
      ? "Single-device / legacy session"
      : undefined
  const accountType = environment.accountType?.toLowerCase().includes("business")
    ? "Business account"
    : environment.accountType?.toLowerCase().includes("personal")
      ? "Personal account (normal)"
      : undefined

  return {
    title: error.id === "manual" ? "Dashboard issue" : `Dashboard runtime error: ${sanitizeDiagnosticText(error.message, 100)}`,
    curr_b: current,
    expected_b: sanitizeDiagnosticBlock(answers.expected) || "Please describe the expected behavior.",
    repro: sanitizeDiagnosticBlock(answers.reproduction) || "Please add the steps that reproduce this error.",
    c_code: ["Client/CLI invocation: unavailable (not collected by dashboard diagnostics).", "", "v5 runtime configuration (allowlisted):", "```json", formatConfig(environment.config), "```"].join("\n"),
    d_info: debugInfo,
    enviro: environmentInfo,
    screenshots: ["Sanitized captured log context:", "```text", context, "```"].join("\n"),
    extra: [
      "Captured by the dashboard report flow. This report remains editable on GitHub and was not submitted automatically.",
      `Captured errors are bounded to the most recent ${50} grouped records for this selected session.`,
      `Error-history source: ${error.source}. The bounded session event bridge does not represent complete process logger history.`,
      "",
      "Patch outcomes:",
      formatPatches(environment.patches),
    ].join("\n"),
    ...(mode ? { mode } : {}),
    ...(sessionType ? { session_type: sessionType } : {}),
    ...(accountType ? { acc_type: accountType } : {}),
  }
}

export function buildGitHubReportUrl(payload: BugReportPayload) {
  const params = new URLSearchParams({ template: "bug_report.yaml", title: payload.title })
  for (const [key, value] of Object.entries(payload)) {
    if (key === "title" || !value) continue
    params.set(key, value)
  }
  const url = `https://github.com/open-wa/wa-automate-nodejs/issues/new?${params.toString()}`
  return {
    url,
    tooLong: url.length > MAX_REPORT_URL_LENGTH,
  }
}

export function payloadAsText(payload: BugReportPayload) {
  const knownContext = [
    `Mode: ${value(payload.mode)}`,
    `Session type: ${value(payload.session_type)}`,
    `Account type: ${value(payload.acc_type)}`,
  ].join("\n")
  return [
    `# ${payload.title}`,
    "",
    "## Current Behavior",
    payload.curr_b,
    "",
    "## Expected Behavior",
    payload.expected_b,
    "",
    "## Steps To Reproduce",
    payload.repro,
    "",
    "## DEBUG INFO",
    payload.d_info,
    "",
    "## Environment",
    payload.enviro,
    knownContext,
    "",
    "## Current v5 Runtime Setup",
    payload.c_code,
    "",
    "## Screenshots/Logs",
    payload.screenshots,
    "",
    "## Anything else?",
    payload.extra,
  ].join("\n")
}
