import { toast } from "sonner"

export async function copyStudioCode(code: string, showCode: () => void) {
  try {
    await navigator.clipboard.writeText(code)
    toast.success("Code copied")
  } catch {
    showCode()
    toast.error("Select the code to copy it. Clipboard access is unavailable.")
  }
}

export function downloadStudioFile(name: string, data: BlobPart, type = "application/json") {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readMediaFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("This file couldn't be read. Choose it again."))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

export function portableFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "") || "photo.webp"
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items
  const next = [...items]
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}

export function newStudioKey(prefix = "reply") {
  return prefix + "_" + Array.from(crypto.getRandomValues(new Uint32Array(2)), value => value.toString(16).padStart(8, "0")).join("")
}

export async function downloadStudioArchive(name: string, files: Record<string, string | Uint8Array>) {
  const { zipSync, strToU8 } = await import("fflate")
  const archive = zipSync(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, typeof value === "string" ? strToU8(value) : value])), { level: 0 })
  downloadStudioFile(name, archive as Uint8Array<ArrayBuffer>, "application/zip")
}

export function apiExampleFiles(method: "sendInteractive" | "sendSticker", files: Record<string, string | Uint8Array>, payloadCode: string) {
  return {
    ...files,
    ".env.example": "OPENWA_API_URL=http://localhost:8002\nOPENWA_API_KEY=YOUR_API_KEY\nWA_CHAT_ID=NUMBER@c.us\n",
    "send.mjs": "import { readFile } from 'node:fs/promises';\n\nfor (const name of ['OPENWA_API_URL', 'OPENWA_API_KEY', 'WA_CHAT_ID']) {\n  if (!process.env[name]) throw new Error('Set ' + name + ' in .env');\n}\n\n" + payloadCode + "\nconst response = await fetch(process.env.OPENWA_API_URL.replace(/\\/$/, '') + '/api/messages/" + method + "', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.OPENWA_API_KEY },\n  body: JSON.stringify(payload)\n});\nif (!response.ok) throw new Error(await response.text());\nconsole.log(await response.json());\n",
    "README.txt": "1. Extract all files into one folder.\n2. Rename .env.example to .env and fill in the API address, API key and chat ID.\n3. Run: node --env-file=.env send.mjs\n\nRun the script only when you want to send one message. Copying or downloading this example sends nothing.\nRequires a running OpenWA Easy API and Node.js with --env-file support.\n",
  }
}
