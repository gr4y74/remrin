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
                // Store password for API calls that need it
                sessionStorage.setItem("admin_password", password)
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
            <div className="bg-rp-base flex min-h-screen items-center justify-center">
                <div className="border-rp-iris size-8 animate-spin rounded-full border-4 border-t-transparent" />
            </div>
        )
    }

    // Show password prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="bg-rp-base flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Back link */}
                    <Link
                        href="/"
                        className="text-rp-subtle hover:text-rp-text mb-8 flex items-center gap-2 transition-colors"
                    >
                        <IconArrowLeft size={18} />
                        Back to Home
                    </Link>

                    {/* Password form */}
                    <div className="bg-rp-surface border-rp-muted/20 rounded-2xl border p-8 shadow-2xl">
                        <div className="bg-rp-iris/10 border-rp-iris/20 mx-auto mb-6 flex size-16 items-center justify-center rounded-full border">
                            <IconLock size={32} className="text-rp-iris" />
                        </div>

                        <h1 className="text-rp-text mb-2 text-center text-2xl font-bold">
                            Admin Access
                        </h1>
                        <p className="text-rp-subtle mb-8 text-center text-sm">
                            Enter the admin password to continue
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="bg-rp-base border-rp-muted/20 text-rp-text placeholder:text-rp-muted focus:border-rp-iris w-full rounded-xl border px-4 py-3 transition-colors focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-rp-love text-center text-sm">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="from-rp-iris to-rp-rose text-rp-base shadow-rp-iris/20 w-full rounded-xl bg-gradient-to-r py-3 font-semibold shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
