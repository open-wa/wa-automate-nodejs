import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useSocket } from "@/lib/hooks/use-socket"

export const Route = createFileRoute("/api-docs")({ component: ApiDocsPage })

/**
 * API Documentation page using Scalar API Reference.
 *
 * Renders the OpenAPI spec from the Easy API's /meta/swagger.json endpoint.
 * Uses dynamic import to keep the Scalar bundle out of the main chunk.
 *
 * If @scalar/api-reference-react is not installed, falls back to an iframe
 * pointing at the classic /api-docs/ HTML page.
 */
function ApiDocsPage() {
  useSocket()
  const [apiUrl, setApiUrl] = useState<string | null>(null)
  const [useIframe, setUseIframe] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const url = `${window.location.protocol}//${window.location.hostname}:8080`
    setApiUrl(url)

    // Try to dynamically import Scalar
    import("@scalar/api-reference-react")
      .then(() => setUseIframe(false))
      .catch(() => setUseIframe(true))
  }, [])

  if (!apiUrl) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading API documentation...</p>
      </div>
    )
  }

  if (useIframe) {
    return (
      <div className="h-[calc(100vh-3.5rem)]">
        <iframe
          src={`${apiUrl}/api-docs/`}
          className="size-full border-0"
          title="API Documentation"
        />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem)]" ref={containerRef}>
      <ScalarReference url={`${apiUrl}/meta/swagger.json`} />
    </div>
  )
}

/**
 * Lazy-loaded Scalar API Reference component.
 */
function ScalarReference({ url }: { url: string }) {
  const [ScalarComponent, setScalarComponent] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    import("@scalar/api-reference-react").then((mod) => {
      setScalarComponent(() => mod.ApiReferenceReact || (mod as any).default)
    }).catch(() => {
      // Fallback handled by parent
    })
  }, [])

  if (!ScalarComponent) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Scalar API Reference...</p>
        </div>
      </div>
    )
  }

  return (
    <ScalarComponent
      configuration={{
        url,
        theme: "kepler",
        layout: "modern",
        hideModels: false,
        hideClientButton: false,
      }}
    />
  )
}
