import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { FlaskConical } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { getApiUrl } from "@/lib/api-client"

export const Route = createFileRoute("/playground")({ component: PlaygroundPage })

type MethodDef = {
  functionName: string
  description: string
  namespace: string
  parameterOrder: string[]
}

function PlaygroundPage() {
  const { ask, connected } = useSocket()
  const [methods, setMethods] = useState<MethodDef[]>([])
  const [selectedMethod, setSelectedMethod] = useState<MethodDef | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [result, setResult] = useState<unknown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  // Fetch available methods
  useEffect(() => {
    if (!connected) return
    fetch(`${getApiUrl()}/meta/swagger.json`)
      .then((r) => r.json())
      .then((spec: any) => {
        const defs: MethodDef[] = Object.entries(spec.paths || {}).map(([path, methods]: [string, any]) => {
          const post = methods.post || methods.get
          const fnName = path.split("/").pop() || path
          return {
            functionName: fnName,
            description: post?.summary || "",
            namespace: post?.tags?.[0] || "general",
            parameterOrder: Object.keys(post?.requestBody?.content?.["application/json"]?.schema?.properties || {}),
          }
        })
        setMethods(defs.sort((a, b) => a.functionName.localeCompare(b.functionName)))
      })
      .catch(() => {
        // Fallback: empty for now
      })
  }, [connected])

  const filteredMethods = search
    ? methods.filter(
        (m) =>
          m.functionName.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase()),
      )
    : methods

  const selectMethod = (method: MethodDef) => {
    setSelectedMethod(method)
    setParams(Object.fromEntries(method.parameterOrder.map((p) => [p, ""])))
    setResult(null)
    setError(null)
  }

  const execute = async () => {
    if (!selectedMethod) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Parse params — try JSON for each value, fall back to string
      const parsedParams: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(params)) {
        if (!val) continue
        try {
          parsedParams[key] = JSON.parse(val)
        } catch {
          parsedParams[key] = val
        }
      }

      const res = await ask(selectedMethod.functionName, parsedParams)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Method List */}
      <div className="flex w-72 flex-col border-e">
        <div className="border-b p-3">
          <input
            type="text"
            placeholder="Search methods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {filteredMethods.map((method) => (
            <button
              key={method.functionName}
              onClick={() => selectMethod(method)}
              className={`w-full border-b px-3 py-2 text-start transition-colors hover:bg-muted/50 ${
                selectedMethod?.functionName === method.functionName ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <div className="truncate font-mono text-xs font-medium">{method.functionName}</div>
              {method.description && (
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{method.description}</div>
              )}
            </button>
          ))}
          {filteredMethods.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {connected ? "No methods found" : "Connect to see methods"}
            </div>
          )}
        </div>
      </div>

      {/* Execution Area */}
      <div className="flex flex-1 flex-col">
        {selectedMethod ? (
          <>
            {/* Method Header */}
            <div className="border-b p-4">
              <h2 className="font-mono text-lg font-semibold">{selectedMethod.functionName}</h2>
              {selectedMethod.description && (
                <p className="mt-1 text-sm text-muted-foreground">{selectedMethod.description}</p>
              )}
              <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {selectedMethod.namespace}
              </span>
            </div>

            {/* Parameters */}
            <div className="flex-1 overflow-auto p-4">
              {selectedMethod.parameterOrder.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Parameters</h3>
                  {selectedMethod.parameterOrder.map((param) => (
                    <div key={param}>
                      <label className="mb-1 block font-mono text-xs text-muted-foreground">{param}</label>
                      <input
                        type="text"
                        value={params[param] || ""}
                        onChange={(e) => setParams((prev) => ({ ...prev, [param]: e.target.value }))}
                        placeholder={`Enter ${param}...`}
                        className="h-9 w-full rounded-md border bg-background px-3 font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No parameters required</p>
              )}

              <button
                onClick={execute}
                disabled={loading || !connected}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Executing..." : "Execute →"}
              </button>

              {/* Result */}
              {(result !== null || error) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{error ? "Error" : "Response"}</h3>
                    <button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(error || result, null, 2))}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Copy
                    </button>
                  </div>
                  <pre
                    className={`mt-2 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-xs ${
                      error ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300" : "bg-muted"
                    }`}
                  >
                    {JSON.stringify(error || result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="flex justify-center mb-2 opacity-50">
                <FlaskConical size={48} />
              </div>
              <p className="mt-2 text-sm">Select a method to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
