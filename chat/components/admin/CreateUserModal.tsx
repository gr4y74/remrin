"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    IconX,
    IconUser,
    IconMail,
    IconLock,
    IconCoin,
    IconLoader2
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface CreateUserModalProps {
    onClose: () => void
    onSuccess: () => void
}

export function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [tier, setTier] = useState("free")
    const [initialAether, setInitialAether] = useState("100")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            // Validate inputs
            if (!email || !password || !username) {
                setError("Email, password, and username are required")
                setLoading(false)
                return
            }

            if (password.length < 8) {
                setError("Password must be at least 8 characters")
                setLoading(false)
                return
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError("Not authenticated")
                setLoading(false)
                return
            }

            const response = await fetch("/api/admin/users/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    email,
                    password,
                    username,
                    display_name: displayName || username,
                    tier,
                    initial_aether: parseInt(initialAether) || 100
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create user")
            }

            onSuccess()
        } catch (err: any) {
            console.error("Error creating user:", err)
            setError(err.message || "Failed to create user")
        } finally {
            setLoading(false)
        }
    }

    const getPasswordStrength = () => {
        if (password.length === 0) return { label: "", color: "" }
        if (password.length < 8) return { label: "Too short", color: "text-red-400" }
        if (password.length < 12) return { label: "Weak", color: "text-yellow-400" }
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return { label: "Medium", color: "text-blue-400" }
        }
        return { label: "Strong", color: "text-green-400" }
    }

    const passwordStrength = getPasswordStrength()

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-rp-surface p-6 shadow-xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-rp-text">Create New User</h2>
                    <button
                        onClick={onClose}
                        className="text-rp-muted transition-colors hover:text-rp-text"
                    >
                        <IconX size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <IconMail size={16} />
                            Email *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                            <IconLock size={16} />
                            Password *
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            required
                        />
                        {password && (
                            <div className={`text-xs ${passwordStrength.color}`}>
                                Strength: {passwordStrength.label}
                            </div>
                        )}
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="flex items-center gap-2">
                            <IconUser size={16} />
                            Username *
                        </Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="username"
                            required
                        />
                        <div className="text-xs text-rp-muted">
                            Lowercase letters, numbers, and underscores only
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Optional display name"
                        />
                    </div>

                    {/* Tier */}
                    <div className="space-y-2">
                        <Label htmlFor="tier">Tier</Label>
                        <Select value={tier} onValueChange={setTier}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Initial Aether */}
                    <div className="space-y-2">
                        <Label htmlFor="aether" className="flex items-center gap-2">
                            <IconCoin size={16} className="text-rp-gold" />
                            Initial Aether Credits
                        </Label>
                        <Input
                            id="aether"
                            type="number"
                            value={initialAether}
                            onChange={(e) => setInitialAether(e.target.value)}
                            min="0"
                            step="10"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <IconLoader2 size={18} className="mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create User"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
