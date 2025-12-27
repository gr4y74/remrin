import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
  {
    variants: {
      variant: {
        default: "bg-rp-iris text-rp-base hover:bg-rp-iris/90 hover:scale-105 active:scale-95",
        destructive:
          "bg-rp-love text-rp-base hover:bg-rp-love/90 hover:scale-105 active:scale-95",
        outline:
          "border-rp-muted/20 bg-rp-surface hover:bg-rp-overlay hover:border-rp-iris/50 border hover:scale-105 active:scale-95",
        secondary:
          "bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 hover:scale-105 active:scale-95",
        ghost: "hover:bg-rp-overlay hover:text-rp-text hover:scale-105 active:scale-95",
        link: "text-rp-iris underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 min-h-[40px]",
        lg: "h-11 rounded-md px-8 min-h-[48px]",
        icon: "size-10 min-h-[44px] min-w-[44px]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
