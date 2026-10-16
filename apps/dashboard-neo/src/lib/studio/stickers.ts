import { listEffects, STICKER_PROFILE } from "@open-wa/stickers/browser"
import type { StickerJob, StickerEffect } from "@open-wa/stickers"
import { portableFilename } from "./files"

export const availableEffects = listEffects({ backend: "browser", availableOnly: true })
export { STICKER_PROFILE }
export type EffectInstance = { id: string; effect: StickerEffect }
export type StickerSettings = Pick<StickerJob, "quality" | "fit" | "circle" | "background" | "trim" | "fps" | "loopCount" | "author" | "pack">
export type StickerDraft = { settings: StickerSettings; effects: EffectInstance[] }
export type StickerCodeFormat = "javascript" | "http" | "json" | "cli"
export const initialStickerDraft: StickerDraft = { settings: { fit: "contain", quality: 0.82, fps: 12, loopCount: 0 }, effects: [] }

export function acceptsStickerDraft(value: unknown): value is StickerDraft {
  if (!value || typeof value !== "object") return false
  const draft = value as StickerDraft
  if (!draft.settings || typeof draft.settings !== "object" || Array.isArray(draft.settings) || !Array.isArray(draft.effects) || draft.effects.length > STICKER_PROFILE.maxEffects) return false
  const numeric = ["quality", "fps", "loopCount"]
  const strings = ["fit", "background", "author", "pack"]
  if (!Object.entries(draft.settings).every(([key, value]) => value === undefined || (numeric.includes(key) ? typeof value === "number" : strings.includes(key) ? typeof value === "string" : key === "circle" ? typeof value === "boolean" : key === "trim" && Array.isArray(value) && value.length === 2 && value.every(part => typeof part === "number")))) return false
  const ids = new Set<string>()
  return draft.effects.every(item => {
    if (!item || typeof item.id !== "string" || ids.has(item.id) || !item.effect || typeof item.effect.name !== "string") return false
    ids.add(item.id)
    const descriptor = availableEffects.find(effect => effect.name === item.effect.name)
    if (!descriptor) return false
    if (item.effect.options === undefined) return true
    if (!item.effect.options || typeof item.effect.options !== "object" || Array.isArray(item.effect.options)) return false
    return Object.entries(item.effect.options).every(([key, value]) => {
      const option = descriptor.options?.[key]
      return option?.type === "number" ? typeof value === "number" : option?.type === "string" ? typeof value === "string" : option?.type === "points" && Array.isArray(value) && value.length === 2 && value.every(point => Array.isArray(point) && point.length === 2 && point.every(coordinate => typeof coordinate === "number"))
    })
  })
}
export function effectLabel(name: string) {
  const labels: Record<string, string> = { grayscale: "Greyscale", low: "Low quality", unsharpen: "Sharpen", bayer: "Colour mosaic", recede: "Shrink away", unfreeze: "Add motion", opaque: "Solid background" }
  return labels[name] || name.charAt(0).toUpperCase() + name.slice(1)
}
export function optionLabel(name: string) {
  const labels: Record<string, string> = { seed: "Random pattern", levels: "Colour levels", fps: "Frames per second", workingSize: "Working size", color: "Colour" }
  return labels[name] || (name.charAt(0).toUpperCase() + name.slice(1)).replace(/([a-z])([A-Z])/g, "$1 $2")
}
export function stickerJob(draft: StickerDraft): StickerJob {
  return { ...draft.settings, effects: draft.effects.map(item => item.effect) }
}
export function stickerSourceName(file: File) { return "source-" + portableFilename(file.name) }
export function stickerCode(job: StickerJob, file: File, format: StickerCodeFormat) {
  const name = stickerSourceName(file)
  const json = JSON.stringify(job, null, 2)
  if (format === "json") return json
  if (format === "cli") return "openwa-sticker '" + name.replaceAll("'", "'\\''") + "' --job sticker-job.json --output sticker.webp"
  if (format === "http") return "import { readFile } from 'node:fs/promises';\n\nconst photo = await readFile(" + JSON.stringify("./" + name) + ");\nconst job = " + json + ";\nconst response = await fetch(process.env.OPENWA_API_URL.replace(/\\/$/, '') + '/api/messages/sendSticker', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.OPENWA_API_KEY },\n  body: JSON.stringify({\n    to: process.env.WA_CHAT_ID,\n    input: " + JSON.stringify("data:" + (file.type || "image/png") + ";base64,") + " + photo.toString('base64'),\n    job\n  })\n});\nif (!response.ok) throw new Error(await response.text());\nconsole.log(await response.json());"
  return "// Uses your connected client and the original source file.\nconst job = " + json + ";\nawait client.sendSticker('NUMBER@c.us', " + JSON.stringify("./" + name) + ", job);"
}

export async function storedStickerSource(file?: File): Promise<File | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("openwa-studio", 1)
    request.onupgradeneeded = () => request.result.createObjectStore("media")
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("media", file ? "readwrite" : "readonly")
      const request = file ? transaction.objectStore("media").put(file, "sticker-source") : transaction.objectStore("media").get("sticker-source")
      transaction.oncomplete = () => resolve(file || (request.result instanceof File ? request.result : null))
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { db.close() }
}
