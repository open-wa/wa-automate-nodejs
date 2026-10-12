import { forwardRef } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { buttonStyles } from "@/components/boardui/button"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  `${buttonStyles.base} gap-2 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    variants: {
      variant: {
        default: buttonStyles.variant.primary,
        primary: buttonStyles.variant.primary,
        destructive: buttonStyles.variant.danger,
        outline: buttonStyles.variant.secondary,
        secondary: buttonStyles.variant.secondary,
        ghost: buttonStyles.variant.ghost,
        link: `${buttonStyles.variant.ghost} text-primary underline-offset-4 hover:underline`,
      },
      size: {
        default: `${buttonStyles.size.medium} px-3`,
        sm: `${buttonStyles.size.small} px-3`,
        xs: buttonStyles.size.xs,
        lg: "h-11 rounded-2lg px-4 text-body-medium",
        icon: "size-9 rounded-2lg p-0",
        "icon-sm": buttonStyles.iconOnlySize.small,
        "icon-xs": buttonStyles.iconOnlySize.xs,
        "icon-lg": "size-11 rounded-2lg p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLElement, ButtonProps>(
  ({ variant, size, className, ...props }, ref) => (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      {...props}
      className={(state) =>
        cn(
          buttonVariants({ variant, size }),
          typeof className === "function" ? className(state) : className
        )
      }
    />
  )
)
Button.displayName = "Button"
export { Button, buttonVariants }
