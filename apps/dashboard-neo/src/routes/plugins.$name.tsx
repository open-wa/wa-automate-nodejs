import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState, lazy, Suspense } from "react"

interface PluginPageData {
  name: string
  version?: string
  description?: string
  hasRoutes: boolean
  pages: Array<{
    path: string
    title: string
    icon?: string
    description?: string
  }>
  tools: string[]
}

/**
 * Dynamic plugin page route.
 *
 * This route catches /plugins/:name and renders a plugin status view.
 * In v1, this shows plugin info fetched from the manifest.
 * Future: lazy-loaded React components from plugins.
 */
export const Route = createFileRoute("/plugins/$name")({
  component: PluginPageRoute,
})

function PluginPageRoute() {
  const { name } = Route.useParams()
  const [plugin, setPlugin] = useState<PluginPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlugin = async () => {
      try {
        setLoading(true)
        const base = (window as unknown as { __OPENWA_API_BASE__?: string }).__OPENWA_API_BASE__ ?? ""
        const res = await fetch(`${base}/plugins/manifest`)
        if (!res.ok) {
          setError("Failed to fetch plugin manifest")
          return
        }
        const data = await res.json()
        const found = data.plugins?.find((p: PluginPageData) => p.name === name)
        if (!found) {
          setError(`Plugin "${name}" not found in manifest`)
          return
        }
        setPlugin(found)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plugin")
      } finally {
        setLoading(false)
      }
    }

    fetchPlugin()
  }, [name])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading plugin…</span>
        </div>
      </div>
    )
  }

  if (error || !plugin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🔌</span>
          <h2 className="text-lg font-semibold">Plugin Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error ?? `No plugin named "${name}" is currently loaded.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      {/* Plugin Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
          🧩
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">{plugin.name}</h1>
          <div className="flex items-center gap-2">
            {plugin.version && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                v{plugin.version}
              </span>
            )}
            {plugin.hasRoutes && (
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-500">
                has API routes
              </span>
            )}
          </div>
          {plugin.description && (
            <p className="text-sm text-muted-foreground mt-1">{plugin.description}</p>
          )}
        </div>
      </div>

      {/* Status Card */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">Status</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Pages</span>
            <span className="text-sm font-medium">{plugin.pages.length}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Tools</span>
            <span className="text-sm font-medium">{plugin.tools.length}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">API Routes</span>
            <span className="text-sm font-medium">{plugin.hasRoutes ? "Yes" : "No"}</span>
          </div>
        </div>
      </div>

      {/* Pages List */}
      {plugin.pages.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Pages</h3>
          <div className="flex flex-col gap-2">
            {plugin.pages.map((page) => (
              <div key={page.path} className="flex items-center gap-2 text-sm">
                <span>{page.icon ?? "📄"}</span>
                <span>{page.title}</span>
                <span className="text-xs text-muted-foreground">({page.path})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools List */}
      {plugin.tools.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Tools</h3>
          <div className="flex flex-wrap gap-2">
            {plugin.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
