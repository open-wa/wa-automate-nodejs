import { useLayoutEffect, useRef, useState } from "react"
import type { InteractiveAction, InteractiveContent, FormQuestion } from "@open-wa/schema/interactive"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/boardui/checkbox"
import { StudioField, StudioOptions, StudioRow, StudioSelect, type FieldErrors, type StudioOption } from "./shared"
import { fieldId, freshReplyIds, pathValue, uiKey, type FieldPath, type MessageKind } from "@/lib/studio/messages"
import { moveItem, newStudioKey, readMediaFile } from "@/lib/studio/files"

export type DetailField = { path: FieldPath; label: string }
export type EditorProps = {
  content: InteractiveContent; change: (path: FieldPath, value: unknown) => void; errors: FieldErrors;
  selected: string; select: (path: FieldPath) => void; details: (title: string, fields: DetailField[]) => void
}

function MessageField({ path, label, multiline, type = "text", ...props }: EditorProps & { path: FieldPath; label: string; multiline?: boolean; type?: string }) {
  const value = pathValue(props.content, path)
  return <StudioField id={fieldId(path)} label={label} multiline={multiline} type={type}
    value={typeof value === "string" ? value : ""} error={props.errors[path.join(".")]} onChange={value => props.change(path, !value && label.includes("(optional)") ? undefined : value)} />
}

export function MediaField({ value, onChange, label = "Image", error, accept = "image/png,image/jpeg,image/gif,image/webp", onFilename, inputId }: {
  value: string; onChange: (value: string) => void; label?: string; error?: string; accept?: string; onFilename?: (value: string) => void; inputId?: string
}) {
  const file = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)
  const [failure, setFailure] = useState("")
  const chooseFile = async (selected?: File) => {
    if (!selected) return
    setFailure("")
    if (selected.size > 20 * 1024 * 1024) { setFailure("Choose a file smaller than 20 MB."); return }
    setReading(true)
    try { onChange(await readMediaFile(selected)); onFilename?.(selected.name) }
    catch (error) { setFailure(error instanceof Error ? error.message : "The file couldn't be read.") }
    finally { setReading(false); if (file.current) file.current.value = "" }
  }
  return <div className="studio-section">
    <h3>{label}</h3>
    <input ref={file} className="sr-only" type="file" accept={accept} aria-label={"Choose " + label.toLowerCase()} onChange={event => void chooseFile(event.target.files?.[0])} />
    {value.startsWith("data:") ? <p className="studio-note">File included in the message.</p>
      : <Input id={inputId} className="studio-input" aria-label={label + " URL"} value={value} onChange={event => onChange(event.target.value)} placeholder="https://…" aria-invalid={!!error} />}
    <div className="flex flex-wrap gap-2"><Button id={value.startsWith("data:") ? inputId : undefined} variant="outline" size="sm" disabled={reading} onClick={() => file.current?.click()}>{reading ? "Reading file…" : "Choose file"}</Button>
      {value.startsWith("data:") && <Button variant="ghost" size="sm" onClick={() => onChange("")}>Use a URL</Button>}</div>
    {(failure || error) && <p role="alert" className="studio-error">{failure || error}</p>}
  </div>
}

function HeaderFields(props: EditorProps) {
  const header = "header" in props.content ? props.content.header : undefined
  const type = header?.type || "none"
  const changeType = (type: string) => props.change(["header"], type === "none" ? undefined : type === "text" ? { type, text: "" } : { type, source: "" })
  return <div className="studio-section">
    <StudioSelect id="studio-header-kind" label="Header (optional)" value={type} onChange={changeType} choices={[
      { value: "none", label: "None" }, { value: "text", label: "Text" }, { value: "image", label: "Image" }, { value: "video", label: "Video" }, { value: "document", label: "Document" },
    ]} />
    {header?.type === "text" && <MessageField {...props} path={["header", "text"]} label="Header text" />}
    {header && header.type !== "text" && <MediaField label={header.type === "image" ? "Header image" : header.type === "video" ? "Header video" : "Document"}
      value={header.source} onChange={value => props.change(["header", "source"], value)} error={props.errors["header.source"]}
      inputId={fieldId(["header", "source"])} accept={header.type === "video" ? "video/*" : header.type === "document" ? "*/*" : "image/*"}
      onFilename={value => props.change(["header", "filename"], value)} />}
  </div>
}

function listOptions<T>(items: T[], index: number, change: (value: T[]) => void): StudioOption[] {
  return [
    ...(index > 0 ? [{ label: "Move up", action: () => change(moveItem(items, index, index - 1)) }] : []),
    ...(index < items.length - 1 ? [{ label: "Move down", action: () => change(moveItem(items, index, index + 1)) }] : []),
    { label: "Duplicate", action: () => change([...items.slice(0, index + 1), freshReplyIds(items[index]), ...items.slice(index + 1)]) },
    { label: "Remove", action: () => change(items.filter((_, i) => i !== index)), destructive: true },
  ]
}

export function ActionFields({ path, family, ...props }: EditorProps & { path: FieldPath; family: "reply" | "actions" }) {
  const actions = pathValue(props.content, path) as InteractiveAction[]
  const update = (value: InteractiveAction[]) => props.change(path, value)
  const add = () => {
    const action: InteractiveAction = family === "reply" ? { type: "reply", id: newStudioKey(), label: "" } : { type: "url", label: "", url: "" }
    update([...actions, action]); props.select([...path, actions.length, "label"])
  }
  return <div className="studio-section"><h3>{family === "reply" ? "Buttons" : "Actions"}</h3>
    {actions.map((action, index) => {
      const base = [...path, index]
      const selected = props.selected.startsWith(base.join(".") + ".")
      const current = base.join(".")
      return <div key={uiKey(action)} className="studio-section">
        <StudioRow rowId={uiKey(action)} group={path.join(".")} index={index} count={actions.length} label="Button text" value={action.label}
          inputId={fieldId([...base, "label"])} onChange={value => props.change([...base, "label"], value)} selected={selected}
          onSelect={() => props.select([...base, "label"])} error={props.errors[current + ".label"] || props.errors[current + ".id"]}
          onMove={direction => { const next = Math.max(0, Math.min(actions.length - 1, index + direction)); update(moveItem(actions, index, next)); props.select([...path, next, "label"]) }}
          onDrop={id => update(moveItem(actions, actions.findIndex(item => uiKey(item) === id), index))}
          onRemove={() => update(actions.filter((_, i) => i !== index))}
          details={action.type === "reply" ? [{ label: "Edit reply key…", action: () => props.details("Reply key", [{ path: [...base, "id"], label: "Reply key" }]) }] : []} />
        {action.type !== "reply" && (selected || props.errors[current + ".url"] || props.errors[current + ".phoneNumber"] || props.errors[current + ".code"]) && <div className="studio-action-details">
          <StudioSelect label="Action" value={action.type} onChange={type => {
            props.change(base, type === "url" ? { type, label: action.label, url: "" } : type === "call" ? { type, label: action.label, phoneNumber: "" } : { type: "copy", label: action.label, code: "" })
          }} choices={[{ value: "url", label: "Open a link" }, { value: "call", label: "Call a number" }, { value: "copy", label: "Copy text" }]} />
          <MessageField {...props} label={action.type === "url" ? "Website address" : action.type === "call" ? "Phone number" : "Text to copy"} path={[...base, action.type === "url" ? "url" : action.type === "call" ? "phoneNumber" : "code"]} />
        </div>}
      </div>
    })}
    {props.errors[path.join(".")] && <p className="studio-error">{props.errors[path.join(".")]}</p>}
    <Button variant="outline" onClick={add}>+ Add {family === "reply" ? "button" : "action"}</Button>
  </div>
}

function ListFields(props: EditorProps & { content: Extract<InteractiveContent, { type: "list" }> }) {
  const sections = props.content.sections
  return <>
    <MessageField {...props} path={["title"]} label="Title (optional)" />
    <MessageField {...props} path={["buttonLabel"]} label="Button text" />
    {sections.map((section, s) => <div className="studio-section studio-separated" key={uiKey(section)}>
      <div className="studio-section-heading"><h3>{"Group " + (s + 1)}</h3><StudioOptions label="Group options" options={listOptions(sections, s, value => props.change(["sections"], value))} /></div>
      <MessageField {...props} path={["sections", s, "title"]} label="Group name" />
      <h3>Choices</h3>
      {section.rows.map((row, r) => {
        const path = ["sections", s, "rows", r] as FieldPath
        const rowsPath = ["sections", s, "rows"] as FieldPath
        const update = (rows: typeof section.rows) => props.change(rowsPath, rows)
        return <StudioRow key={uiKey(row)} rowId={uiKey(row)} group={"list-" + s} index={r} count={section.rows.length} label="Choice text"
          value={row.title} inputId={fieldId([...path, "title"])} onChange={value => props.change([...path, "title"], value)}
          selected={props.selected.startsWith(path.join(".") + ".")} onSelect={() => props.select([...path, "title"])} error={props.errors[path.join(".") + ".title"] || props.errors[path.join(".") + ".id"]}
          onMove={direction => update(moveItem(section.rows, r, r + direction))}
          onDrop={id => update(moveItem(section.rows, section.rows.findIndex(row => uiKey(row) === id), r))}
          onRemove={() => update(section.rows.filter((_, i) => i !== r))}
          details={[{ label: "Choice details…", action: () => props.details("Choice details", [{ path: [...path, "id"], label: "Reply key" }, { path: [...path, "description"], label: "Description (optional)" }]) }]} />
      })}
      {props.errors["sections." + s + ".rows"] && <p className="studio-error">Add a choice.</p>}
      <Button variant="outline" onClick={() => props.change(["sections", s, "rows"], [...section.rows, { id: newStudioKey("choice"), title: "" }])}>+ Add choice</Button>
    </div>)}
    {props.errors.sections && <p className="studio-error">Add a group.</p>}
    <Button variant="outline" onClick={() => props.change(["sections"], [...sections, { title: "", rows: [{ id: newStudioKey("choice"), title: "" }] }])}>+ Add group</Button>
  </>
}

function QuestionFields(props: EditorProps & { content: Extract<InteractiveContent, { type: "form" }> }) {
  const questions = props.content.questions
  return <>
    <MessageField {...props} path={["title"]} label="Title (optional)" />
    {questions.map((question, q) => <div className="studio-section studio-separated" key={uiKey(question)}>
      <div className="studio-section-heading"><h3>{"Question " + (q + 1)}</h3>
        <StudioOptions label="Question options" options={[
          { label: "Edit answer key…", action: () => props.details("Answer key", [{ path: ["questions", q, "id"], label: "Answer key" }]) },
          ...listOptions(questions, q, value => props.change(["questions"], value)),
        ]} /></div>
      <MessageField {...props} path={["questions", q, "label"]} label="Question" />
      {props.errors["questions." + q + ".id"] && <p className="studio-error">{props.errors["questions." + q + ".id"] + ". Open Question options to edit the key."}</p>}
      <StudioSelect label="Answer type" value={question.type} onChange={value => props.change(["questions", q, "type"], value)} choices={[{ value: "singleSelect", label: "Choose one" }, { value: "multiSelect", label: "Choose several" }]} />
      {question.options.map((option, o) => {
        const path = ["questions", q, "options", o] as FieldPath
        const update = (options: typeof question.options) => props.change(["questions", q, "options"], options)
        return <StudioRow key={uiKey(option)} rowId={uiKey(option)} group={"question-" + q} index={o} count={question.options.length} label="Option text" value={option.label}
          inputId={fieldId([...path, "label"])} onChange={value => props.change([...path, "label"], value)} error={props.errors[path.join(".") + ".label"] || props.errors[path.join(".") + ".id"]}
          selected={props.selected.startsWith(path.join(".") + ".")} onSelect={() => props.select([...path, "label"])}
          onMove={direction => update(moveItem(question.options, o, o + direction))}
          onDrop={id => update(moveItem(question.options, question.options.findIndex(item => uiKey(item) === id), o))}
          onRemove={() => update(question.options.filter((_, i) => i !== o))}
          details={[{ label: "Edit option key…", action: () => props.details("Option key", [{ path: [...path, "id"], label: "Option key" }]) }]} />
      })}
      {props.errors["questions." + q + ".options"] && <p className="studio-error">Add an option.</p>}
      <Button variant="outline" onClick={() => props.change(["questions", q, "options"], [...question.options, { id: newStudioKey("option"), label: "" }])}>+ Add option</Button>
      <Checkbox className="min-h-9 max-sm:min-h-11" isSelected={!!question.allowCustomAnswer} onChange={value => props.change(["questions", q, "allowCustomAnswer"], value)}>Allow another answer</Checkbox>
    </div>)}
    {props.errors.questions && <p className="studio-error">Add a question.</p>}
    <Button variant="outline" onClick={() => props.change(["questions"], [...questions, { type: "singleSelect", id: newStudioKey("answer"), label: "", options: [{ id: newStudioKey("option"), label: "" }] } satisfies FormQuestion])}>+ Add question</Button>
  </>
}

function CarouselFields(props: EditorProps & { content: Extract<InteractiveContent, { type: "carousel" }> }) {
  const [active, setActive] = useState(0)
  useLayoutEffect(() => { const match = props.selected.match(/^cards\.(\d+)/); if (match) setActive(Number(match[1])) }, [props.selected])
  const cards = props.content.cards
  const index = Math.min(active, Math.max(0, cards.length - 1))
  const card = cards[index]
  return <div className="studio-section">
    <div className="flex flex-wrap gap-1">{cards.map((card, i) => <Button key={uiKey(card)} variant={i === index ? "default" : "outline"} size="sm" onClick={() => setActive(i)}>{"Card " + (i + 1)}</Button>)}</div>
    {card && <>
      <div className="studio-section-heading"><h3>{"Card " + (index + 1)}</h3><StudioOptions label="Card options" options={listOptions(cards, index, value => props.change(["cards"], value))} /></div>
      <MediaField inputId={fieldId(["cards", index, "header", "source"])} label="Card image" value={card.header.source} onChange={value => props.change(["cards", index, "header", "source"], value)} error={props.errors["cards." + index + ".header.source"]} />
      <MessageField {...props} path={["cards", index, "body"]} label="Card text" multiline />
      <StudioSelect label="Button type" value={card.actions[0]?.type === "reply" || !card.actions.length ? "reply" : "actions"} onChange={value => props.change(["cards", index, "actions"],
        value === "reply" ? [{ type: "reply", id: newStudioKey(), label: card.actions[0]?.label || "" }] : [{ type: "url", label: card.actions[0]?.label || "", url: "" }])}
        choices={[{ value: "reply", label: "Reply buttons" }, { value: "actions", label: "Link, call or copy" }]} />
      <ActionFields {...props} path={["cards", index, "actions"]} family={card.actions[0]?.type === "reply" || !card.actions.length ? "reply" : "actions"} />
    </>}
    {props.errors.cards && <p className="studio-error">Add a card.</p>}
    <Button variant="outline" onClick={() => { props.change(["cards"], [...cards, { body: "", header: { type: "image", source: "" }, actions: [{ type: "reply", id: newStudioKey(), label: "" }] }]); setActive(cards.length) }}>+ Add card</Button>
  </div>
}

function BookingFields(props: EditorProps & { content: Extract<InteractiveContent, { type: "booking" }> }) {
  const booking = props.content.booking
  const offset = booking.startAt.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1] || "+00:00"
  const date = booking.startAt.slice(0, 10)
  const setDate = (next: string) => {
    props.change(["booking"], { ...booking, startAt: next + "T" + (booking.startAt.slice(11, 16) || "09:00") + ":00" + offset,
      ...(booking.endAt ? { endAt: next + "T" + booking.endAt.slice(11, 16) + ":00" + offset } : {}) })
  }
  return <>
    <MessageField {...props} path={["title"]} label="Title (optional)" />
    <StudioField label="Date" type="date" value={date} onChange={setDate} />
    <StudioField label="Start time" type="time" value={booking.startAt.slice(11, 16)} onChange={value => props.change(["booking", "startAt"], date + "T" + value + ":00" + offset)} error={props.errors["booking.startAt"]} />
    <StudioField label="End time (optional)" type="time" value={booking.endAt?.slice(11, 16) || ""} onChange={value => props.change(["booking", "endAt"], value ? (booking.endAt?.slice(0, 10) || date) + "T" + value + ":00" + offset : undefined)} error={props.errors["booking.endAt"]} />
    <StudioSelect label="Time zone (UTC offset)" value={offset === "Z" ? "+00:00" : offset} onChange={value => {
      props.change(["booking"], { ...booking, startAt: booking.startAt.slice(0, 19) + value, ...(booking.endAt ? { endAt: booking.endAt.slice(0, 19) + value } : {}) })
    }} choices={Array.from({ length: 105 }, (_, index) => index * 15 - 720).map(minutes => {
      const value = (minutes < 0 ? "-" : "+") + String(Math.floor(Math.abs(minutes) / 60)).padStart(2, "0") + ":" + String(Math.abs(minutes) % 60).padStart(2, "0")
      return { value, label: "UTC" + value }
    })} />
    <MessageField {...props} path={["booking", "location"]} label="Location (optional)" />
    <MessageField {...props} path={["booking", "managementUrl"]} label="Manage booking link (optional)" />
    <MessageField {...props} path={["buttonLabel"]} label="Button text" />
    <Button variant="outline" onClick={() => props.details("More booking details", [
      { path: ["booking", "endAt"], label: "End date and time (ISO with UTC offset)" }, { path: ["booking", "url"], label: "Booking URL" },
      { path: ["booking", "description"], label: "Description" }, { path: ["booking", "phoneNumber"], label: "Phone number" }, { path: ["booking", "email"], label: "Email" },
      ...["language", "meetingType", "detailsTitle", "addToCalendar", "viewOnMap", "manageBooking"].map(name => ({ path: ["booking", "labels", name] as FieldPath, label: name.replace(/([A-Z])/g, " $1") })),
    ])}>More booking details</Button>
    {props.content.actions && <ActionFields {...props} path={["actions"]} family="actions" />}
    {!props.content.actions && <Button variant="outline" onClick={() => props.change(["actions"], [{ type: "url", label: "", url: "" }])}>+ Add action</Button>}
  </>
}

export function MessageEditor({ kind, nativeSource, nativeError, onNativeChange, ...props }: EditorProps & {
  kind: MessageKind; nativeSource: string; nativeError?: string; onNativeChange: (value: string) => void
}) {
  const content = props.content
  if (content.type === "native") return <><h2>Native message</h2><p className="studio-note">Native actions depend on the WhatsApp account and recipient.</p>
    <label htmlFor="studio-native-json">Message JSON</label><textarea id="studio-native-json" className="studio-json" value={nativeSource} onChange={event => onNativeChange(event.target.value)} aria-invalid={!!nativeError} />
    {nativeError && <p role="alert" className="studio-error">{nativeError}</p>}</>
  return <>
    <h2>{kind === "form" ? "Form questions" : kind === "carousel" ? "Image cards" : kind === "booking" ? "Booking details" : "Message content"}</h2>
    {content.type === "buttons" && <HeaderFields {...props} />}
    <MessageField {...props} path={["body"]} label="Message" multiline />
    {content.type === "buttons" && <ActionFields {...props} path={["actions"]} family={kind === "reply" ? "reply" : "actions"} />}
    {content.type === "list" && <ListFields {...props} content={content} />}
    {content.type === "form" && <QuestionFields {...props} content={content} />}
    {content.type === "carousel" && <CarouselFields {...props} content={content} />}
    {content.type === "booking" && <BookingFields {...props} content={content} />}
    <MessageField {...props} path={["footer"]} label="Footer (optional)" />
  </>
}
