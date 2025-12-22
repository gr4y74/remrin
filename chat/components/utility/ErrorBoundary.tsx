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
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                    <AlertTriangle className="size-10 text-red-400" />
                    <div>
                        <h3 className="mb-1 text-lg font-semibold text-red-300">
                            Something went wrong
                        </h3>
                        <p className="text-sm text-zinc-400">
                            {this.state.error?.message || "An unexpected error occurred"}
                        </p>
                    </div>
                    <Button
                        onClick={this.handleRetry}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-red-500/30 text-red-300 hover:bg-red-500/10"
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
