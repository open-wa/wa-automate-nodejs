import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-clip-padding text-sm font-medium transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3",
        xs: "h-6 px-2.5 text-xs",
        sm: "h-8 px-3",
        lg: "h-10 px-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<ButtonPrimitive.Props, "className" | "render">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  className?: ButtonPrimitive.Props["className"]
  render?: ButtonPrimitive.Props["render"]
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, render: customRender, ...props }, ref) => {
    const render = customRender ?? (asChild && React.isValidElement(children) ? children : undefined)
    return (
      <ButtonPrimitive
        ref={ref}
        render={render}
        className={(state) => cn(buttonVariants({ variant, size }), typeof className === "function" ? className(state) : className)}
        {...props}
      >
        {asChild ? undefined : children}
      </ButtonPrimitive>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
