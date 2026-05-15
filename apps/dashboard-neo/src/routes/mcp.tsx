import { createFileRoute } from "@tanstack/react-router"
import { useHealth } from "@/lib/hooks/use-health"
import {
  Bot,
  Terminal,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Code2,
  BookOpen,
  KeyRound,
  Copy,
} from "lucide-react"
import { useState } from "react"
import { getApiUrl } from "@/lib/api-client"

export const Route = createFileRoute("/mcp")({ component: McpPage })

export function McpPage() {
  const { mcpAvailable, mcpEnabled, mcpPath } = useHealth()
  const [copied, setCopied] = useState<string | null>(null)

  const baseUrl = getApiUrl()
  const mcpUrl = `${baseUrl}${mcpPath}`

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Claude Desktop config includes API key placeholder
  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        "open-wa": {
          url: mcpUrl,
          headers: {
            "X-API-Key": "YOUR_API_KEY",
          },
        },
      },
    },
    null,
    2
  )

  const cursorConfig = JSON.stringify(
    {
      "open-wa": {
        url: mcpUrl,
        headers: {
          "X-API-Key": "YOUR_API_KEY",
        },
      },
    },
    null,
    2
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Model Context Protocol</h1>
            <p className="text-sm text-muted-foreground">
              Expose your WhatsApp session as a tool-set for AI Agents
            </p>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusCard
          title="Availability"
          status={mcpAvailable ? "Available" : "Unavailable"}
          description={mcpAvailable ? "MCP support is enabled in this build" : "This build does not support MCP"}
          icon={<Cpu size={18} />}
          variant={mcpAvailable ? "success" : "neutral"}
        />
        <StatusCard
          title="Server Status"
          status={mcpEnabled ? "Running" : "Disabled"}
          description={mcpEnabled ? "Streamable HTTP endpoint is active" : "Enable MCP in your configuration"}
          icon={<Terminal size={18} />}
          variant={mcpEnabled ? "success" : "error"}
        />
        <StatusCard
          title="Authentication"
          status="API Key Required"
          description="Every MCP request must include your Easy API key"
          icon={<KeyRound size={18} />}
          variant="warning"
        />
      </div>

      {mcpEnabled ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Snippets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Endpoint Info */}
            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} className="text-primary" />
                  <h2 className="text-sm font-semibold">MCP Endpoint</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                  Streamable HTTP
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm">
                  <span className="flex-1 truncate">{mcpUrl}</span>
                  <button
                    onClick={() => copyToClipboard(mcpUrl, "url")}
                    className="shrink-0 rounded-md p-1.5 hover:bg-background transition-colors"
                  >
                    {copied === "url" ? <ClipboardCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Single endpoint for all MCP operations. Supports <code className="rounded bg-muted px-1 text-foreground">POST</code> (JSON-RPC messages),{" "}
                  <code className="rounded bg-muted px-1 text-foreground">GET</code> (server-initiated streams), and{" "}
                  <code className="rounded bg-muted px-1 text-foreground">DELETE</code> (session termination).
                </p>
              </div>
            </div>

            {/* Claude Desktop Config */}
            <ConfigSnippet
              title="Claude Desktop"
              icon={<Bot size={16} className="text-primary" />}
              snippet={claudeConfig}
              copied={copied}
              setCopied={setCopied}
              copyId="claude"
              copyToClipboard={copyToClipboard}
              instructions={[
                "Open Claude Desktop → Settings → Developer",
                <>Paste the snippet into your <code className="rounded bg-muted px-1 text-foreground">mcpServers</code> section</>,
                <>Replace <code className="rounded bg-muted px-1 text-foreground">YOUR_API_KEY</code> with your actual Easy API key</>,
                "Restart Claude Desktop",
              ]}
            />

            {/* Cursor Config */}
            <ConfigSnippet
              title="Cursor / Windsurf"
              icon={<Code2 size={16} className="text-primary" />}
              snippet={cursorConfig}
              copied={copied}
              setCopied={setCopied}
              copyId="cursor"
              copyToClipboard={copyToClipboard}
              instructions={[
                "Open Settings → MCP Servers → Add Server",
                "Set type to \"SSE\" (Cursor term for Streamable HTTP)",
                <>Paste the config and replace <code className="rounded bg-muted px-1 text-foreground">YOUR_API_KEY</code> with your actual Easy API key</>,
              ]}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Auth Details */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                <KeyRound size={18} />
                Authentication
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                MCP uses the same API key as your Easy API HTTP endpoints. Include it via:
              </p>
              <div className="space-y-2">
                <div className="rounded-lg bg-background p-3 font-mono text-[10px] space-y-1 border border-border">
                  <div className="text-muted-foreground"># Header</div>
                  <div>X-API-Key: YOUR_API_KEY</div>
                </div>
              </div>
            </div>

            {/* Safety */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-primary">
                <ShieldCheck size={18} />
                Safety Boundary
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Only schema-registered methods are exposed</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Execution blocked until session is fully ready</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    Same auth boundary as HTTP — no extra exposure
                  </span>
                </li>
              </ul>
            </div>

            {/* Docs */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="text-sm font-bold">Resources</h2>
              <div className="space-y-2">
                <a
                  href="https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} />
                    MCP Transport Spec
                  </span>
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                </a>
                <div className="space-y-1">
                  <a
                    href={`${baseUrl}/meta/mcp-tools.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal size={14} />
                      Inspect Tool Definitions
                    </span>
                    <ArrowRight size={14} className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </a>
                  <p className="text-[10px] text-muted-foreground px-1">Note: This is a direct static dump of the Open-WA schema registry used to generate MCP tools, not the actual dynamic <code className="font-mono bg-muted px-0.5 rounded">tools/list</code> response from the MCP protocol.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card/50 text-center px-6">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <ShieldCheck size={40} />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-lg font-bold">MCP is currently Disabled</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To use Model Context Protocol, you must enable it in your server configuration and ensure an API Key is set.
            </p>
          </div>
          <div className="mt-2 rounded-lg bg-muted p-4 text-left font-mono text-xs">
            <div className="text-muted-foreground"># config.json</div>
            <div>{"{"}</div>
            <div className="pl-4">"apiKey": "YOUR_SECRET_KEY",</div>
            <div className="pl-4">"mcp": {"{"}</div>
            <div className="pl-8 text-primary">"enabled": true</div>
            <div className="pl-4">{"}"}</div>
            <div>{"}"}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfigSnippet({
  title,
  icon,
  snippet,
  copied,
  copyId,
  copyToClipboard,
  instructions,
}: {
  title: string
  icon: React.ReactNode
  snippet: string
  copied: string | null
  setCopied: (v: string | null) => void
  copyId: string
  copyToClipboard: (text: string, id: string) => void
  instructions: React.ReactNode[]
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold">{title} Configuration</h2>
        </div>
        <button
          onClick={() => copyToClipboard(snippet, copyId)}
          className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          {copied === copyId ? <ClipboardCheck size={12} /> : <Copy size={12} />}
          Copy JSON
        </button>
      </div>
      <div className="p-5">
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
          {snippet}
        </pre>
        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-medium">Setup:</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
            {instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function StatusCard({
  title,
  status,
  description,
  icon,
  variant,
}: {
  title: string
  status: string
  description: string
  icon: React.ReactNode
  variant: "success" | "error" | "warning" | "neutral"
}) {
  const colors = {
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    error: "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400",
    warning: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    neutral: "border-border bg-card text-muted-foreground",
  }

  const Dot = variant === "success" ? CheckCircle2 : variant === "error" ? XCircle : ShieldCheck

  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 ${colors[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{title}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{status}</h3>
            <Dot size={14} />
          </div>
        </div>
        <div className="opacity-40">{icon}</div>
      </div>
      <p className="mt-2 text-xs opacity-70 leading-relaxed">{description}</p>
    </div>
  )
}
