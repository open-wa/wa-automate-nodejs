import { useEffect, useRef, useState } from "react"

/** Decode animation only while its tile is visible. Still WebPs also support paused previews. */
export function EffectThumbnail({ name, animate }: { name: string; animate: boolean }) {
  const ref = useRef<HTMLImageElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting))
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <img ref={ref} src={import.meta.env.BASE_URL + "studio/effects/" + name + (animate && visible ? "" : "-still") + ".webp"} alt="" width={144} height={144} loading="lazy" decoding="async" />
}
