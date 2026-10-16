import { useEffect, useMemo, useRef, useState } from "react"
import type { StickerJob, StickerResult, StickerRuntime } from "@open-wa/stickers"
import { newStudioKey } from "./files"

type RenderState = { key: string; result?: StickerResult; error?: string; invalidSource?: boolean; rendering?: boolean }

export function useStickerRender(source: File | null, job: StickerJob) {
  const runtime = useRef<Promise<StickerRuntime> | null>(null)
  const version = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const [state, setState] = useState<RenderState>({ key: "" })
  const [attempt, setAttempt] = useState(0)
  const sourceId = useMemo(() => source ? newStudioKey("source") : "", [source])
  const key = sourceId + ":" + JSON.stringify(job)
  useEffect(() => {
    if (!source) return
    const revision = ++version.current
    const abort = new AbortController()
    controller.current = abort
    setState({ key, rendering: true })
    const timer = setTimeout(() => {
      if (abort.signal.aborted) return
      runtime.current ??= import("@open-wa/stickers/browser").then(module => module.createBrowserStickerRuntime()).catch(error => { runtime.current = null; throw error })
      void runtime.current.then(value => value.createSticker(source, { ...job, backend: "browser", signal: abort.signal })).then(result => {
        if (!abort.signal.aborted && revision === version.current) setState({ key, result })
      }).catch((error: unknown) => {
        if (abort.signal.aborted || revision !== version.current) return
        const code = error && typeof error === "object" && "code" in error ? error.code : ""
        const messages: Record<string, string> = {
          INVALID_INPUT: "This file couldn't be read. Choose a different PNG, JPG, GIF or WebP.",
          INPUT_TOO_LARGE: "This image is too large to process. Choose a smaller photo.",
          CAPABILITY_UNAVAILABLE: "This browser can't render this combination. Try another browser or download the example.",
          RESOURCE_UNAVAILABLE: "The rendering resources couldn't be loaded. Try again.",
          SECURE_CONTEXT_REQUIRED: "This effect needs HTTPS to load its fonts. You can also download the example and render it on your server.",
          OUTPUT_TOO_LARGE: "The sticker is too large. Reduce the quality or animation length.",
        }
        setState({ key, error: messages[String(code)] || (error instanceof Error ? error.message : "The sticker couldn't be rendered."), invalidSource: ["INVALID_INPUT", "INPUT_TOO_LARGE"].includes(String(code)) })
      })
    }, 250)
    return () => { clearTimeout(timer); abort.abort() }
  }, [source, key, attempt])
  useEffect(() => () => { controller.current?.abort(); const current = runtime.current; runtime.current = null; void current?.then(value => value.dispose()).catch(() => {}) }, [])
  return { ...state, result: state.key === key ? state.result : undefined, error: state.key === key ? state.error : undefined, invalidSource: state.key === key && state.invalidSource, rendering: !!source && (state.key !== key || state.rendering), retry: () => setAttempt(value => value + 1), cancel: () => {
    controller.current?.abort(); setState({ key, error: "Rendering cancelled. Change a setting or try again." })
  } }
}

export function useStickerResultUrl(result?: StickerResult) {
  const [current, setCurrent] = useState<{ result: StickerResult; url: string } | null>(null)
  useEffect(() => {
    if (!result) { setCurrent(null); return }
    const url = URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: "image/webp" }))
    setCurrent({ result, url })
    return () => URL.revokeObjectURL(url)
  }, [result])
  return current?.result === result ? current?.url || "" : ""
}

export function useStickerStillUrl(result?: StickerResult) {
  const [current, setCurrent] = useState<{ result: StickerResult; url: string } | null>(null)
  useEffect(() => {
    if (!result?.animated) { setCurrent(null); return }
    let active = true
    let url = ""
    void createImageBitmap(new Blob([new Uint8Array(result.bytes)], { type: "image/webp" })).then(async bitmap => {
      const canvas = document.createElement("canvas")
      canvas.width = result.width; canvas.height = result.height
      try {
        const context = canvas.getContext("2d")
        if (!context) return
        context.drawImage(bitmap, 0, 0)
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"))
        if (active && blob) { url = URL.createObjectURL(blob); setCurrent({ result, url }) }
      } finally { bitmap.close(); canvas.width = canvas.height = 0 }
    }).catch(() => { if (active) setCurrent(null) })
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [result])
  return current?.result === result ? current?.url || "" : ""
}
