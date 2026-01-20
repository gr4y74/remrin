import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClear?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onClear, showClear, ...props }, ref) => {
    const hasValue = props.value !== undefined && props.value !== "";

    return (
      <div className="relative w-full group">
        <input
          type={type}
          className={cn(
            "flex h-11 md:h-10 w-full rounded-md border border-rp-muted/20 bg-rp-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-rp-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            "min-h-[48px] md:min-h-[40px]",
            className
          )}
          ref={ref}
          {...props}
        />
        {showClear && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-rp-subtle hover:text-rp-text focus:outline-none p-1 rounded-full hover:bg-rp-muted/10 transition-colors"
            aria-label="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
