import { InteractiveContentSchema, type InteractiveContent, type InteractiveAction } from "@open-wa/schema/interactive"
import type { FieldErrors } from "@/components/studio/shared"
import { newStudioKey } from "./files"

export type MessageKind = "reply" | "actions" | "list" | "form" | "carousel" | "booking" | "native"
export type CodeFormat = "javascript" | "http" | "json"
export type FieldPath = (string | number)[]
export const messageKinds: { value: MessageKind; label: string }[] = [
  { value: "reply", label: "Reply buttons" }, { value: "actions", label: "Link, call or copy" },
  { value: "list", label: "Menu" }, { value: "form", label: "Questions" },
  { value: "carousel", label: "Image cards" }, { value: "booking", label: "Booking" }, { value: "native", label: "Advanced" },
]
export const codeFormats: { value: CodeFormat; label: string }[] = [
  { value: "javascript", label: "JavaScript" }, { value: "http", label: "HTTP" }, { value: "json", label: "JSON" },
]

export const messageExamples: Record<MessageKind, InteractiveContent> = {
  reply: { type: "buttons", header: { type: "text", text: "Welcome to Rosa" }, body: "Hi! How can we help you today?", footer: "Reply below", actions: [
    { type: "reply", id: "booking", label: "Book an appointment" }, { type: "reply", id: "questions", label: "Ask a question" },
  ] },
  actions: { type: "buttons", header: { type: "text", text: "Your next visit" }, body: "Everything you need for your visit.", actions: [
    { type: "url", label: "Visit our website", url: "https://rosa.example" },
    { type: "call", label: "Call the salon", phoneNumber: "+442079460123" }, { type: "copy", label: "Copy offer code", code: "WELCOME10" },
  ] },
  list: { type: "list", title: "Our services", body: "Choose a service to get started.", buttonLabel: "View services", sections: [
    { title: "Hair", rows: [{ id: "cut_finish", title: "Cut & finish", description: "Wash, cut and style" }, { id: "colour", title: "Colour consultation", description: "Find your next colour" }] },
  ] },
  form: { type: "form", title: "Your preferences", body: "Tell us what you'd like.", questions: [
    { type: "singleSelect", id: "service", label: "What appointment?", options: [{ id: "cut_finish", label: "Cut & finish" }, { id: "colour", label: "Colour consultation" }] },
    { type: "multiSelect", id: "extras", label: "Anything else?", options: [{ id: "quiet", label: "Quiet appointment" }, { id: "advice", label: "Style advice" }] },
  ] },
  carousel: { type: "carousel", body: "Choose your kit.", cards: [
    { body: "Starter kit · £29", header: { type: "image", source: "https://placehold.co/600x400/png?text=Starter+kit" }, actions: [{ type: "reply", id: "starter", label: "Choose Starter" }] },
    { body: "Gift set · £49", header: { type: "image", source: "https://placehold.co/600x400/png?text=Gift+set" }, actions: [{ type: "reply", id: "gift", label: "Choose Gift" }] },
  ] },
  booking: { type: "booking", title: "Appointment confirmed", body: "Your appointment is booked.", buttonLabel: "View booking", booking: {
    startAt: "2026-10-20T14:00:00+01:00", endAt: "2026-10-20T15:00:00+01:00", location: "Rosa Salon, London",
    managementUrl: "https://rosa.example/booking/123",
  } },
  native: { type: "native", body: "Choose an option.", actions: [{ name: "quick_reply", parameters: { display_text: "Ask a question", id: "question" } }] },
}

export type MessageDraft = { active: MessageKind; documents: Record<MessageKind, InteractiveContent>; nativeSource?: string }
export const initialMessageDraft: MessageDraft = { active: "reply", documents: messageExamples }

export function acceptsMessageDraft(value: unknown): value is MessageDraft {
  if (!value || typeof value !== "object") return false
  const draft = value as MessageDraft
  return (draft.nativeSource === undefined || typeof draft.nativeSource === "string") && messageKinds.some(kind => kind.value === draft.active) && !!draft.documents &&
    messageKinds.every(kind => {
      const result = InteractiveContentSchema.safeParse(draft.documents[kind.value])
      return result.success || result.error.issues.every(issue => ["too_small", "custom", "invalid_format"].includes(issue.code))
    })
}

const identities = new WeakMap<object, string>()
export function uiKey(item: object): string {
  let key = identities.get(item)
  if (!key) { key = newStudioKey("item"); identities.set(item, key) }
  return key
}
export function fieldId(path: FieldPath) { return "studio-message-" + path.join("-") }
export function pathValue(value: unknown, path: FieldPath): unknown {
  return path.reduce<unknown>((current, key) => current && typeof current === "object" ? (current as Record<string | number, unknown>)[key] : undefined, value)
}
export function updatePath<T>(value: T, path: FieldPath, replacement: unknown): T {
  if (!path.length) {
    if (value && replacement && typeof value === "object" && typeof replacement === "object") identities.set(replacement, uiKey(value))
    return replacement as T
  }
  const [head, ...tail] = path
  const source = value && typeof value === "object" ? value as Record<string | number, unknown> : {}
  const next = (Array.isArray(value) ? [...value] : { ...source }) as unknown as Record<string | number, unknown>
  next[head] = updatePath(source[head], tail, replacement)
  if (value && typeof value === "object") identities.set(next, uiKey(value))
  return next as T
}

export function validateMessage(content: InteractiveContent) {
  const parsed = InteractiveContentSchema.safeParse(content)
  const errors: FieldErrors = {}
  if (!parsed.success) for (const issue of parsed.error.issues) {
    const path = issue.path.map(String).join(".")
    const leaf = issue.path.at(-1)
    const empty = leaf === "actions" ? "Add a button." : leaf === "rows" ? "Add a choice." : leaf === "sections" ? "Add a group." : leaf === "questions" ? "Add a question." : leaf === "options" ? "Add an option." : leaf === "cards" ? "Add a card." : leaf === "label" ? (issue.path.includes("options") ? "Enter option text." : issue.path.includes("questions") ? "Enter a question." : "Enter button text.")
      : leaf === "body" ? "Enter a message." : leaf === "id" ? "Enter a key." : "Add a value."
    errors[path] = issue.code === "too_small" || (leaf === "id" && issue.code === "invalid_type") ? empty
      : issue.code === "invalid_format" ? (/url$/i.test(String(leaf)) ? "Use an HTTP or HTTPS URL." : "Check this value.") : issue.message
  }
  const checkSources = (value: unknown, path: string[] = []) => {
    if (!value || typeof value !== "object") return
    for (const [key, child] of Object.entries(value)) {
      if (key === "source" && typeof child === "string" && child.startsWith("blob:")) errors[[...path, key].join(".")] = "Choose the file again or use an image URL."
      else checkSources(child, [...path, key])
    }
  }
  checkSources(content)
  return { valid: parsed.success && !Object.keys(errors).length, content: parsed.success ? parsed.data : null, errors }
}

export function freshReplyIds<T>(value: T): T {
  const next: unknown = JSON.parse(JSON.stringify(value))
  function visit(item: unknown) {
    if (!item || typeof item !== "object") return
    if ("id" in item && typeof item.id === "string") item.id = newStudioKey(item.id.replace(/_[a-f0-9]{16}$/, ""))
    Object.values(item).forEach(visit)
  }
  visit(next)
  return next as T
}

export function supportsReply(content: InteractiveContent) {
  return content.type === "list" || content.type === "form" || content.type === "native" ||
    (content.type === "buttons" && content.actions.some(action => action.type === "reply")) ||
    (content.type === "carousel" && content.cards.some(card => card.actions.some(action => action.type === "reply")))
}

export function messageCode(content: InteractiveContent, format: CodeFormat, purpose: "send" | "replies") {
  if (purpose === "replies") return content.type === "form"
    ? "// Register before sending the message.\nawait client.onFormResponse(response => {\n  console.log(response.answers);\n});"
    : "// Register before sending the message.\nawait client.onInteractiveResponse(response => {\n  console.log(response);\n});"
  const json = JSON.stringify(content, null, 2)
  if (format === "json") return json
  if (format === "http") {
    const payload = JSON.stringify({ to: "NUMBER@c.us", content }, null, 2).replaceAll("'", "'\\''")
    return "curl \"$OPENWA_API_URL/api/messages/sendInteractive\" \\\n  -H \"X-API-Key: $OPENWA_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  --data '" + payload + "'"
  }
  return "// Uses your connected OpenWA client.\nconst to = 'NUMBER@c.us';\nconst content = " + json + ";\n\nawait client.sendInteractive(to, content);"
}

export function actionDescription(action: InteractiveAction) {
  if (action.type === "url") return "Would open " + action.url
  if (action.type === "call") return "Would call " + action.phoneNumber
  if (action.type === "copy") return "Would copy " + action.code
  return "Reply key: " + action.id
}
