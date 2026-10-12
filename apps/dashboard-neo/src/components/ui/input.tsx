import { Input as InputPrimitive } from "@base-ui/react/input"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <InputPrimitive
      {...props}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-2lg border border-border-button-default bg-background-primary-default px-3 py-2 text-body-regular text-text-primary shadow-xs outline-none placeholder:text-text-tertiary hover:border-border-button-hover focus-visible:border-border-focus-ring focus-visible:ring-3 focus-visible:ring-border-focus-ring/20 disabled:cursor-not-allowed disabled:bg-background-primary-disabled disabled:text-text-tertiary aria-invalid:border-status-rose-text",
        className
      )}
    />
  )
}
