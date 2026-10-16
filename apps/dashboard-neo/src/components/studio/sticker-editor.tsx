import { useId, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/boardui/checkbox"
import { Slider } from "@/components/boardui/slider"
import { StudioChoices, StudioField, StudioRow } from "./shared"
import { availableEffects, effectLabel, optionLabel, STICKER_PROFILE, type EffectInstance, type StickerDraft, type StickerSettings } from "@/lib/studio/stickers"
import { moveItem, newStudioKey } from "@/lib/studio/files"

export type StickerPanel = "effects" | "shape" | "animation" | "pack"

export function StickerEditor({ file, onFile, draft, setDraft, panel, search, setSearch, filter, setFilter, selected, setSelected, error }: {
  file: File; onFile: (file: File) => void; draft: StickerDraft; setDraft: Dispatch<SetStateAction<StickerDraft>>;
  panel: StickerPanel; search: string; setSearch: (value: string) => void; filter: string; setFilter: (value: string) => void;
  selected: string; setSelected: (value: string) => void; error?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const settings = draft.settings
  const setting = <K extends keyof StickerSettings>(key: K, value: StickerSettings[K]) => setDraft(previous => ({ ...previous, settings: { ...previous.settings, [key]: value } }))
  const updateEffects = (effects: EffectInstance[]) => setDraft(previous => ({ ...previous, effects }))
  const current = draft.effects.find(item => item.id === selected)
  const descriptor = availableEffects.find(item => item.name === current?.effect.name)
  const effects = availableEffects.filter(effect => (!search || effectLabel(effect.name).toLowerCase().includes(search.toLowerCase())) && (filter === "all" || (filter === "animated" ? effect.animated : !effect.animated)))
  return <>
    <div className="studio-section"><h2>{panel === "effects" ? "Media and effects" : panel === "shape" ? "Size and shape" : panel === "animation" ? "Animation" : "Pack and creator"}</h2>
      <div className="studio-section-heading"><span className="studio-note break-all">{file.name}</span><Button variant="ghost" size="sm" onClick={() => input.current?.click()}>Change photo</Button></div>
      <input ref={input} type="file" className="sr-only" accept="image/png,image/jpeg,image/gif,image/webp" aria-label="Change sticker source" onChange={event => { const value = event.target.files?.[0]; if (value) onFile(value); event.currentTarget.value = "" }} /></div>
    {panel === "effects" && <>
      <StudioField label="Add an effect" type="search" value={search} onChange={setSearch} placeholder="Search effects" />
      <StudioChoices label="Effect type" value={filter} onChange={setFilter} choices={[{ value: "all", label: "All" }, { value: "static", label: "Static" }, { value: "animated", label: "Animated" }]} />
      <div className="studio-effect-grid" aria-label="Available effects">{effects.map(effect => <Button key={effect.name} variant="outline" size="sm" className="h-auto min-h-10 justify-start whitespace-normal text-start max-sm:min-h-11" disabled={draft.effects.length >= STICKER_PROFILE.maxEffects} onClick={() => {
        const item: EffectInstance = { id: newStudioKey("effect"), effect: { name: effect.name } }
        setDraft(previous => ({ ...previous, effects: [...previous.effects, item] })); setSelected(item.id)
      }}>{"+ " + effectLabel(effect.name)}</Button>)}</div>
      {!effects.length && <p className="studio-note">No matching effects.</p>}
      <div className="studio-section"><div className="studio-section-heading"><h3>Applied effects</h3><span className="studio-note">{draft.effects.length + " of " + STICKER_PROFILE.maxEffects}</span></div>
        {!draft.effects.length && <p className="studio-note">Choose an effect above.</p>}
        {draft.effects.map((item, index) => <StudioRow key={item.id} rowId={item.id} group="sticker-effects" index={index} count={draft.effects.length} label={effectLabel(item.effect.name)} selected={selected === item.id}
          onSelect={() => setSelected(item.id)} onMove={direction => updateEffects(moveItem(draft.effects, index, index + direction))}
          onDrop={id => updateEffects(moveItem(draft.effects, draft.effects.findIndex(item => item.id === id), index))}
          onRemove={() => { updateEffects(draft.effects.filter(value => value.id !== item.id)); if (selected === item.id) setSelected(draft.effects[index + 1]?.id || draft.effects[index - 1]?.id || "") }}
          onDuplicate={draft.effects.length < STICKER_PROFILE.maxEffects ? () => {
            const duplicate = { id: newStudioKey("effect"), effect: structuredClone(item.effect) }
            updateEffects([...draft.effects.slice(0, index + 1), duplicate, ...draft.effects.slice(index + 1)]); setSelected(duplicate.id)
          } : undefined} />)}
      </div>
      {current && descriptor?.defaults && Object.keys(descriptor.defaults).length > 0 && <div className="studio-section"><h3>{effectLabel(current.effect.name) + " settings"}</h3>
        {Object.entries(descriptor.defaults).map(([key, defaultValue]) => {
          const value = current.effect.options?.[key] ?? defaultValue
          const option = descriptor.options?.[key]
          const update = (value: unknown) => setDraft(previous => ({ ...previous, effects: previous.effects.map(item => item.id === current.id ? { ...item, effect: { ...item.effect, options: { ...item.effect.options, [key]: value } } } : item) }))
          if (option?.type === "number" && key === "seed") return <div key={key} className="studio-section"><StudioField label="Random pattern" type="number" min={option.min} max={option.max} step={option.step} value={Number(value)} onChange={value => update(Number(value))} />
            <Button variant="outline" size="sm" onClick={() => update(crypto.getRandomValues(new Uint32Array(1))[0])}>Try another pattern</Button></div>
          if (option?.type === "number") return <StickerNumber key={key} label={optionLabel(key)} min={option.min} max={option.max} step={option.step} integer={option.integer} value={Number(value)} onChange={update} />
          if (typeof defaultValue === "string") return <StudioField key={key} label={optionLabel(key)} maxLength={option?.type === "string" ? option.maxLength : undefined} value={String(value)} onChange={update} />
          if (Array.isArray(defaultValue) && key === "eyes") {
            const points = (Array.isArray(value) ? value : defaultValue) as number[][]
            return <div className="studio-section" key={key}><h3>Eye positions</h3>{points.map((point, i) => <div className="grid grid-cols-2 gap-2" key={i}>{point.map((coordinate, axis) =>
              <StudioField key={axis} label={"Eye " + (i + 1) + (axis ? " Y" : " X")} type="number" min="0" max="1" step="0.01" value={coordinate} onChange={value => update(points.map((point, p) => p === i ? point.map((coordinate, a) => a === axis ? Number(value) : coordinate) : point))} />
            )}</div>)}</div>
          }
          return null
        })}
      </div>}
      <p className="studio-note">Effects run from top to bottom.</p>
    </>}
    {panel === "shape" && <>
      <p className="studio-note">{STICKER_PROFILE.width + " × " + STICKER_PROFILE.height + " pixels"}</p>
      <div className="studio-section"><h3>Fit</h3><StudioChoices label="Image fit" value={settings.fit || "contain"} onChange={value => setting("fit", value)} choices={[{ value: "contain", label: "Fit image" }, { value: "cover", label: "Fill frame" }]} /></div>
      <Checkbox className="min-h-9 max-sm:min-h-11" isSelected={!!settings.circle} onChange={value => setting("circle", value)}>Circle</Checkbox>
      <Checkbox className="min-h-9 max-sm:min-h-11" isSelected={!!settings.background} onChange={value => setting("background", value ? "#ffffff" : undefined)}>Add a background</Checkbox>
      {settings.background && <StudioField label="Background colour" value={settings.background} onChange={value => setting("background", value)} />}
      <StickerNumber label="Quality" value={Math.round((settings.quality ?? 0.82) * 100)} min={1} max={100} onChange={value => setting("quality", value / 100)} />
    </>}
    {panel === "animation" && <>
      <StickerNumber label="Frames per second" value={settings.fps ?? 12} min={1} max={30} onChange={value => setting("fps", value)} />
      <Checkbox className="min-h-9 max-sm:min-h-11" isSelected={!!settings.trim} onChange={value => setting("trim", value ? [0, 2000] : undefined)}>Use part of the source</Checkbox>
      {settings.trim && <><StudioField label="Start (seconds)" type="number" min="0" step="0.1" value={settings.trim[0] / 1000} onChange={value => setting("trim", [Number(value) * 1000, settings.trim![1]])} />
        <StudioField label="End (seconds)" type="number" min="0" step="0.1" value={settings.trim[1] / 1000} onChange={value => setting("trim", [settings.trim![0], Number(value) * 1000])} /></>}
      <Checkbox className="min-h-9 max-sm:min-h-11" isSelected={!settings.loopCount} onChange={value => setting("loopCount", value ? 0 : 1)}>Loop continuously</Checkbox>
      {!!settings.loopCount && <StudioField label="Number of loops" type="number" min="1" max="65535" value={settings.loopCount} onChange={value => setting("loopCount", Number(value))} />}
      <p className="studio-note">{"Up to " + STICKER_PROFILE.maxDurationMs / 1000 + " seconds or " + STICKER_PROFILE.maxFrames + " frames."}</p>
    </>}
    {panel === "pack" && <><StudioField label="Pack name (optional)" maxLength={128} value={settings.pack || ""} onChange={value => setting("pack", value || undefined)} />
      <StudioField label="Creator (optional)" maxLength={128} value={settings.author || ""} onChange={value => setting("author", value || undefined)} /><p className="studio-note">OpenWA applies these labels when it sends the sticker.</p></>}
    {error && <p role="alert" className="studio-error">{error}</p>}
  </>
}

function StickerNumber({ label, value, min, max, step = 1, integer = step === 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; integer?: boolean; onChange: (value: number) => void }) {
  const id = useId()
  const error = !Number.isFinite(value) || value < min || value > max || integer && !Number.isInteger(value) ? "Use " + (integer ? "a whole number" : "a number") + " from " + min + " to " + max + "." : ""
  return <StudioField id={id} label={label} error={error}><div className="studio-slider"><Slider aria-label={label + " slider"} thumbLabel={label} minValue={min} maxValue={max} step={step} value={Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))} onChange={onChange} showTooltip={false} />
    <Input id={id} aria-label={label} aria-invalid={!!error} aria-describedby={error ? id + "-error" : undefined} className="studio-input" type="number" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></div></StudioField>
}
