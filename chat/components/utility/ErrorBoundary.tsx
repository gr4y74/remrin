"use client"

import { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * ErrorBoundary - A reusable error boundary component
 * Catches JavaScript errors in child component tree and displays a fallback UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
        this.props.onError?.(error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="border-rp-love/20 bg-rp-love/5 flex flex-col items-center justify-center gap-4 rounded-xl border p-6 text-center">
                    <AlertTriangle className="text-rp-love size-10" />
                    <div>
                        <h3 className="text-rp-rose mb-1 text-lg font-semibold">
                            Something went wrong
                        </h3>
                        <p className="text-rp-subtle text-sm">
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                    </div>
                    <Button
                        onClick={this.handleRetry}
                        variant="outline"
                        size="sm"
                        className="border-rp-love/30 text-rp-rose hover:bg-rp-love/10 gap-2"
                    >
                        <RefreshCw className="size-4" />
                        Try Again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * Wrapper HOC for functional components
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        )
    }
}
