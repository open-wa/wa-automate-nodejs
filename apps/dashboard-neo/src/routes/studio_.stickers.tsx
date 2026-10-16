import { useEffect, useMemo, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { validateStickerJob } from "@open-wa/stickers/browser"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/application/page-header"
import { DetailSheet } from "@/components/application/detail-sheet"
import { StudioChoices, StudioCode, StudioLayout, StudioTypeChoices, type StudioView } from "@/components/studio/shared"
import { StickerEditor, type StickerPanel } from "@/components/studio/sticker-editor"
import { StickerPreview } from "@/components/studio/sticker-preview"
import { StudioSendSheet } from "@/components/studio/send-sheet"
import { useBrowserDraft } from "@/lib/studio/use-browser-draft"
import { useStickerRender } from "@/lib/studio/use-sticker-render"
import { useSocket } from "@/lib/hooks/use-socket"
import { apiExampleFiles, copyStudioCode, downloadStudioArchive, downloadStudioFile, readMediaFile } from "@/lib/studio/files"
import { acceptsStickerDraft, initialStickerDraft, STICKER_PROFILE, stickerCode, stickerJob, stickerSourceName, storedStickerSource, type StickerCodeFormat } from "@/lib/studio/stickers"
import "@/components/studio/studio.css"

export const Route = createFileRoute("/studio_/stickers")({ component: StickerStudio })

function StickerStudio() {
  const [draft, setDraft, saved] = useBrowserDraft("openwa-sticker-studio-v1", initialStickerDraft, acceptsStickerDraft)
  const [file, setFile] = useState<File | null>(null)
  const [sourceError, setSourceError] = useState("")
  const [sourceStatus, setSourceStatus] = useState("Restoring photo…")
  const [sourceLoading, setSourceLoading] = useState(true)
  const [view, setView] = useState<StudioView>("edit")
  const [panel, setPanel] = useState<StickerPanel>("effects")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState(draft.effects[0]?.id || "")
  const [format, setFormat] = useState<StickerCodeFormat>("javascript")
  const [sendOpen, setSendOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const sourceVersion = useRef(0)
  const { ask } = useSocket()
  const job = useMemo(() => stickerJob(draft), [draft])
  let jobError = ""
  try { validateStickerJob(job) } catch (error) { jobError = error instanceof Error ? error.message : "Check the sticker settings." }
  const render = useStickerRender(file, job)
  const valid = !jobError && !render.invalidSource
  useEffect(() => {
    let active = true
    const revision = sourceVersion.current
    void storedStickerSource().then(value => {
      if (active && revision === sourceVersion.current) { setFile(value); setSourceStatus(value ? "Photo saved in this browser" : "") }
    }).catch(() => { if (active) setSourceStatus("Photos can't be saved in this browser") }).finally(() => { if (active) setSourceLoading(false) })
    return () => { active = false }
  }, [])
  const choose = async (file: File) => {
    setSourceError("")
    if (!/\.(png|jpe?g|gif|webp)$/i.test(file.name) && !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) { setSourceError("Choose a PNG, JPG, GIF or WebP."); return }
    if (!file.size || file.size > STICKER_PROFILE.maxInputBytes) { setSourceError("Choose a file up to 20 MB."); return }
    const revision = ++sourceVersion.current
    const normalized = file.type ? file : new File([file], file.name, { type: /\.gif$/i.test(file.name) ? "image/gif" : /\.webp$/i.test(file.name) ? "image/webp" : /\.jpe?g$/i.test(file.name) ? "image/jpeg" : "image/png", lastModified: file.lastModified })
    setFile(normalized); setSourceLoading(false); setSourceStatus("Saving photo…")
    try { await storedStickerSource(normalized); if (sourceVersion.current === revision) setSourceStatus("Photo saved in this browser") }
    catch { if (sourceVersion.current === revision) setSourceStatus("Photo couldn't be saved. Keep a copy of the source file.") }
  }
  const sample = async () => {
    setSourceError("")
    try {
      const response = await fetch(import.meta.env.BASE_URL + "studio/coffee.webp")
      if (!response.ok) throw new Error("The sample couldn't be loaded.")
      await choose(new File([await response.blob()], "coffee.webp", { type: "image/webp" }))
    } catch (error) { setSourceError(error instanceof Error ? error.message : "The sample couldn't be loaded.") }
  }
  const code = file && valid ? stickerCode(job, file, format) : ""
  const downloadExample = async () => {
    if (!file || !valid) return
    try {
      const name = stickerSourceName(file)
      const payload = "const photo = await readFile(new URL(" + JSON.stringify("./" + name) + ", import.meta.url));\nconst job = JSON.parse(await readFile(new URL('./sticker-job.json', import.meta.url), 'utf8'));\nconst payload = { to: process.env.WA_CHAT_ID, input: " + JSON.stringify("data:" + file.type + ";base64,") + " + photo.toString('base64'), job };\n"
      await downloadStudioArchive("openwa-sticker-example.zip", apiExampleFiles("sendSticker", { [name]: new Uint8Array(await file.arrayBuffer()), "sticker-job.json": JSON.stringify(job, null, 2) }, payload))
    } catch { toast.error("The example couldn't be downloaded. Try again.") }
  }
  const uploader = <input ref={fileInput} type="file" className="sr-only" accept="image/png,image/jpeg,image/gif,image/webp" aria-label="Choose a photo or GIF" onChange={event => { const value = event.target.files?.[0]; if (value) void choose(value); event.currentTarget.value = "" }} />
  if (!file) return <div className="dashboard-page studio space-y-6"><PageHeader title="Sticker studio" description="Make a sticker and copy the code." />{uploader}
    <div className="studio-upload" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void choose(file) }}>
      <h2>Choose a photo</h2><p className="studio-note">Add a PNG, JPG, GIF or WebP, up to 20 MB.</p><Button onClick={() => fileInput.current?.click()}>Choose a photo or GIF</Button>
      <p className="studio-note">Or drop a file here</p><Button variant="outline" onClick={() => void sample()}>Use sample photo</Button>
      <p className="studio-note">Your photo stays in this browser.</p>{sourceLoading && <p role="status" className="studio-note">{sourceStatus}</p>}
      {sourceError && <p role="alert" className="studio-error">{sourceError}</p>}
    </div></div>
  return <>{uploader}<StudioLayout title="Sticker studio" description="Make a sticker and copy the code." view={view} onViewChange={setView}
    actions={<><span role="status" className="studio-note">{saved}</span><span className="studio-desktop-actions"><Button variant="outline" disabled={!valid} onClick={() => setSendOpen(true)}>Send to chat</Button>
      <Button variant="outline" disabled={!render.result} onClick={() => { if (render.result) downloadStudioFile("sticker.webp", new Uint8Array(render.result.bytes), "image/webp") }}>Download sticker</Button>
      </span><Button disabled={!code} onClick={() => void copyStudioCode(code, () => setView("code"))}>Copy code</Button></>}
    mobileActions={<><Button variant="outline" disabled={!valid} onClick={() => setSendOpen(true)}>Send to chat</Button><Button variant="outline" disabled={!render.result} onClick={() => { if (render.result) downloadStudioFile("sticker.webp", new Uint8Array(render.result.bytes), "image/webp") }}>Download sticker</Button></>}
    navigation={<div className="studio-type-picker"><StudioTypeChoices label="Sticker settings" value={panel} onChange={value => { setPanel(value); setView("edit") }} choices={[
      { value: "effects", label: "Effects" }, { value: "shape", label: "Size and shape" }, { value: "animation", label: "Animation" }, { value: "pack", label: "Pack and creator" },
    ]} /></div>}
    inspector={<><StickerEditor file={file} onFile={value => void choose(value)} draft={draft} setDraft={setDraft} panel={panel} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} selected={selected} setSelected={setSelected} error={jobError || sourceError} /><p role="status" className="studio-note">{sourceStatus}</p></>}
    preview={<StickerPreview source={file} result={render.result} rendering={render.rendering} error={render.error} cancel={render.cancel} retry={render.retry} />}
    code={<StudioCode value={code || (render.invalidSource ? "Choose another source file to generate code." : "Check the sticker settings to generate code.")} footer={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!valid} onClick={() => void downloadExample()}>Download code + photo</Button><Button variant="outline" size="sm" disabled={!!jobError} onClick={() => downloadStudioFile("sticker-job.json", JSON.stringify(job, null, 2))}>Download settings</Button><Button variant="ghost" size="sm" onClick={() => setSetupOpen(true)}>View setup</Button></div>}><StudioChoices label="Code format" value={format} onChange={setFormat} choices={[
      { value: "javascript", label: "JavaScript" }, { value: "http", label: "HTTP" }, { value: "json", label: "JSON" }, { value: "cli", label: "CLI" },
    ]} /><p className="studio-note">{format === "javascript" ? "Uses your connected client and the original source file." : format === "cli" ? "Save the settings as sticker-job.json beside your source file." : format === "http" ? "Uses Node.js fetch with your Easy API." : "Sticker settings."}</p>
    </StudioCode>} />
    <StudioSendSheet open={sendOpen} onOpenChange={setSendOpen} valid={valid} onSend={async to => { validateStickerJob(job); return ask("sendSticker", { to, input: await readMediaFile(file), job }) }} />
    <DetailSheet title="Use the sticker code" description="The example includes your original photo and settings." open={setupOpen} onOpenChange={setSetupOpen}>
      <div className="space-y-5 text-sm"><p>JavaScript snippets use your connected OpenWA client. Keep the original photo beside the script.</p><p>The downloaded example uses your Easy API. Extract it, rename .env.example to .env, and enter your API address, API key and chat ID.</p>
        <pre className="overflow-auto rounded-lg border p-3">node --env-file=.env send.mjs</pre><p>Running the script sends one sticker. Copying or downloading it sends nothing.</p><Button disabled={!valid} onClick={() => void downloadExample()}>Download code + photo</Button></div>
    </DetailSheet>
  </>
}
