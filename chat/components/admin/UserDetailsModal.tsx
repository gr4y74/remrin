"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import {
    IconX,
    IconUser,
    IconMail,
    IconCoin,
    IconBrain,
    IconLoader2,
    IconTrash,
    IconPlus,
    IconMinus,
    IconCalendar,
    IconClock,
    IconPalette
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"

interface UserDetailsModalProps {
    userId: string
    onClose: () => void
    onUpdate: () => void
    onDelete: () => void
}

interface UserDetails {
    id: string
    email: string
    username: string
    display_name: string
    avatar_url: string
    bio: string
    pronouns: string
    location: string
    website_url: string
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
    balance_aether: number
    balance_brain: number
    total_earned: number
    total_spent: number
    tier: string
    status: string
    is_admin: boolean
    persona_count: number
}

export function UserDetailsModal({ userId, onClose, onUpdate, onDelete }: UserDetailsModalProps) {
    const [user, setUser] = useState<UserDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [showCreditModal, setShowCreditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")

    // Editable fields
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [status, setStatus] = useState("")
    const [tier, setTier] = useState("")

    const supabase = createClient()

    useEffect(() => {
        fetchUserDetails()
    }, [userId])

    const fetchUserDetails = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) throw new Error("Failed to fetch user")

            const data = await response.json()
            setUser(data)
            setUsername(data.username)
            setDisplayName(data.display_name)
            setBio(data.bio)
            setStatus(data.status)
            setTier(data.tier)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError("")

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    username,
                    display_name: displayName,
                    bio,
                    status,
                    tier
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update user")
            }

            onUpdate()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (deleteConfirmText !== user?.username) {
            setError("Username doesn't match")
            return
        }

        setSaving(true)
        setError("")

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to delete user")
            }

            onDelete()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-2xl rounded-xl bg-rp-surface p-6">
                    <div className="flex items-center justify-center py-12">
                        <IconLoader2 size={32} className="animate-spin text-rp-iris" />
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                <div className="w-full max-w-2xl rounded-xl bg-rp-surface p-6 my-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-rp-text">User Details</h2>
                        <button
                            onClick={onClose}
                            className="text-rp-muted transition-colors hover:text-rp-text"
                        >
                            <IconX size={20} />
                        </button>
                    </div>

                    {/* Avatar & Basic Info */}
                    <div className="mb-6 flex items-center gap-4 rounded-lg bg-rp-overlay p-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-rp-base">
                            {user.avatar_url ? (
                                <Image
                                    src={user.avatar_url}
                                    alt={user.username}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <IconUser size={32} className="text-rp-muted" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-semibold text-rp-text">@{user.username}</div>
                            <div className="flex items-center gap-2 text-sm text-rp-subtle">
                                <IconMail size={14} />
                                {user.email}
                            </div>
                            <div className="mt-2 flex gap-2">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                    user.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                    {user.status.toUpperCase()}
                                </span>
                                <span className="inline-flex rounded-full bg-rp-iris/20 px-2 py-0.5 text-xs font-medium text-rp-iris">
                                    {user.tier.toUpperCase()}
                                </span>
                                {user.is_admin && (
                                    <span className="inline-flex rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                                        ADMIN
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-rp-overlay p-3">
                            <div className="flex items-center gap-2 text-sm text-rp-subtle">
                                <IconCoin size={16} className="text-rp-gold" />
                                Aether
                            </div>
                            <div className="mt-1 font-mono text-lg font-bold text-rp-gold">
                                {user.balance_aether.toLocaleString()}
                            </div>
                        </div>
                        <div className="rounded-lg bg-rp-overlay p-3">
                            <div className="flex items-center gap-2 text-sm text-rp-subtle">
                                <IconBrain size={16} className="text-rp-iris" />
                                Brain
                            </div>
                            <div className="mt-1 font-mono text-lg font-bold text-rp-iris">
                                {user.balance_brain.toLocaleString()}
                            </div>
                        </div>
                        <div className="rounded-lg bg-rp-overlay p-3">
                            <div className="flex items-center gap-2 text-sm text-rp-subtle">
                                <IconPalette size={16} />
                                Personas
                            </div>
                            <div className="mt-1 text-lg font-bold text-rp-text">
                                {user.persona_count}
                            </div>
                        </div>
                        <div className="rounded-lg bg-rp-overlay p-3">
                            <div className="flex items-center gap-2 text-sm text-rp-subtle">
                                <IconCalendar size={16} />
                                Joined
                            </div>
                            <div className="mt-1 text-sm text-rp-text">
                                {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="banned">Banned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                        </div>

                        {/* Wallet Management */}
                        <div className="rounded-lg bg-rp-overlay p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-medium text-rp-text">Wallet Management</h3>
                                <Button
                                    size="sm"
                                    onClick={() => setShowCreditModal(true)}
                                >
                                    <IconPlus size={16} className="mr-1" />
                                    Add Credits
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-rp-subtle">Total Earned:</span>
                                    <span className="ml-2 font-mono text-rp-text">{user.total_earned.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-rp-subtle">Total Spent:</span>
                                    <span className="ml-2 font-mono text-rp-text">{user.total_spent.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <IconLoader2 size={18} className="mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                            <h3 className="mb-2 font-medium text-red-400">Danger Zone</h3>
                            <p className="mb-3 text-sm text-rp-subtle">
                                Permanently delete this user and all associated data. This action cannot be undone.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                            >
                                <IconTrash size={16} className="mr-2" />
                                Delete User
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credit Modal */}
            {showCreditModal && (
                <CreditModal
                    userId={userId}
                    currentAether={user.balance_aether}
                    currentBrain={user.balance_brain}
                    onClose={() => setShowCreditModal(false)}
                    onSuccess={() => {
                        setShowCreditModal(false)
                        fetchUserDetails()
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-xl bg-rp-surface p-6">
                        <h3 className="mb-4 text-lg font-semibold text-red-400">Delete User?</h3>
                        <p className="mb-4 text-sm text-rp-subtle">
                            This will permanently delete <strong className="text-rp-text">{user.username}</strong> and all associated data including:
                        </p>
                        <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-rp-subtle">
                            <li>User profile and settings</li>
                            <li>All created personas ({user.persona_count})</li>
                            <li>Chat history</li>
                            <li>Wallet and transactions</li>
                        </ul>
                        <div className="mb-4 space-y-2">
                            <Label>Type username to confirm:</Label>
                            <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={user.username}
                            />
                        </div>
                        {error && (
                            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setDeleteConfirmText("")
                                    setError("")
                                }}
                                className="flex-1"
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-500"
                                disabled={saving || deleteConfirmText !== user.username}
                            >
                                {saving ? (
                                    <>
                                        <IconLoader2 size={18} className="mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <IconTrash size={16} className="mr-2" />
                                        Delete Permanently
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// Credit Modal Component
interface CreditModalProps {
    userId: string
    currentAether: number
    currentBrain: number
    onClose: () => void
    onSuccess: () => void
}

function CreditModal({ userId, currentAether, currentBrain, onClose, onSuccess }: CreditModalProps) {
    const [type, setType] = useState<"aether" | "brain">("aether")
    const [amount, setAmount] = useState("")
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const supabase = createClient()

    const currentBalance = type === "aether" ? currentAether : currentBrain
    const newBalance = currentBalance + (parseInt(amount) || 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            if (!reason.trim()) {
                setError("Reason is required for audit trail")
                setLoading(false)
                return
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const response = await fetch(`/api/admin/users/${userId}/credits`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    type,
                    amount: parseInt(amount) || 0,
                    reason
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to update credits")
            }

            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl bg-rp-surface p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-rp-text">Manage Credits</h3>
                    <button onClick={onClose} className="text-rp-muted hover:text-rp-text">
                        <IconX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Credit Type</Label>
                        <Select value={type} onValueChange={(v: "aether" | "brain") => setType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="aether">
                                    <div className="flex items-center gap-2">
                                        <IconCoin size={16} className="text-rp-gold" />
                                        Aether Credits
                                    </div>
                                </SelectItem>
                                <SelectItem value="brain">
                                    <div className="flex items-center gap-2">
                                        <IconBrain size={16} className="text-rp-iris" />
                                        Brain Credits
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Amount (use negative to subtract)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 1000 or -500"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Reason (for audit trail)</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Contest reward, Gift, Adjustment"
                            required
                        />
                    </div>

                    <div className="rounded-lg bg-rp-overlay p-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-rp-subtle">Current Balance:</span>
                            <span className="font-mono text-rp-text">{currentBalance.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 flex justify-between">
                            <span className="text-rp-subtle">New Balance:</span>
                            <span className={`font-mono font-bold ${newBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {newBalance.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? (
                                <>
                                    <IconLoader2 size={18} className="mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Credits"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
