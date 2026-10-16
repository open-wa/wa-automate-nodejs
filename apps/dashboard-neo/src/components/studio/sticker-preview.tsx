import { useEffect, useState } from "react"
import type { StickerResult } from "@open-wa/stickers"
import { Button } from "@/components/ui/button"
import { useStickerResultUrl, useStickerStillUrl } from "@/lib/studio/use-sticker-render"
import { EmptyStudio, StudioChoices } from "./shared"
import { WhatsAppChat } from "./whatsapp-chat"

export function StickerPreview({ source, result, rendering, error, invalidSource, cancel, retry, chooseSource }: {
  source: File; result?: StickerResult; rendering?: boolean; error?: string; invalidSource?: boolean; cancel: () => void; retry: () => void; chooseSource: () => void
}) {
  const [context, setContext] = useState<"sticker" | "chat">("chat")
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
  const hasImage = compare || !!(result && url)
  const image = imageUrl ? <img className={context === "chat" && !compare ? "studio-sticker-in-chat" : "studio-sticker-photo"} src={imageUrl} alt={compare ? "Original photo" : "Rendered sticker"} />
    : <p className="studio-wa-render-note">{compare ? "Loading photo…" : "Still frame unavailable. Choose Animate preview to view the sticker."}</p>
  const pending = <EmptyStudio title={rendering ? "Rendering sticker…" : "Sticker preview"}>{rendering && <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>}</EmptyStudio>
  return <div className="studio-sticker-preview">
    <div className="studio-panel-heading"><StudioChoices label="Sticker preview" value={context} onChange={setContext} choices={[
      { value: "chat", label: "In chat" }, { value: "sticker", label: "Sticker" },
    ]} /><div className="studio-sticker-preview-actions"><Button variant="outline" size="sm" aria-pressed={compare} onClick={() => setCompare(value => !value)}>{compare ? "Show sticker" : "Compare original"}</Button>
        {!compare && result?.animated && <Button variant="outline" size="sm" onClick={() => setAnimate(value => !value)}>{animate ? "Show still frame" : "Animate preview"}</Button>}</div>
    </div>
      {context === "chat" ? <WhatsAppChat compact>{hasImage ? <div className={compare ? "studio-wa-message studio-wa-photo-message" : "studio-wa-sticker"}>{image}</div>
        : <div className="studio-wa-render-status">{pending}</div>}</WhatsAppChat>
        : <div className="studio-checkerboard">{hasImage ? image : pending}</div>}
    <div className="studio-preview-caption">
      <div className="studio-sticker-summary">{result && <p className="studio-note">{result.width + " × " + result.height + " · " + (result.animated ? result.frames + " frames · " + (result.durationMs / 1000).toFixed(1) + " seconds" : "Static WebP") + " · " + Math.ceil(result.bytes.byteLength / 1024) + " KB"}</p>}
        <span role="status" className="studio-note">{rendering ? "Rendering sticker…" : error ? "" : compare ? "Original photo" : result ? "Ready" : ""}</span>
        {rendering && result && <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>}</div>
      {error && <div className="space-y-3"><p role="alert" className="studio-error">{error}</p><Button variant="outline" onClick={invalidSource ? chooseSource : retry}>{invalidSource ? "Choose another photo" : "Try again"}</Button></div>}
    </div>
  </div>
}
