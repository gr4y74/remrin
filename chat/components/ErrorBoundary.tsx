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
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                    <div className="relative max-w-md w-full rounded-2xl bg-rp-base/60 backdrop-blur-xl border border-rp-love/30 p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full bg-rp-love/20 flex items-center justify-center mb-6 ring-4 ring-rp-love/10">
                            <AlertCircle className="w-8 h-8 text-rp-love" />
                        </div>

                        <h2 className="text-2xl font-bold mb-3 text-rp-text">Something went wrong</h2>

                        <div className="bg-rp-base/40 rounded-lg p-4 mb-8 border border-white/5">
                            <p className="text-rp-muted text-sm font-mono break-words leading-relaxed">
                                {this.state.error?.message || "An unexpected error occurred in the ethereal plane."}
                            </p>
                        </div>

                        <Button
                            onClick={this.handleRetry}
                            variant="default"
                            className="w-full py-6 bg-rp-iris hover:bg-rp-iris/80 text-black font-bold text-lg rounded-xl shadow-lg shadow-rp-iris/20 group overflow-hidden relative"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                Reload Ritual
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000" />
                        </Button>

                        <p className="mt-6 text-xs text-rp-muted/50">
                            If this persists, the souls may be misaligned. Try clearing cache or checking your connection.
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
