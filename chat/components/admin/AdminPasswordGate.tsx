"use client"

import { useState, useEffect, ReactNode } from "react"
import { IconLock, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

interface AdminPasswordGateProps {
    children: ReactNode
}

const ADMIN_SESSION_KEY = "remrin_admin_session"

export function AdminPasswordGate({ children }: AdminPasswordGateProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)

    // Check if already authenticated on mount
    useEffect(() => {
        const session = sessionStorage.getItem(ADMIN_SESSION_KEY)
        if (session === "authenticated") {
            setIsAuthenticated(true)
        }
        setChecking(false)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            })

            const data = await response.json()

            if (response.ok) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, "authenticated")
                setIsAuthenticated(true)
            } else {
                setError(data.error || "Authentication failed")
            }
        } catch (err) {
            setError("Network error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Show loading while checking session
    if (checking) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Show password prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Back link */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
                    >
                        <IconArrowLeft size={18} />
                        Back to Home
                    </Link>

                    {/* Password form */}
                    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-purple-500/10 border border-purple-500/20">
                            <IconLock size={32} className="text-purple-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-white text-center mb-2">
                            Admin Access
                        </h1>
                        <p className="text-zinc-400 text-center text-sm mb-8">
                            Enter the admin password to continue
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Verifying..." : "Access Admin Panel"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // Show children if authenticated
    return <>{children}</>
}
