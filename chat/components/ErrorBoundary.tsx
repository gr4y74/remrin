"use client"

import React from "react"
import { Button } from "./ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
        // Here you would log to your error monitoring service
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full mb-6">
                        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        {this.state.error?.message || "An unexpected error occurred. Please try again."}
                    </p>
                    <Button onClick={this.handleRetry} variant="default" className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
