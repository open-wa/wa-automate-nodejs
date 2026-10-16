import { useEffect, useState } from "react"
import type { InteractiveContent, InteractiveAction, InteractiveHeader } from "@open-wa/schema/interactive"
import { DetailSheet } from "@/components/application/detail-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/boardui/checkbox"
import { Radio, RadioGroup } from "@/components/boardui/radio"
import { StudioChoices, type StudioView } from "./shared"
import { actionDescription, type FieldPath } from "@/lib/studio/messages"

function HeaderPreview({ header, edit }: { header?: InteractiveHeader; edit: (path: FieldPath) => void }) {
  if (!header) return null
  if (header.type === "text") return <button type="button" className="studio-chat-text font-semibold" onClick={() => edit(["header", "text"])}>{header.text || "Header text"}</button>
  if (header.type === "image") return <button type="button" className="w-full" onClick={() => edit(["header", "source"])}>{header.source ? <img className="studio-media-preview" src={header.source} alt="Message header" /> : <span className="studio-media-placeholder">Choose an image</span>}</button>
  if (header.type === "video") return <video className="studio-media-preview" controls src={header.source} aria-label="Header video" />
  return <div className="studio-media-placeholder">{header.filename || header.title || "Document"}</div>
}

export function MessagePreview({ content, valid, edit, view, onViewChange, selected }: {
  content: InteractiveContent; valid: boolean; edit: (path: FieldPath) => void; view: StudioView;
  onViewChange: (view: StudioView) => void; selected: string
}) {
  const [trying, setTrying] = useState(false)
  const [sheet, setSheet] = useState<"list" | "form" | "booking" | null>(null)
  const [simulation, setSimulation] = useState<unknown>(null)
  const [notice, setNotice] = useState("")
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})
  const submitAnswers = () => {
    if (content.type !== "form") return
    const result = { ...answers }
    for (const question of content.questions) {
      const custom = customAnswers[question.id]?.trim()
      if (!custom) continue
      const prior = result[question.id]
      result[question.id] = question.type === "singleSelect" ? custom : [...(Array.isArray(prior) ? prior : []), custom]
    }
    setSimulation({ type: "form", answers: result }); setSheet(null)
  }
  useEffect(() => { if (view === "preview") setTrying(true); else if (view === "edit") setTrying(false) }, [view])
  useEffect(() => { setSimulation(null); setNotice(""); setAnswers({}); setCustomAnswers({}); setSheet(null) }, [content])
  const editField = (path: FieldPath) => { if (!trying) edit(path) }
  const action = (item: InteractiveAction, path: FieldPath) => {
    if (!trying) { edit([...path, "label"]); return }
    if (item.type === "reply") { setSimulation({ type: "reply", id: item.id, label: item.label }); setNotice("") }
    else { setNotice(actionDescription(item) + ". Preview only."); setSimulation(null) }
  }
  const actionButtons = (items: InteractiveAction[], path: FieldPath) => <div className="studio-chat-actions">{items.map((item, i) =>
    <button type="button" className="studio-chat-action" key={i} aria-pressed={!trying && selected === [...path, i, "label"].join(".")} onClick={() => action(item, [...path, i])}>{item.label || "Button text"}</button>
  )}</div>
  const text = (value: string | undefined, path: FieldPath, fallback: string, heading = false) => <button type="button" className={"studio-chat-text" + (heading ? " font-semibold" : "")} data-editable={!trying} onClick={() => editField(path)}>{value || fallback}</button>
  return <>
    <div className="studio-panel-heading"><h2>Preview</h2><StudioChoices label="Preview mode" value={trying ? "try" : "edit"} choices={[{ value: "edit", label: "Edit" }, { value: "try", label: "Try message" }]} onChange={value => { setTrying(value === "try"); onViewChange(value === "try" ? "preview" : "edit") }} /></div>
    <div className="studio-chat">
      <p className="studio-note">Nothing sent</p>
      <div className="studio-chat-bubble">
        {"header" in content && <HeaderPreview header={content.header} edit={editField} />}
        {"title" in content && content.title && text(content.title, ["title"], "Title", true)}
        {text(content.body, ["body"], "Message text")}
        {content.footer && <div className="studio-note">{text(content.footer, ["footer"], "Footer")}</div>}
        {content.type === "buttons" && actionButtons(content.actions, ["actions"])}
        {content.type === "list" && <button type="button" className="studio-chat-action" onClick={() => trying ? setSheet("list") : edit(["buttonLabel"])}>{content.buttonLabel || "Choose an option"}</button>}
        {content.type === "form" && <button type="button" className="studio-chat-action" onClick={() => trying ? setSheet("form") : edit(["questions", 0, "label"])}>Answer questions</button>}
        {content.type === "booking" && <><p className="studio-note py-2">{formatBookingTime(content.booking.startAt)}</p><button type="button" className="studio-chat-action" onClick={() => trying ? setSheet("booking") : edit(["buttonLabel"])}>{content.buttonLabel || "View booking"}</button>
          {content.actions && actionButtons(content.actions, ["actions"])}</>}
        {content.type === "native" && content.actions.map((item, index) => <button type="button" key={index} className="studio-chat-action" onClick={() => setNotice("Try native actions by sending the message to a chat.")}>{item.name}</button>)}
      </div>
      {content.type === "carousel" && <div className="studio-cards">{content.cards.map((card, index) => <div key={index} className="studio-chat-bubble studio-card">
        <button type="button" className="w-full" onClick={() => editField(["cards", index, "header", "source"])}>{card.header.source ? <img className="studio-media-preview" src={card.header.source} alt={"Card " + (index + 1)} /> : <span className="studio-media-placeholder">Choose an image</span>}</button>
        {text(card.body, ["cards", index, "body"], "Card text", true)}{actionButtons(card.actions, ["cards", index, "actions"])}
      </div>)}</div>}
      <p className="studio-note">{trying ? "Try the message here. Nothing is sent to WhatsApp." : "Click the message text or a button label to edit it."}</p>
      {!valid && <p className="studio-note">Finish the highlighted fields to copy or send this message.</p>}
      {(simulation || notice) && <div aria-live="polite" className="studio-received">{simulation ? <><h3>Preview response</h3><pre className="whitespace-pre-wrap break-all">{JSON.stringify(simulation, null, 2)}</pre></> : <p>{notice}</p>}</div>}
    </div>
    <DetailSheet title={sheet === "form" ? "Answer questions" : sheet === "booking" ? "Booking details" : "Choose an option"} description="Preview only. Nothing is sent to WhatsApp." open={!!sheet} onOpenChange={open => { if (!open) setSheet(null) }}
      footer={sheet === "form" ? <Button onClick={submitAnswers}>Submit answers</Button> : undefined}>
      {sheet === "list" && content.type === "list" && <div className="space-y-5">{content.sections.map((section, s) => <section key={s} className="space-y-2">
        {section.title && <h3>{section.title}</h3>}{section.rows.map(row => <Button key={row.id} variant="outline" className="h-auto w-full justify-start whitespace-normal py-3 text-start" onClick={() => { setSimulation({ type: "list", id: row.id, label: row.title }); setSheet(null) }}>
          <span>{row.title}{row.description && <span className="block text-xs text-text-secondary">{row.description}</span>}</span>
        </Button>)}
      </section>)}</div>}
      {sheet === "form" && content.type === "form" && <div className="space-y-6">{content.questions.map(question => <fieldset key={question.id} className="space-y-3"><legend className="mb-2 text-sm font-semibold">{question.label}</legend>
        {question.type === "singleSelect" ? <RadioGroup aria-label={question.label} value={typeof answers[question.id] === "string" ? answers[question.id] as string : ""} onChange={value => {
          setCustomAnswers(previous => ({ ...previous, [question.id]: "" }))
          setAnswers(previous => ({ ...previous, [question.id]: value }))
        }}>{question.options.map(option => <Radio key={option.id} value={option.id} className="min-h-11">{option.label}</Radio>)}</RadioGroup>
          : <div className="flex flex-col gap-2">{question.options.map(option => <Checkbox key={option.id} className="min-h-11" isSelected={Array.isArray(answers[question.id]) && answers[question.id].includes(option.id)}
          onChange={checked => setAnswers(previous => {
            const prior = previous[question.id]
            const values = Array.isArray(prior) ? prior : []
            return { ...previous, [question.id]: checked ? [...values, option.id] : values.filter(value => value !== option.id) }
          })}>{option.label}</Checkbox>)}</div>}
        {question.allowCustomAnswer && <label className="block space-y-2 text-sm">Another answer<Input value={customAnswers[question.id] || ""} onChange={event => {
          setCustomAnswers(previous => ({ ...previous, [question.id]: event.target.value }))
          if (question.type === "singleSelect") setAnswers(previous => ({ ...previous, [question.id]: "" }))
        }} /></label>}
      </fieldset>)}</div>}
      {sheet === "booking" && content.type === "booking" && <div className="space-y-4">
        <h3>{content.title || "Your booking"}</h3><p>{formatBookingTime(content.booking.startAt)}</p>
        {content.booking.endAt && <p>{"Ends " + formatBookingTime(content.booking.endAt)}</p>}
        {content.booking.location && <p>{content.booking.location}</p>}{content.booking.description && <p>{content.booking.description}</p>}
        <Button variant="outline" onClick={() => setNotice("Would add this booking to your calendar. Preview only.")}>{content.booking.labels?.addToCalendar || "Add to calendar"}</Button>
        {content.booking.managementUrl && <Button variant="outline" onClick={() => setNotice("Would open " + content.booking.managementUrl + ". Preview only.")}>{content.booking.labels?.manageBooking || "Manage booking"}</Button>}
        {notice && <p role="status" className="studio-note">{notice}</p>}
      </div>}
    </DetailSheet>
  </>
}

function formatBookingTime(value: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Choose a date and time"
  const offset = value.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1] || ""
  return value.slice(0, 10) + " · " + value.slice(11, 16) + " · UTC" + (offset === "Z" ? "+00:00" : offset)
}
