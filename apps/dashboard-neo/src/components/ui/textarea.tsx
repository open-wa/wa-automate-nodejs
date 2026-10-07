import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-2lg border border-border-button-default bg-background-primary-default px-3 py-2 text-body-regular text-text-primary shadow-xs outline-none placeholder:text-text-tertiary hover:border-border-button-hover focus-visible:border-border-focus-ring focus-visible:ring-3 focus-visible:ring-border-focus-ring/20 disabled:cursor-not-allowed disabled:bg-background-primary-disabled",
        className
      )}
    />
  )
}
