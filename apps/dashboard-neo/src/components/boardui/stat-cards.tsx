"use client"

import type { ComponentType, ReactNode } from "react"
import { ArrowDownCircle, ArrowUpCircle, MinusCircle, Info } from "lucide-react"
import { Chip } from "@/components/boardui/chip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@open-wa/ui-components/popover"
import { cx } from "@/utils/cx"

/**
 * Figma source: Board UI → dashboard 1 → Frame 20 (node 3731:3160) for the
 * plain cards; the footer variant follows the same inner-tile recipe as the
 * recent hires card.
 *
 * KPI stat cards in two looks:
 *
 *   plain   icon tile, label, value, delta chip — the compact dashboard row
 *   footer  tinted gradient icon tile beside the label (plus an optional
 *           info tooltip), a display-size value, and a white footer band
 *           carrying the comparison caption and a delta pill
 */

type IconComponent = ComponentType<{
  className?: string
  "aria-hidden"?: boolean | "true" | "false"
}>

export type StatCardsVariant = "plain" | "footer"

/** Tint of the footer variant's gradient icon tile. */
export type StatTone = "blue" | "orange" | "purple" | "pink" | "sky" | "emerald"

export type Stat = {
  icon: IconComponent
  label: string
  value: ReactNode
  delta?: string
  deltaColor?: "lime" | "rose" | "neutral"
  /** Footer variant: icon tile tint (defaults to blue). */
  tone?: StatTone
  /** Footer variant: context or comparison caption in the band. */
  caption?: string
  /** Footer variant: shows an info glyph with this text on hover. */
  hint?: string
}

/** Gradient stops for the footer variant's icon tile, keyed by tone. */
const TILE_TONES: Record<StatTone, string> = {
  blue: "from-accent-500 to-accent-600 text-text-white",
  orange:
    "from-status-orange-background to-background-inner-default text-status-orange-text",
  purple:
    "from-status-purple-background to-background-inner-default text-status-purple-text",
  pink: "from-status-rose-background to-background-inner-default text-status-rose-text",
  sky: "from-status-cyan-background to-background-inner-default text-status-cyan-text",
  emerald:
    "from-status-lime-background to-background-inner-default text-status-lime-text",
}

const DELTA_STYLES: Record<
  NonNullable<Stat["deltaColor"]>,
  { icon: IconComponent; className: string; pill: string }
> = {
  lime: {
    icon: ArrowUpCircle,
    className: "text-status-lime-text",
    pill: "bg-status-lime-background",
  },
  rose: {
    icon: ArrowDownCircle,
    className: "text-status-rose-text",
    pill: "bg-status-rose-background",
  },
  neutral: {
    icon: MinusCircle,
    className: "text-text-secondary",
    pill: "bg-background-secondary-default",
  },
}

/** Tinted pill with a direction glyph — the footer band's delta readout, in
 *  the same lime and rose the chart cards use for their trend chips. */
function DeltaPill({
  delta,
  deltaColor = "neutral",
}: Pick<Stat, "delta" | "deltaColor">) {
  const { icon: Icon, className, pill } = DELTA_STYLES[deltaColor]
  return (
    <span
      className={cx(
        "flex shrink-0 items-center gap-1 rounded-full py-0.5 ps-1 pe-2",
        pill
      )}
    >
      <Icon className={cx("size-4 shrink-0", className)} aria-hidden />
      <span
        className={cx(
          "text-body-medium whitespace-nowrap tabular-nums",
          className
        )}
      >
        {delta}
      </span>
    </span>
  )
}

/** A small explanatory popover that works with a pointer, keyboard or touch. */
function StatHint({ label, hint }: { label: string; hint: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`About ${label}`}
          className="rounded-full text-foreground-icon-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          <Info className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="max-w-xs rounded-xl p-3 text-body-regular"
      >
        {hint}
      </PopoverContent>
    </Popover>
  )
}

function PlainStatCard({ stat }: { stat: Stat }) {
  return (
    <section className="flex min-h-[132px] min-w-0 flex-col items-start justify-between gap-4 rounded-2xl border border-stat-card-border bg-stat-card-background p-4">
      <div className="flex w-full items-start justify-between gap-2">
        <span className="flex items-center rounded-md bg-stat-card-icon-background p-1.5">
          <stat.icon
            className="size-5 shrink-0 text-foreground-icon-primary"
            aria-hidden
          />
        </span>
        {stat.hint && <StatHint label={stat.label} hint={stat.hint} />}
      </div>
      <div className="flex w-full flex-col gap-0.5">
        <p className="w-full text-body-medium text-stat-card-label">
          {stat.label}
        </p>
        <div className="flex w-full flex-wrap items-center gap-2">
          <div className="text-title-1-medium [overflow-wrap:anywhere] break-words text-text-primary tabular-nums">
            {stat.value}
          </div>
          {stat.delta && (
            <Chip variant="bold" color={stat.deltaColor ?? "neutral"}>
              {stat.delta}
            </Chip>
          )}
        </div>
      </div>
    </section>
  )
}

function FooterStatCard({ stat }: { stat: Stat }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-stat-card-border bg-stat-card-background p-2">
      {/* Icon tile + optional info glyph, both hanging from the same top inset */}
      <div className="flex w-full items-start justify-between gap-2.5 p-2">
        <span
          className={cx(
            "flex size-10 shrink-0 items-center justify-center rounded-2lg bg-linear-to-b",
            TILE_TONES[stat.tone ?? "blue"]
          )}
        >
          <stat.icon className="size-5 shrink-0" aria-hidden />
        </span>
        {stat.hint && <StatHint label={stat.label} hint={stat.hint} />}
      </div>

      {/* Label sits directly over the number, as on the plain cards */}
      <div className="flex flex-col gap-0.5 px-2 pt-2.5 pb-3.5">
        <p className="text-body-medium text-stat-card-label">{stat.label}</p>
        <div className="text-display-4-medium [overflow-wrap:anywhere] break-words text-text-primary tabular-nums">
          {stat.value}
        </div>
      </div>

      {(stat.caption || stat.delta) && (
        <div className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 rounded-2lg border border-stat-card-border bg-background-inner-default py-1.5 ps-2.5 pe-1.5 shadow-card">
          {stat.caption && (
            <p className="min-w-0 flex-1 text-body-regular text-text-secondary">
              {stat.caption}
            </p>
          )}
          {stat.delta && (
            <DeltaPill delta={stat.delta} deltaColor={stat.deltaColor} />
          )}
        </div>
      )}
    </section>
  )
}

export function StatCards({
  variant = "plain",
  stats,
  count,
  columns = 4,
  className,
}: {
  variant?: StatCardsVariant
  /** Real application metrics; comparisons are optional. */
  stats: Stat[]
  /** How many KPI cards to render (from the start of the list). */
  count?: number
  /** Columns at the widest breakpoint - 2 keeps the grid two-up for
   *  narrower hosts (docs previews, split layouts), 1 pins a single
   *  column at every width. */
  columns?: 1 | 2 | 3 | 4
  className?: string
}) {
  const items = stats
  return (
    <div
      className={cx(
        "grid w-full gap-4",
        // The footer cards carry a display-size value, so they go one per
        // row on phones where the plain cards still fit two up.
        columns === 1
          ? "grid-cols-1"
          : variant === "footer"
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-2",
        columns === 4 &&
          (variant === "footer" ? "xl:grid-cols-4" : "lg:grid-cols-4"),
        columns === 3 && "lg:grid-cols-3",
        className
      )}
    >
      {items
        .slice(0, count ?? items.length)
        .map((stat) =>
          variant === "footer" ? (
            <FooterStatCard key={stat.label} stat={stat} />
          ) : (
            <PlainStatCard key={stat.label} stat={stat} />
          )
        )}
    </div>
  )
}
