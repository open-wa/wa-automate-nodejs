import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { InteractiveContentSchema, type InteractiveContent } from "@open-wa/schema/interactive"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DetailSheet, DetailSheetClose } from "@/components/application/detail-sheet"
import { StudioChoices, StudioCode, StudioField, StudioLayout, StudioTypeChoices, EmptyStudio, type StudioView } from "@/components/studio/shared"
import { MessageEditor, type DetailField } from "@/components/studio/message-editor"
import { MessagePreview } from "@/components/studio/message-preview"
import { StudioSendSheet } from "@/components/studio/send-sheet"
import { useSocket } from "@/lib/hooks/use-socket"
import { useBrowserDraft } from "@/lib/studio/use-browser-draft"
import { apiExampleFiles, copyStudioCode, downloadStudioArchive } from "@/lib/studio/files"
import { acceptsMessageDraft, codeFormats, fieldId, initialMessageDraft, messageCode, messageExamples, messageKinds, pathValue, supportsReply, updatePath, validateMessage, type CodeFormat, type FieldPath } from "@/lib/studio/messages"

export const Route = createFileRoute("/studio_/messages")({ component: MessageStudio })

function MessageStudio() {
  const [draft, setDraft, saved] = useBrowserDraft("openwa-message-studio-v1", initialMessageDraft, acceptsMessageDraft)
  const [view, setView] = useState<StudioView>("edit")
  const [format, setFormat] = useState<CodeFormat>("javascript")
  const [purpose, setPurpose] = useState<"send" | "replies">("send")
  const [selected, setSelected] = useState("actions.0.label")
  const [sendOpen, setSendOpen] = useState(false)
  const [details, setDetails] = useState<{ title: string; fields: DetailField[] } | null>(null)
  const [detailValues, setDetailValues] = useState<Record<string, string>>({})
  const [setupOpen, setSetupOpen] = useState(false)
  const { ask } = useSocket()
  const kind = draft.active
  const original = draft.documents[kind]
  const native = useMemo(() => {
    if (kind !== "native" || draft.nativeSource === undefined) return { content: original, error: "" }
    try {
      const result = InteractiveContentSchema.safeParse(JSON.parse(draft.nativeSource))
      return result.success && result.data.type === "native" ? { content: result.data, error: "" } : { content: original, error: result.success ? "Use a native message document here." : result.error.issues.map(issue => issue.path.join(".") + ": " + issue.message).join("\n") }
    } catch { return { content: original, error: "Check the JSON syntax." } }
  }, [kind, original, draft.nativeSource])
  const content = native.content
  const validation = validateMessage(content)
  const valid = validation.valid && !native.error
  const hasReplies = supportsReply(content)
  const activePurpose = hasReplies ? purpose : "send"
  const code = valid && validation.content ? messageCode(validation.content, activePurpose === "replies" ? "javascript" : format, activePurpose) : ""
  const change = (path: FieldPath, value: unknown) => setDraft(previous => ({ ...previous, documents: { ...previous.documents, [previous.active]: updatePath(previous.documents[previous.active], path, value) } }))
  const edit = (path: FieldPath) => {
    setSelected(path.join(".")); setView("edit")
    requestAnimationFrame(() => document.getElementById(fieldId(path))?.focus())
  }
  const openDetails = (title: string, fields: DetailField[]) => {
    setDetailValues(Object.fromEntries(fields.map(field => [field.path.join("."), String(pathValue(content, field.path) ?? "")])))
    setDetails({ title, fields })
  }
  let detailContent: InteractiveContent = content
  for (const field of details?.fields || []) detailContent = updatePath(detailContent, field.path, detailValues[field.path.join(".")] || undefined)
  const detailValidation = validateMessage(detailContent)
  const introducedErrors = Object.entries(detailValidation.errors).filter(([path, message]) => validation.errors[path] !== message)
  const detailErrors = (details?.fields.some(field => !!detailValidation.errors[field.path.join(".")]) || false) || introducedErrors.length > 0
  const download = async () => {
    if (!valid || !validation.content) return
    try {
      await downloadStudioArchive("openwa-message-example.zip", apiExampleFiles("sendInteractive", { "message.json": JSON.stringify(validation.content, null, 2) }, "const content = JSON.parse(await readFile(new URL('./message.json', import.meta.url), 'utf8'));\nconst payload = { to: process.env.WA_CHAT_ID, content };\n"))
    } catch { toast.error("The example couldn't be downloaded. Try again.") }
  }
  return <>
    <StudioLayout title="Message studio" description="Preview a message and copy the code." view={view} onViewChange={setView} previewLabel="Try message"
      actions={<><span role="status" className="studio-note">{saved}</span><span className="studio-desktop-actions"><Button variant="outline" disabled={!valid} onClick={() => setSendOpen(true)}>Send to chat</Button></span><Button disabled={!code} onClick={() => void copyStudioCode(code, () => setView("code"))}>Copy code</Button></>}
      mobileActions={<Button variant="outline" disabled={!valid} onClick={() => setSendOpen(true)}>Send to chat</Button>}
      navigation={<div className="studio-message-navigation"><div className="studio-type-picker"><StudioTypeChoices label="Message type" value={kind} choices={messageKinds} onChange={active => { setDraft(previous => ({ ...previous, active })); setSelected("actions.0.label"); setPurpose("send") }} /></div>
        <Button variant="ghost" size="sm" onClick={() => { setDraft(previous => ({ ...previous, documents: { ...previous.documents, [kind]: structuredClone(messageExamples[kind]) }, ...(kind === "native" ? { nativeSource: undefined } : {}) })); setSelected("actions.0.label") }}>Reset example</Button></div>}
      inspector={<MessageEditor content={content} kind={kind} change={change} errors={validation.errors} selected={selected} select={path => setSelected(path.join("."))} details={openDetails}
        nativeSource={draft.nativeSource ?? JSON.stringify(content, null, 2)} nativeError={native.error} onNativeChange={nativeSource => setDraft(previous => ({ ...previous, nativeSource }))} />}
      preview={native.error ? <EmptyStudio title="Check the message JSON"><p className="studio-note">Fix the JSON to see the preview.</p></EmptyStudio> : <MessagePreview content={content} valid={valid} edit={edit} view={view} onViewChange={setView} selected={selected} />}
      code={<StudioCode value={code || "Finish the highlighted fields to generate code."} footer={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!valid} onClick={() => void download()}>Download example</Button><Button variant="ghost" size="sm" onClick={() => setSetupOpen(true)}>View setup</Button></div>}>
        {hasReplies && <StudioChoices label="Code purpose" value={activePurpose} onChange={setPurpose} choices={[{ value: "send", label: "Send message" }, { value: "replies", label: "Handle replies" }]} />}
        {activePurpose === "send" && <StudioChoices label="Code format" value={format} onChange={setFormat} choices={codeFormats} />}
        <p className="studio-note">{activePurpose === "replies" || format === "javascript" ? "Uses your connected client." : format === "http" ? "Set OPENWA_API_URL and OPENWA_API_KEY before running." : "The message document."}</p>
      </StudioCode>} />
    <StudioSendSheet open={sendOpen} onOpenChange={setSendOpen} valid={valid} interactive onSend={async to => {
      const current = validateMessage(content)
      if (!current.valid || !current.content || native.error) throw new Error("Finish the highlighted fields before sending.")
      return ask("sendInteractive", { to, content: current.content })
    }} />
    <DetailSheet title={details?.title || "Message details"} description="Keys identify choices in your code. Text and order changes keep the same keys." open={!!details} onOpenChange={open => { if (!open) setDetails(null) }}
      footer={<><DetailSheetClose render={<Button variant="outline" />}>Cancel</DetailSheetClose><Button disabled={detailErrors} onClick={() => {
        setDraft(previous => ({ ...previous, documents: { ...previous.documents, [kind]: detailContent } })); setDetails(null)
      }}>Save</Button></>}>
      <div className="space-y-4">{details?.fields.map(field => <StudioField key={field.path.join(".")} label={field.label} value={detailValues[field.path.join(".")] || ""} error={detailValidation.errors[field.path.join(".")]}
        onChange={value => setDetailValues(previous => ({ ...previous, [field.path.join(".")]: value }))} />)}{introducedErrors.length > 0 && <p role="alert" className="studio-error">{introducedErrors[0][1]}</p>}</div>
    </DetailSheet>
    <DetailSheet title="Use the code" description="Choose the example for your integration." open={setupOpen} onOpenChange={setSetupOpen}>
      <div className="space-y-5 text-sm"><p>JavaScript snippets use an existing connected OpenWA client. Register reply handlers before sending.</p><p>The downloaded example uses your Easy API. Extract the ZIP, rename .env.example to .env, and enter your API address, API key and recipient.</p>
        <pre className="overflow-auto rounded-lg border p-3">node --env-file=.env send.mjs</pre><p>Running the script sends one message. Copying or downloading it sends nothing.</p>
        <Button disabled={!valid} onClick={() => void download()}>Download example</Button></div>
    </DetailSheet>
  </>
}
