import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string
  description: string
  badge?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-title-1-medium text-text-primary">{title}</h1>
          {badge}
        </div>
        <p className="text-body-regular text-text-secondary">{description}</p>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  )
}
