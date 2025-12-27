import { cn } from "@/lib/utils"
import { IconAlertCircle, IconX } from "@tabler/icons-react"

interface ErrorAlertProps {
    message: string
    onDismiss?: () => void
    className?: string
}

export function ErrorAlert({ message, onDismiss, className }: ErrorAlertProps) {
    return (
        <div
            className={cn(
                "bg-rp-love/20 text-rp-love flex items-start gap-2 rounded-lg p-3 text-sm",
                className
            )}
            role="alert"
            aria-live="polite"
        >
            <IconAlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">{message}</p>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="hover:text-rp-love/80 shrink-0 transition-colors"
                    aria-label="Dismiss error"
                >
                    <IconX className="size-4" />
                </button>
            )}
        </div>
    )
}

interface SuccessAlertProps {
    message: string
    onDismiss?: () => void
    className?: string
}

export function SuccessAlert({ message, onDismiss, className }: SuccessAlertProps) {
    return (
        <div
            className={cn(
                "bg-rp-foam/20 text-rp-foam flex items-start gap-2 rounded-lg p-3 text-sm",
                className
            )}
            role="alert"
            aria-live="polite"
        >
            <IconAlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1">{message}</p>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="hover:text-rp-foam/80 shrink-0 transition-colors"
                    aria-label="Dismiss message"
                >
                    <IconX className="size-4" />
                </button>
            )}
        </div>
    )
}

interface FormErrorProps {
    error?: string | null
    className?: string
}

export function FormError({ error, className }: FormErrorProps) {
    if (!error) return null

    return (
        <p
            className={cn("text-rp-love mt-1 text-sm", className)}
            role="alert"
            aria-live="polite"
        >
            {error}
        </p>
    )
}
