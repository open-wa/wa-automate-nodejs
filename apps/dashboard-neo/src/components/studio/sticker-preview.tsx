import { useEffect, useState } from "react"
import type { StickerResult } from "@open-wa/stickers"
import { Button } from "@/components/ui/button"
import { useStickerResultUrl, useStickerStillUrl } from "@/lib/studio/use-sticker-render"
import { EmptyStudio, StudioChoices } from "./shared"

export function StickerPreview({ source, result, rendering, error, cancel, retry }: {
  source: File; result?: StickerResult; rendering?: boolean; error?: string; cancel: () => void; retry: () => void
}) {
  const [context, setContext] = useState<"sticker" | "chat">("sticker")
  const [compare, setCompare] = useState(false)
  const [animate, setAnimate] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  const [original, setOriginal] = useState<{ file: File; url: string } | null>(null)
  const url = useStickerResultUrl(result)
  const stillUrl = useStickerStillUrl(result)
  useEffect(() => {
    const url = URL.createObjectURL(source)
    setOriginal({ file: source, url })
    return () => URL.revokeObjectURL(url)
  }, [source])
  const imageUrl = compare ? original?.file === source ? original.url : "" : result?.animated && !animate ? stillUrl : url
  return <>
    <div className="studio-panel-heading"><h2>Preview</h2><StudioChoices label="Sticker preview" value={context} onChange={setContext} choices={[
      { value: "sticker", label: "Sticker" }, { value: "chat", label: "In chat" },
    ]} /></div>
    <div className="studio-chat">
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setCompare(value => !value)}>{compare ? "Show sticker" : "Compare original"}</Button>
        {!compare && result?.animated && <Button variant="outline" size="sm" onClick={() => setAnimate(value => !value)}>{animate ? "Show still frame" : "Animate preview"}</Button>}</div>
      {(compare || result && url) ? <div className={context === "chat" ? "studio-sticker-chat" : "studio-checkerboard"}>
        {context === "chat" && <div className="studio-sticker-chat-message">{compare ? "Original photo" : "Your sticker"}</div>}
        {imageUrl ? <img className={context === "chat" ? "studio-sticker-in-chat" : undefined} src={imageUrl} alt={compare ? "Original photo" : "Rendered sticker"} />
          : <p className="studio-note">Still frame unavailable. Choose Animate preview to view the sticker.</p>}
        {context === "chat" && <p className="studio-note">Preview only · Nothing sent</p>}
      </div> : <EmptyStudio title={rendering ? "Rendering sticker…" : "Sticker preview"}>{rendering && <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>}</EmptyStudio>}
      {compare && rendering && <p role="status" className="studio-note">Rendering sticker…</p>}
      {result && <p className="studio-note">{result.width + " × " + result.height + " · " + (result.animated ? result.frames + " frames · " + (result.durationMs / 1000).toFixed(1) + " seconds" : "Static WebP") + " · " + Math.ceil(result.bytes.byteLength / 1024) + " KB"}</p>}
      {error && <div className="space-y-3"><p role="alert" className="studio-error">{error}</p><Button variant="outline" onClick={retry}>Try again</Button></div>}
    </div>
  </>
}
