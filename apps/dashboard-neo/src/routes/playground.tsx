import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/boardui/table"
import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect, useRef } from "react"
import { FlaskConical, Search, Play, Copy, Loader2 } from "lucide-react"
import { useSocket } from "@/lib/hooks/use-socket"
import { useHealth } from "@/lib/hooks/use-health"
import { useDemo } from "@/lib/demo/use-demo"
import { getApiUrl } from "@/lib/api-client"
import { PageHeader } from "@/components/application/page-header"
import {
  DetailSheet,
  DetailSheetClose,
} from "@/components/application/detail-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/boardui/chip"
import { toast } from "sonner"

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
})

type MethodDef = {
  functionName: string
  description: string
  namespace: string
  parameterOrder: string[]
}

function PlaygroundPage() {
  const { ask, connected } = useSocket()
  const { canInvokeRuntime } = useHealth()
  const { isDemo } = useDemo()
  const [methods, setMethods] = useState<MethodDef[]>([])
  const [selectedMethod, setSelectedMethod] = useState<MethodDef | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [result, setResult] = useState<unknown>(undefined)
  const [hasResult, setHasResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [catalogueLoading, setCatalogueLoading] = useState(false)
  const [catalogueError, setCatalogueError] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let active = true
    if (!connected) return
    setCatalogueLoading(true)
    setCatalogueError(false)
    fetch(`${getApiUrl()}/meta/swagger.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Method catalogue unavailable")
        return response.json()
      })
      .then((spec: any) => {
        if (!active) return
        const defs: MethodDef[] = Object.entries(spec.paths || {}).map(
          ([path, methods]: [string, any]) => {
            const post = methods.post || methods.get
            return {
              functionName: path.split("/").pop() || path,
              description: post?.summary || "",
              namespace: post?.tags?.[0] || "general",
              parameterOrder: Object.keys(
                post?.requestBody?.content?.["application/json"]?.schema
                  ?.properties || {}
              ),
            }
          }
        )
        setMethods(
          defs.sort((a, b) => a.functionName.localeCompare(b.functionName))
        )
      })
      .catch(() => {
        if (active) setCatalogueError(true)
      })
      .finally(() => {
        if (active) setCatalogueLoading(false)
      })
    return () => {
      active = false
    }
  }, [connected, refresh])

  const filtered = methods.filter((method) =>
    `${method.functionName} ${method.description} ${method.namespace}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase().trim())
  )
  const selectMethod = (method: MethodDef, trigger: HTMLElement) => {
    if (selectedMethod?.functionName !== method.functionName) {
      setParams(
        Object.fromEntries(method.parameterOrder.map((param) => [param, ""]))
      )
      setResult(undefined)
      setHasResult(false)
      setError(null)
    }
    returnFocus.current = trigger
    setSelectedMethod(method)
    setOpen(true)
  }
  const execute = async () => {
    if (!selectedMethod || loading || (!canInvokeRuntime && !isDemo)) return
    setLoading(true)
    setError(null)
    setHasResult(false)
    try {
      const parsed: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(params)) {
        if (!value) continue
        try {
          parsed[key] = JSON.parse(value)
        } catch {
          parsed[key] = value
        }
      }
      setResult(await ask(selectedMethod.functionName, parsed))
      setHasResult(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      setLoading(false)
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(error || result, null, 2) ?? String(result)
      )
      toast.success("Response copied")
    } catch {
      toast.error("Clipboard unavailable. Select the response to copy it.")
    }
  }

  return (
    <div className="dashboard-page space-y-6">
      <PageHeader
        title="API playground"
        description="Find a method, review its parameters, and execute it against the selected session."
        badge={<Chip variant="caption">{methods.length} methods</Chip>}
      />
      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-text-tertiary" />
        <Input
          type="search"
          aria-label="Search API methods"
          placeholder="Search methods, descriptions or categories…"
          className="ps-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border-button-default">
        {catalogueLoading ? (
          <div
            role="status"
            className="p-6 text-body-regular text-text-secondary"
          >
            Loading available methods…
          </div>
        ) : catalogueError ? (
          <div role="alert" className="space-y-4 p-6">
            <p className="text-body-regular">
              The method catalogue couldn't be loaded from the API server.
            </p>
            <Button
              variant="outline"
              onClick={() => setRefresh((value) => value + 1)}
            >
              Try again
            </Button>
          </div>
        ) : !filtered.length ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <FlaskConical className="size-8 text-text-tertiary" />
            <p className="text-body-medium">
              {connected ? "No matching methods" : "Connect to the API server"}
            </p>
            <p className="text-body-regular text-text-secondary">
              {connected
                ? "Try a different search. The catalogue comes from your running API."
                : "Available methods appear when the server is connected."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="API methods" selectionMode="none" size="sm">
              <TableHeader>
                <TableColumn id="method" isRowHeader>
                  Method
                </TableColumn>
                <TableColumn id="category" className="hidden sm:table-cell">
                  Category
                </TableColumn>
                <TableColumn id="description" className="hidden lg:table-cell">
                  Description
                </TableColumn>
                <TableColumn id="actions" textValue="Open method">
                  <span className="sr-only">Open method</span>
                </TableColumn>
              </TableHeader>
              <TableBody>
                {filtered.map((method) => (
                  <TableRow
                    key={`${method.namespace}-${method.functionName}`}
                    id={`${method.namespace}-${method.functionName}`}
                    textValue={method.functionName}
                  >
                    <TableCell>
                      <code className="text-xs">{method.functionName}</code>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Chip variant="caption">{method.namespace}</Chip>
                    </TableCell>
                    <TableCell className="hidden max-w-lg text-text-secondary lg:table-cell">
                      {method.description || "No description provided"}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) =>
                          selectMethod(method, event.currentTarget)
                        }
                        aria-label={`Open ${method.functionName}`}
                      >
                        Open
                        <Play />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <DetailSheet
        title={selectedMethod?.functionName || "API method"}
        description={
          selectedMethod?.description ||
          "Review the parameters and execute this method."
        }
        open={open}
        onOpenChange={(visible, details) => {
          if (loading && !visible) {
            details.cancel()
            return
          }
          setOpen(visible)
        }}
        finalFocus={returnFocus}
        size="wide"
        footer={
          <>
            <DetailSheetClose
              render={<Button variant="outline" disabled={loading} />}
            >
              Close
            </DetailSheetClose>
            <Button
              onClick={() => void execute()}
              disabled={loading || (!canInvokeRuntime && !isDemo)}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Play />}
              {loading
                ? "Executing…"
                : isDemo
                  ? "Execute in demo"
                  : "Execute method"}
            </Button>
          </>
        }
      >
        {selectedMethod && (
          <div className="space-y-6">
            <Chip variant="caption" color="blue">
              {selectedMethod.namespace}
            </Chip>
            <section className="space-y-4">
              <h2 className="text-body-medium">Parameters</h2>
              {selectedMethod.parameterOrder.length ? (
                selectedMethod.parameterOrder.map((param) => (
                  <div key={param} className="space-y-1.5">
                    <label
                      htmlFor={`method-param-${param}`}
                      className="font-mono text-xs text-text-secondary"
                    >
                      {param}
                    </label>
                    <Input
                      id={`method-param-${param}`}
                      value={params[param] || ""}
                      disabled={loading}
                      onChange={(event) =>
                        setParams((previous) => ({
                          ...previous,
                          [param]: event.target.value,
                        }))
                      }
                      placeholder={`Enter ${param}…`}
                      className="font-mono"
                    />
                  </div>
                ))
              ) : (
                <p className="text-body-regular text-text-secondary">
                  No parameters required.
                </p>
              )}
              <p className="text-caption-1-regular text-text-tertiary">
                Use JSON for objects, arrays, booleans and numbers. Other values
                are sent as text.
              </p>
            </section>
            {!canInvokeRuntime && !isDemo && (
              <p className="text-body-regular text-status-orange-text">
                Wait for WhatsApp to become ready before executing this method.
              </p>
            )}
            {(hasResult || error) && (
              <section className="space-y-3" aria-live="polite">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-body-medium">
                    {error ? "Method failed" : "Response"}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => void copy()}>
                    <Copy />
                    Copy
                  </Button>
                </div>
                <pre
                  data-base-ui-swipe-ignore
                  className="max-h-96 overflow-auto rounded-xl border bg-muted/50 p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap"
                >
                  {JSON.stringify(error || result, null, 2) ?? String(result)}
                </pre>
              </section>
            )}
          </div>
        )}
      </DetailSheet>
    </div>
  )
}
