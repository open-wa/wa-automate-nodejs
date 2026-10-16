import { useId, useState, type ReactNode, type InputHTMLAttributes } from "react"
import { Menu } from "@base-ui/react/menu"
import { GripVertical, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/application/page-header"
import { cn } from "@/lib/utils"
import "./studio.css"

export type StudioView = "edit" | "preview" | "code"
export type FieldErrors = Record<string, string>
export type StudioOption = { label: string; action: () => void; destructive?: boolean }

export function StudioChoices<T extends string>({ label, value, onChange, choices }: {
  label: string; value: T; onChange: (value: T) => void; choices: readonly { value: T; label: string }[]
}) {
  return <div role="group" aria-label={label} className="studio-choices">{choices.map(choice =>
    <button type="button" key={choice.value} aria-pressed={value === choice.value} onClick={() => onChange(choice.value)}>{choice.label}</button>
  )}</div>
}

export function StudioTypeChoices<T extends string>(props: { label: string; value: T; onChange: (value: T) => void; choices: readonly { value: T; label: string }[] }) {
  return <><div className="studio-desktop-type"><StudioChoices {...props} /></div><select aria-label={props.label} className="studio-select studio-mobile-type" value={props.value} onChange={event => props.onChange(event.target.value as T)}>{props.choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></>
}

export function StudioLayout({ title, description, actions, mobileActions, navigation, view, onViewChange, inspector, preview, code, previewLabel = "Preview" }: {
  title: string; description: string; actions: ReactNode; navigation?: ReactNode; view: StudioView;
  onViewChange: (value: StudioView) => void; inspector: ReactNode; preview: ReactNode; code: ReactNode; mobileActions?: ReactNode; previewLabel?: string
}) {
  return <div className="dashboard-page studio space-y-5">
    <div className="studio-heading"><PageHeader title={title} description={description} actions={actions} /></div>
    {navigation}
    <div className="studio-mobile-navigation"><StudioChoices label="Workspace view" value={view} onChange={onViewChange}
      choices={[{ value: "edit", label: "Edit" }, { value: "preview", label: previewLabel }, { value: "code", label: "Code" }]} /></div>
    <div className="studio-panels" data-view={view}>
      <section aria-label="Editor" className="studio-panel studio-editor">{inspector}</section>
      <section aria-label="Preview" className="studio-panel studio-preview">{preview}</section>
      <section aria-label="Code" className="studio-panel studio-code">{code}</section>
    </div>
    {mobileActions && <div className="studio-mobile-actions">{mobileActions}</div>}
  </div>
}

export function StudioField({ label, value, onChange, error, multiline, children, ...props }: {
  label: string; value?: string | number; onChange?: (value: string) => void; error?: string; multiline?: boolean; children?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "children">) {
  const generatedId = useId()
  const id = props.id || generatedId
  const errorId = id + "-error"
  return <div className="studio-field">
    <label htmlFor={id}>{label}</label>
    {children || (multiline ? <Textarea id={id} value={value} onChange={event => onChange?.(event.target.value)} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} className="studio-textarea" />
      : <Input {...props} id={id} value={value} onChange={event => onChange?.(event.target.value)} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} className="studio-input" />)}
    {error && <p id={errorId} className="studio-error">{error}</p>}
  </div>
}

export function StudioOptions({ label, options }: { label: string; options: StudioOption[] }) {
  return <Menu.Root><Menu.Trigger render={<Button variant="ghost" size="icon-lg" className="studio-options-trigger" aria-label={label} title={label} />}><MoreHorizontal /></Menu.Trigger>
    <Menu.Portal><Menu.Positioner sideOffset={4} align="end" className="z-50"><Menu.Popup className="studio-options-menu">
      {options.map(option => <Menu.Item key={option.label} onClick={option.action} className={cn("studio-option", option.destructive && "studio-option-danger")}>{option.label}</Menu.Item>)}
    </Menu.Popup></Menu.Positioner></Menu.Portal>
  </Menu.Root>
}

export function StudioRow({ rowId, group, index, count, label, value, onChange, error, selected, onSelect, onMove, onDrop, onRemove, onDuplicate, inputId, options = [] }: {
  rowId: string; group: string; index: number; count: number; label: string; value?: string; onChange?: (value: string) => void;
  error?: string; selected?: boolean; onSelect?: () => void; onMove: (direction: -1 | 1) => void;
  onDrop: (id: string) => void; onRemove: () => void; onDuplicate?: () => void; inputId?: string; options?: StudioOption[]
}) {
  const generatedId = useId()
  const id = inputId || generatedId
  const [over, setOver] = useState(false)
  const actions: StudioOption[] = [
    ...(index > 0 ? [{ label: "Move up", action: () => onMove(-1) }] : []),
    ...(index < count - 1 ? [{ label: "Move down", action: () => onMove(1) }] : []),
    ...(onDuplicate ? [{ label: "Duplicate", action: onDuplicate }] : []),
    ...options,
    { label: "Remove", action: onRemove, destructive: true },
  ]
  return <div className={cn("studio-row", selected && "studio-row-selected", over && "studio-row-over")}
    onDragOver={event => { event.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
    onDrop={event => {
      event.preventDefault(); setOver(false)
      try { const item = JSON.parse(event.dataTransfer.getData("application/x-openwa-studio-row")); if (item.group === group && typeof item.id === "string") onDrop(item.id) } catch { /* Ignore unrelated drops. */ }
    }}>
    <div className="studio-row-line">
      <button type="button" draggable className="studio-drag" aria-label={"Reorder " + label} title="Drag to reorder, or use the options menu"
        onDragStart={event => { event.dataTransfer.setData("application/x-openwa-studio-row", JSON.stringify({ group, id: rowId })); event.dataTransfer.effectAllowed = "move" }}
        onKeyDown={event => { if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); onMove(event.key === "ArrowUp" ? -1 : 1) } }}><GripVertical aria-hidden /></button>
      {onChange ? <Input id={id} aria-label={label} value={value || ""} onFocus={onSelect} placeholder={label} onChange={event => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} className="studio-input" />
        : <button type="button" className="studio-row-label" aria-pressed={selected} onClick={onSelect}>{label}</button>}
      <StudioOptions label={label + " options"} options={actions} />
    </div>
    {error && <p id={id + "-error"} className="studio-error studio-row-error">{error}</p>}
  </div>
}

export function StudioCode({ value, children, footer }: { value: string; children?: ReactNode; footer?: ReactNode }) {
  return <div className="studio-code-content"><h2>Code</h2>{children}<pre tabIndex={0} aria-label="Generated code" data-base-ui-swipe-ignore>{value}</pre>{footer}</div>
}

export function EmptyStudio({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="studio-empty"><h2>{title}</h2>{children}</div>
}

