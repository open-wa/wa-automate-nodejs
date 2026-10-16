import { useId, useState, type ReactNode, type InputHTMLAttributes } from "react"
import { Menu } from "@base-ui/react/menu"
import { GripVertical, MoreHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SegmentedControl, SegmentedControlItem } from "@/components/boardui/segmented-control"
import { Select, SelectItem } from "@/components/boardui/select"
import { Tabs, TabList, Tab, TabPanel } from "@/components/boardui/tabs"
import { MENU_ITEM, MENU_POPOVER_SURFACE } from "@/components/boardui/menu-styles"
import { PageHeader } from "@/components/application/page-header"
import { cn } from "@/lib/utils"
import "./studio.css"

export type StudioView = "edit" | "preview" | "code"
export type FieldErrors = Record<string, string>
export type StudioOption = { label: string; action: () => void; destructive?: boolean }

export function StudioChoices<T extends string>({ label, value, onChange, choices }: {
  label: string; value: T; onChange: (value: T) => void; choices: readonly { value: T; label: string }[]
}) {
  return <SegmentedControl aria-label={label} selectedKeys={[value]} onSelectionChange={keys => {
    const next = keys.values().next().value
    if (typeof next === "string") onChange(next as T)
  }} className="studio-choices flex-wrap">{choices.map(choice =>
    <SegmentedControlItem id={choice.value} key={choice.value} className="min-h-9 max-sm:min-h-11">{choice.label}</SegmentedControlItem>
  )}</SegmentedControl>
}

export function StudioTypeChoices<T extends string>(props: { label: string; value: T; onChange: (value: T) => void; choices: readonly { value: T; label: string }[] }) {
  return <><div className="studio-desktop-type"><StudioChoices {...props} /></div><div className="studio-mobile-type"><StudioSelect label={props.label} hideLabel value={props.value} onChange={value => props.onChange(value as T)} choices={props.choices} /></div></>
}

export function StudioSelect({ label, value, onChange, choices, id, hideLabel = false }: {
  label: string; value: string; onChange: (value: string) => void; choices: readonly { value: string; label: string }[]; id?: string; hideLabel?: boolean
}) {
  const generatedId = useId()
  const triggerId = id || generatedId
  return <div className="studio-field">{!hideLabel && <label htmlFor={triggerId}>{label}</label>}
    <Select aria-label={label} triggerId={triggerId} selectedKey={value} onSelectionChange={key => onChange(String(key))} triggerClassName="min-h-10 max-sm:min-h-11" popoverClassName="z-[70] max-h-72 overflow-auto">
      {choices.map(choice => <SelectItem id={choice.value} key={choice.value} textValue={choice.label}>{choice.label}</SelectItem>)}
    </Select>
  </div>
}

export function StudioLayout({ title, description, actions, mobileActions, navigation, view, onViewChange, inspector, preview, code, previewLabel = "Preview" }: {
  title: string; description: string; actions: ReactNode; navigation?: ReactNode; view: StudioView;
  onViewChange: (value: StudioView) => void; inspector: ReactNode; preview: ReactNode; code: ReactNode; mobileActions?: ReactNode; previewLabel?: string
}) {
  return <div className="dashboard-page studio space-y-5">
    <div className="studio-heading"><PageHeader title={title} description={description} actions={actions} /></div>
    {navigation}
    <Tabs selectedKey={view} onSelectionChange={key => onViewChange(key as StudioView)}>
    <div className="studio-mobile-navigation"><TabList aria-label="Workspace view"><Tab id="edit" className="min-h-11">Edit</Tab><Tab id="preview" className="min-h-11">{previewLabel}</Tab><Tab id="code" className="min-h-11">Code</Tab></TabList></div>
    <TabPanel id={view} className="studio-panels" data-view={view}>
      <section aria-label="Editor" className="studio-panel studio-editor">{inspector}</section>
      <section aria-label="Preview" className="studio-panel studio-preview">{preview}</section>
      <section aria-label="Code" className="dark studio-panel studio-code">{code}</section>
    </TabPanel>
    </Tabs>
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
  return <Menu.Root><Menu.Trigger render={<Button variant="ghost" size="icon" className="studio-options-trigger" aria-label={label} title={label} />}><MoreHorizontal /></Menu.Trigger>
    <Menu.Portal><Menu.Positioner sideOffset={4} align="end" className="z-50"><Menu.Popup className={cn(MENU_POPOVER_SURFACE, "min-w-52")}>
      {options.map(option => <Menu.Item key={option.label} onClick={option.action} className={cn(MENU_ITEM, "min-h-10 text-body-medium data-highlighted:bg-dropdown-item-hover-background max-sm:min-h-11", option.destructive && "text-status-rose-text")}>{option.label}</Menu.Item>)}
    </Menu.Popup></Menu.Positioner></Menu.Portal>
  </Menu.Root>
}

export function StudioRow({ rowId, group, label, value, onChange, error, selected, onSelect, onMove, onDrop, onRemove, inputId, details = [] }: {
  rowId: string; group: string; label: string; value?: string; onChange?: (value: string) => void;
  error?: string; selected?: boolean; onSelect?: () => void; onMove: (direction: -1 | 1) => void;
  onDrop: (id: string) => void; onRemove: () => void; inputId?: string; details?: StudioOption[]
}) {
  const generatedId = useId()
  const id = inputId || generatedId
  const [over, setOver] = useState(false)
  return <div className={cn("studio-row", selected && "studio-row-selected", over && "studio-row-over")}
    onDragOver={event => { event.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
    onDrop={event => {
      event.preventDefault(); setOver(false)
      try { const item = JSON.parse(event.dataTransfer.getData("application/x-openwa-studio-row")); if (item.group === group && typeof item.id === "string") onDrop(item.id) } catch { /* Ignore unrelated drops. */ }
    }}>
    <div className="studio-row-line">
      <Button variant="ghost" size="icon" draggable className="studio-drag" aria-label={"Reorder " + label} title="Drag to reorder, or press Alt + Up or Down"
        onDragStart={event => { event.dataTransfer.setData("application/x-openwa-studio-row", JSON.stringify({ group, id: rowId })); event.dataTransfer.effectAllowed = "move" }}
        onKeyDown={event => { if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); onMove(event.key === "ArrowUp" ? -1 : 1) } }}><GripVertical aria-hidden /></Button>
      {onChange ? <Input id={id} aria-label={label} value={value || ""} onFocus={onSelect} placeholder={label} onChange={event => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} className="studio-input" />
        : <Button variant="ghost" className="studio-row-label" aria-pressed={selected} onClick={onSelect}>{label}</Button>}
      <Button variant="ghost" size="icon" className="studio-remove" aria-label={"Delete " + label} title={"Delete " + label} onClick={onRemove}><X aria-hidden /></Button>
    </div>
    {selected && details.length > 0 && <div className="studio-row-details">{details.map(detail => <Button key={detail.label} variant="link" size="xs" onClick={detail.action}>{detail.label}</Button>)}</div>}
    {error && <p id={id + "-error"} className="studio-error studio-row-error">{error}</p>}
  </div>
}

export function StudioCode({ value, children, footer }: { value: string; children?: ReactNode; footer?: ReactNode }) {
  return <div className="studio-code-content"><h2>Code</h2>{children}<pre tabIndex={0} aria-label="Generated code" data-base-ui-swipe-ignore>{value}</pre>{footer}</div>
}

export function EmptyStudio({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="studio-empty"><h2>{title}</h2>{children}</div>
}

