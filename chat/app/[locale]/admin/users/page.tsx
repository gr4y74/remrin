"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    IconSearch,
    IconPlus,
    IconRefresh,
    IconFilter,
    IconUsers
} from "@tabler/icons-react"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"
import { UserTable } from "@/components/admin/UserTable"
import { CreateUserModal } from "@/components/admin/CreateUserModal"
import { UserDetailsModal } from "@/components/admin/UserDetailsModal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

interface User {
    id: string
    email: string
    username: string
    display_name: string
    avatar_url: string
    created_at: string
    last_sign_in_at: string | null
    balance_aether: number
    balance_brain: number
    tier: string
    status: string
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [tierFilter, setTierFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        suspended: 0,
        banned: 0
    })
    const [limit] = useState(50)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)

    const supabase = createClient()

    const fetchUsers = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const adminPassword = sessionStorage.getItem("admin_password")

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                ...(statusFilter !== "all" && { status: statusFilter }),
                ...(tierFilter !== "all" && { tier: tierFilter })
            })

            const headers: Record<string, string> = {}
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`
            }
            if (adminPassword) {
                headers['x-admin-password'] = adminPassword
            }

            const response = await fetch(`/api/admin/users?${params}`, {
                headers
            })

            const data = await response.json()

            if (response.ok) {
                setUsers(data.users || [])
                setTotal(data.total || 0)
                if (data.stats) {
                    setStats(data.stats)
                }
            } else {
                console.error("Failed to fetch users:", data.error)
                setError(data.error || "Failed to load users")
                setUsers([])
            }
        } catch (err) {
            console.error("Error loading users:", err)
            setError("A network error occurred while loading users")
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [page, search, statusFilter, tierFilter])

    const handleUserCreated = () => {
        setShowCreateModal(false)
        fetchUsers()
    }

    const handleUserUpdated = () => {
        setSelectedUser(null)
        fetchUsers()
    }

    const handleUserDeleted = () => {
        setSelectedUser(null)
        fetchUsers()
    }

    const totalPages = Math.ceil(total / limit)

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
                {/* Header */}
                <header className="border-b border-rp-highlight-med px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                        >
                            <IconArrowLeft size={20} />
                            Back to Admin
                        </Link>
                        <div className="h-6 w-px bg-rp-highlight-med" />
                        <div className="flex items-center gap-2">
                            <IconUsers size={24} className="text-rp-iris" />
                            <h1 className="text-xl font-semibold">User Management</h1>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-7xl p-6">
                    {/* Controls */}
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 gap-3">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <IconSearch
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted"
                                />
                                <Input
                                    placeholder="Search by username or email..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        setPage(1)
                                    }}
                                    className="pl-10"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="banned">Banned</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Tier Filter */}
                            <Select value={tierFilter} onValueChange={setTierFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tiers</SelectItem>
                                    <SelectItem value="wanderer">Wanderer</SelectItem>
                                    <SelectItem value="soul_weaver">Soul Weaver</SelectItem>
                                    <SelectItem value="architect">Architect</SelectItem>
                                    <SelectItem value="titan">Titan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={fetchUsers}
                                disabled={loading}
                            >
                                <IconRefresh size={18} className={loading ? "animate-spin" : ""} />
                            </Button>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <IconPlus size={18} className="mr-2" />
                                Create User
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-rp-surface p-4">
                            <div className="text-sm text-rp-subtle">Total Users</div>
                            <div className="text-2xl font-bold text-rp-text">{stats.total}</div>
                        </div>
                        <div className="rounded-lg bg-rp-surface p-4">
                            <div className="text-sm text-rp-subtle">Active</div>
                            <div className="text-2xl font-bold text-green-400">
                                {stats.active}
                            </div>
                        </div>
                        <div className="rounded-lg bg-rp-surface p-4">
                            <div className="text-sm text-rp-subtle">Suspended</div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {stats.suspended}
                            </div>
                        </div>
                        <div className="rounded-lg bg-rp-surface p-4">
                            <div className="text-sm text-rp-subtle">Banned</div>
                            <div className="text-2xl font-bold text-red-400">
                                {stats.banned}
                            </div>
                        </div>
                    </div>

                    {/* User Table */}
                    <UserTable
                        users={users}
                        loading={loading}
                        onViewUser={(userId) => setSelectedUser(userId)}
                        onRefresh={fetchUsers}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-rp-subtle">
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-2 px-4">
                                    <span className="text-sm text-rp-text">
                                        Page {page} of {totalPages}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </main>

                {/* Modals */}
                {showCreateModal && (
                    <CreateUserModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={handleUserCreated}
                    />
                )}

                {selectedUser && (
                    <UserDetailsModal
                        userId={selectedUser}
                        onClose={() => setSelectedUser(null)}
                        onUpdate={handleUserUpdated}
                        onDelete={handleUserDeleted}
                    />
                )}
            </div>
        </AdminPasswordGate>
    )
}
