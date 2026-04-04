import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useSocket } from "@/lib/hooks/use-socket"

export const Route = createFileRoute("/integrations")({ component: IntegrationsPage })

type Integration = {
  id: string
  name: string
  type: string
  description: string
  enabled: boolean
  config: Record<string, string>
  icon: string
}

const AVAILABLE_INTEGRATIONS: Omit<Integration, "enabled" | "config">[] = [
  {
    id: "chatwoot",
    name: "Chatwoot",
    type: "crm",
    description: "Connect your WhatsApp session to Chatwoot for customer support management",
    icon: "💬",
  },
  {
    id: "webhook",
    name: "Webhook",
    type: "automation",
    description: "Forward events to an external webhook URL",
    icon: "🔗",
  },
  {
    id: "n8n",
    name: "n8n",
    type: "automation",
    description: "Connect to n8n workflows via webhook",
    icon: "⚡",
  },
  {
    id: "make",
    name: "Make (Integromat)",
    type: "automation",
    description: "Trigger Make scenarios from WhatsApp events",
    icon: "🔄",
  },
  {
    id: "gsheet",
    name: "Google Sheets",
    type: "data",
    description: "Log messages and events to a Google Sheet",
    icon: "📊",
  },
]

const CONFIG_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  chatwoot: [
    { key: "baseUrl", label: "Chatwoot URL", placeholder: "https://app.chatwoot.com" },
    { key: "apiAccessToken", label: "API Token", placeholder: "your-api-token" },
    { key: "accountId", label: "Account ID", placeholder: "1" },
  ],
  webhook: [
    { key: "url", label: "Webhook URL", placeholder: "https://your-server.com/webhook" },
    { key: "events", label: "Events (comma-separated)", placeholder: "onMessage,onAck" },
  ],
  n8n: [
    { key: "webhookUrl", label: "n8n Webhook URL", placeholder: "https://your-n8n.com/webhook/xxx" },
  ],
  make: [
    { key: "webhookUrl", label: "Make Webhook URL", placeholder: "https://hook.make.com/xxx" },
  ],
  gsheet: [
    { key: "spreadsheetId", label: "Spreadsheet ID", placeholder: "1BxiM..." },
    { key: "credentials", label: "Service Account JSON", placeholder: '{"type":"service_account",...}' },
  ],
}

function IntegrationsPage() {
  const { connected, ask } = useSocket()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Fetch current integration configs
  useEffect(() => {
    if (!connected) return
    const apiUrl = `${window.location.protocol}//${window.location.hostname}:8080`
    fetch(`${apiUrl}/meta/integrations`)
      .then((r) => r.json())
      .then((data: Record<string, { enabled: boolean; config: Record<string, string> }>) => {
        const active = AVAILABLE_INTEGRATIONS.map((integ) => ({
          ...integ,
          enabled: data[integ.id]?.enabled || false,
          config: data[integ.id]?.config || {},
        }))
        setIntegrations(active)
      })
      .catch(() => {
        // Endpoint doesn't exist yet — show all as disabled
        setIntegrations(
          AVAILABLE_INTEGRATIONS.map((i) => ({ ...i, enabled: false, config: {} })),
        )
      })
  }, [connected])

  const startEditing = (integ: Integration) => {
    setEditing(integ.id)
    setConfigValues({ ...integ.config })
  }

  const save = async (integId: string) => {
    setSaving(true)
    try {
      const apiUrl = `${window.location.protocol}//${window.location.hostname}:8080`
      await fetch(`${apiUrl}/meta/integrations/${integId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, config: configValues }),
      })
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integId ? { ...i, enabled: true, config: configValues } : i)),
      )
      setEditing(null)
    } catch {
      // Failed to save
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (integId: string, enabled: boolean) => {
    try {
      const apiUrl = `${window.location.protocol}//${window.location.hostname}:8080`
      await fetch(`${apiUrl}/meta/integrations/${integId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      setIntegrations((prev) => prev.map((i) => (i.id === integId ? { ...i, enabled } : i)))
    } catch {
      // Failed
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect your session to external services. Changes require a session restart.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integ) => (
          <div key={integ.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integ.icon}</span>
                <div>
                  <h3 className="font-semibold">{integ.name}</h3>
                  <p className="text-xs text-muted-foreground">{integ.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(integ.id, !integ.enabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  integ.enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    integ.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {editing === integ.id ? (
              <div className="mt-4 space-y-3 border-t pt-4">
                {(CONFIG_FIELDS[integ.id] || []).map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={configValues[field.key] || ""}
                      onChange={(e) =>
                        setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="h-8 w-full rounded-md border bg-background px-3 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    onClick={() => save(integ.id)}
                    disabled={saving}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save & Restart"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    integ.enabled
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {integ.enabled ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => startEditing(integ)}
                  className="text-xs text-primary hover:underline"
                >
                  Configure
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
