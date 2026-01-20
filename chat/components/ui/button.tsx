import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-rp-iris text-rp-base hover:bg-rp-iris/90 sm:hover:scale-105 active:scale-95",
        destructive:
          "bg-rp-love text-rp-base hover:bg-rp-love/90 sm:hover:scale-105 active:scale-95",
        outline:
          "border-rp-muted/20 bg-rp-surface sm:hover:bg-rp-overlay sm:hover:border-rp-iris/50 border sm:hover:scale-105 active:scale-95",
        secondary:
          "bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 sm:hover:scale-105 active:scale-95",
        ghost: "sm:hover:bg-rp-overlay sm:hover:text-rp-text sm:hover:scale-105 active:scale-95",
        link: "text-rp-iris underline-offset-4 hover:underline"
      },
      size: {
        default: "h-11 px-4 py-2 min-h-[44px]",
        sm: "h-10 rounded-md px-3 min-h-[40px] md:min-h-[36px]",
        lg: "h-12 rounded-md px-8 min-h-[48px]",
        icon: "size-11 min-h-[44px] min-w-[44px]"
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
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
