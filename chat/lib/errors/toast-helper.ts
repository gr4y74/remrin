import { toast } from "sonner"

export const showErrorToast = (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    toast.error(message, {
        description: options?.description,
        action: options?.action,
        duration: 5000,
    })
}

export const showSuccessToast = (message: string, description?: string) => {
    toast.success(message, {
        description,
    })
}

export const formatErrorMessage = (error: unknown, fallback = "An unexpected error occurred") => {
    if (typeof error === "string") return error
    if (error instanceof Error) return error.message
    return fallback
}

export const handleResourceError = (resourceName: string, error: unknown) => {
    const message = formatErrorMessage(error)
    showErrorToast(`Failed to load ${resourceName}`, {
        description: message === "An unexpected error occurred" ? "Please try again later." : message
    })
}
