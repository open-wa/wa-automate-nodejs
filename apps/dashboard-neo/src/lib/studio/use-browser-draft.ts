import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"

export function useBrowserDraft<T>(key: string, initial: T, accepts: (value: unknown) => value is T): [T, Dispatch<SetStateAction<T>>, string] {
  const [draft, setDraft] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const value: unknown = JSON.parse(raw)
        if (accepts(value)) return value
      }
    } catch { /* The editor remains usable when storage is unavailable. */ }
    return initial
  })
  const [status, setStatus] = useState("Saving draft…")
  const latest = useRef(draft)
  latest.current = draft
  useEffect(() => {
    const saveBeforeLeaving = () => {
      try { localStorage.setItem(key, JSON.stringify(latest.current)) }
      catch { /* Keep the editor usable if browser storage is unavailable. */ }
    }
    window.addEventListener("pagehide", saveBeforeLeaving)
    return () => { window.removeEventListener("pagehide", saveBeforeLeaving); saveBeforeLeaving() }
  }, [key])
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(draft))
        setStatus("Saved in this browser")
      } catch {
        setStatus("Draft couldn't be saved in this browser")
      }
    }, 300)
    setStatus("Saving draft…")
    return () => clearTimeout(timer)
  }, [draft, key])
  return [draft, setDraft, status]
}
