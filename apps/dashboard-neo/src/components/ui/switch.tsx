import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      {...props}
      className={(state) =>
        cn(
          "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border-button-default bg-background-tertiary-default p-0.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-border-focus-ring/20 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-accent-600 data-checked:bg-accent-600",
          typeof className === "function" ? className(state) : className
        )
      }
    >
      <SwitchPrimitive.Thumb className="size-4.5 rounded-full bg-white shadow-xs transition-transform data-checked:translate-x-5 motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
}
