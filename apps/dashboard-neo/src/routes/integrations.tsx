import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef, type ReactNode } from "react"
import {
  MessageSquare,
  Link as LinkIcon,
  Zap,
  RefreshCw,
  Database,
} from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { getApiUrl } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Chip } from "@/components/boardui/chip"
import { PageHeader } from "@/components/application/page-header"
import {
  DetailSheet,
  DetailSheetClose,
} from "@/components/application/detail-sheet"
import { toast } from "sonner"

export const Route = createFileRoute("/integrations")({
  component: IntegrationsPage,
})

type Integration = {
  id: string
  name: string
  type: string
  description: string
  enabled: boolean
  config: Record<string, string>
  icon: ReactNode
}

const AVAILABLE_INTEGRATIONS: Omit<Integration, "enabled" | "config">[] = [
  {
    id: "chatwoot",
    name: "Chatwoot",
    type: "crm",
    description:
      "Connect your WhatsApp session to Chatwoot for customer support management",
    icon: <MessageSquare size={24} className="text-muted-foreground" />,
  },
  {
    id: "webhook",
    name: "Webhook",
    type: "automation",
    description: "Forward events to an external webhook URL",
    icon: <LinkIcon size={24} className="text-muted-foreground" />,
  },
  {
    id: "n8n",
    name: "n8n",
    type: "automation",
    description: "Connect to n8n workflows via webhook",
    icon: <Zap size={24} className="text-muted-foreground" />,
  },
  {
    id: "make",
    name: "Make (Integromat)",
    type: "automation",
    description: "Trigger Make scenarios from WhatsApp events",
    icon: <RefreshCw size={24} className="text-muted-foreground" />,
  },
  {
    id: "gsheet",
    name: "Google Sheets",
    type: "data",
    description: "Log messages and events to a Google Sheet",
    icon: <Database size={24} className="text-muted-foreground" />,
  },
]

const CONFIG_FIELDS: Record<
  string,
  { key: string; label: string; placeholder: string }[]
> = {
  chatwoot: [
    {
      key: "baseUrl",
      label: "Chatwoot URL",
      placeholder: "https://app.chatwoot.com",
    },
    {
      key: "apiAccessToken",
      label: "API Token",
      placeholder: "your-api-token",
    },
    { key: "accountId", label: "Account ID", placeholder: "1" },
  ],
  webhook: [
    {
      key: "url",
      label: "Webhook URL",
      placeholder: "https://your-server.com/webhook",
    },
    {
      key: "events",
      label: "Events (comma-separated)",
      placeholder: "onMessage,onAck",
    },
  ],
  n8n: [
    {
      key: "webhookUrl",
      label: "n8n Webhook URL",
      placeholder: "https://your-n8n.com/webhook/xxx",
    },
  ],
  make: [
    {
      key: "webhookUrl",
      label: "Make Webhook URL",
      placeholder: "https://hook.make.com/xxx",
    },
  ],
  gsheet: [
    { key: "spreadsheetId", label: "Spreadsheet ID", placeholder: "1BxiM..." },
    {
      key: "credentials",
      label: "Service Account JSON",
      placeholder: '{"type":"service_account",...}',
    },
  ],
}

function IntegrationsPage() {
  const { connected } = useSocket()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [editing, setEditing] = useState<Integration | null>(null)
  const [open, setOpen] = useState(false)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!connected) return
    let active = true
    setLoading(true)
    setError(null)
    fetch(`${getApiUrl()}/meta/integrations`)
      .then((response) => {
        if (!response.ok) throw new Error("Integration settings unavailable")
        return response.json()
      })
      .then(
        (
          data: Record<
            string,
            { enabled: boolean; config: Record<string, string> }
          >
        ) => {
          if (active)
            setIntegrations(
              AVAILABLE_INTEGRATIONS.map((integration) => ({
                ...integration,
                enabled: data[integration.id]?.enabled || false,
                config: data[integration.id]?.config || {},
              }))
            )
        }
      )
      .catch(() => {
        if (active)
          setError("Integration settings couldn't be loaded from this server.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [connected, refresh])

  const save = async () => {
    if (!editing || busy || !connected) return
    setBusy(editing.id)
    setSaveError(null)
    try {
      const response = await fetch(
        `${getApiUrl()}/meta/integrations/${editing.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: true, config: configValues }),
        }
      )
      if (!response.ok)
        throw new Error(
          "Settings couldn't be saved. Your changes are still here."
        )
      setIntegrations((previous) =>
        previous.map((integration) =>
          integration.id === editing.id
            ? { ...integration, enabled: true, config: configValues }
            : integration
        )
      )
      setOpen(false)
      toast.success("Settings saved. Restart the session to apply them.")
    } catch (failure) {
      setSaveError(
        failure instanceof Error
          ? failure.message
          : "Settings couldn't be saved."
      )
    } finally {
      setBusy(null)
    }
  }
  const toggle = async (integration: Integration, enabled: boolean) => {
    if (busy || !connected) return
    setBusy(integration.id)
    try {
      const response = await fetch(
        `${getApiUrl()}/meta/integrations/${integration.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        }
      )
      if (!response.ok) throw new Error("Integration couldn't be updated")
      setIntegrations((previous) =>
        previous.map((item) =>
          item.id === integration.id ? { ...item, enabled } : item
        )
      )
      toast.success("Settings saved. Restart the session to apply them.")
    } catch {
      toast.error(
        "Integration couldn't be updated. Its settings have been kept."
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect your session to external services. Saved changes apply after a session restart."
      />
      {!connected && (
        <p className="rounded-2xl border border-dashed p-6 text-body-regular text-text-secondary">
          Connect to the API server to manage integrations.
        </p>
      )}
      {loading && (
        <div role="status" className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      )}
      {error && (
        <div role="alert" className="space-y-3 rounded-2xl border p-6">
          <p className="text-body-regular">{error}</p>
          <Button
            variant="outline"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Try again
          </Button>
        </div>
      )}
      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-2">
          {integrations.map((integration) => (
            <section
              key={integration.id}
              className="space-y-5 rounded-2xl border border-border-button-default bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {integration.icon}
                  </span>
                  <div>
                    <h2 className="text-body-medium">{integration.name}</h2>
                    <p className="mt-1 text-body-regular text-text-secondary">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={integration.enabled}
                  disabled={!!busy || !connected}
                  aria-label={`Enable ${integration.name}`}
                  onCheckedChange={(enabled) =>
                    void toggle(integration, enabled)
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Chip
                  variant="caption"
                  color={integration.enabled ? "lime" : "neutral"}
                >
                  {integration.enabled ? "Enabled in settings" : "Disabled"}
                </Chip>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!busy || !connected}
                  onClick={(event) => {
                    returnFocus.current = event.currentTarget
                    setEditing(integration)
                    setConfigValues({ ...integration.config })
                    setSaveError(null)
                    setOpen(true)
                  }}
                >
                  Configure
                </Button>
              </div>
            </section>
          ))}
        </div>
      )}
      <DetailSheet
        title={editing ? `Configure ${editing.name}` : "Integration settings"}
        description="Save connection settings, then restart the session to apply them."
        open={open}
        onOpenChange={(visible, details) => {
          if (busy && !visible) {
            details.cancel()
            return
          }
          setOpen(visible)
        }}
        finalFocus={returnFocus}
        onClosed={() => setEditing(null)}
        footer={
          <>
            <DetailSheetClose
              render={<Button variant="outline" disabled={!!busy} />}
            >
              Cancel
            </DetailSheetClose>
            <Button disabled={!!busy || !connected} onClick={() => void save()}>
              {busy ? "Saving…" : "Save settings"}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            {(CONFIG_FIELDS[editing.id] || []).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label
                  htmlFor={`integration-${field.key}`}
                  className="text-body-medium"
                >
                  {field.label}
                </label>
                {field.key === "credentials" ? (
                  <Textarea
                    id={`integration-${field.key}`}
                    value={configValues[field.key] || ""}
                    onChange={(event) =>
                      setConfigValues((previous) => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    disabled={!!busy}
                    className="font-mono"
                  />
                ) : (
                  <Input
                    id={`integration-${field.key}`}
                    type={
                      field.key.toLocaleLowerCase().includes("token")
                        ? "password"
                        : "text"
                    }
                    value={configValues[field.key] || ""}
                    onChange={(event) =>
                      setConfigValues((previous) => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    disabled={!!busy}
                  />
                )}
              </div>
            ))}
            {saveError && (
              <p
                role="alert"
                className="text-body-regular text-status-rose-text"
              >
                {saveError}
              </p>
            )}
          </div>
        )}
      </DetailSheet>
    </div>
  )
}
