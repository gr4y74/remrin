"use client"

import { useState } from "react"
import Image from "next/image"
import {
    IconUser,
    IconEye,
    IconTrash,
    IconCoin,
    IconBrain,
    IconClock,
    IconMail
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

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

interface UserTableProps {
    users: User[]
    loading: boolean
    onViewUser: (userId: string) => void
    onRefresh: () => void
}

const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
        case 'premium':
            return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        case 'pro':
            return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
        default:
            return 'bg-rp-overlay text-rp-subtle'
    }
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'active':
            return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'suspended':
            return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        case 'banned':
            return 'bg-red-500/20 text-red-400 border-red-500/30'
        default:
            return 'bg-rp-overlay text-rp-subtle border-rp-highlight-med'
    }
}

export function UserTable({ users, loading, onViewUser, onRefresh }: UserTableProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center rounded-lg bg-rp-surface p-12">
                <div className="text-center">
                    <div className="mb-2 text-rp-muted">Loading users...</div>
                </div>
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="flex items-center justify-center rounded-lg bg-rp-surface p-12">
                <div className="text-center">
                    <IconUser size={48} className="mx-auto mb-4 text-rp-muted" />
                    <div className="mb-2 text-lg font-medium text-rp-text">No users found</div>
                    <div className="text-sm text-rp-subtle">Try adjusting your search or filters</div>
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-lg bg-rp-surface">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-rp-highlight-med bg-rp-overlay">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                User
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Wallet
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Tier
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Joined
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-rp-subtle">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rp-highlight-med">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="transition-colors hover:bg-rp-overlay/50"
                            >
                                {/* User */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-rp-overlay">
                                            {user.avatar_url ? (
                                                <Image
                                                    src={user.avatar_url}
                                                    alt={user.username}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <IconUser size={20} className="text-rp-muted" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-rp-text">
                                                {user.username}
                                            </div>
                                            {user.display_name && user.display_name !== user.username && (
                                                <div className="text-xs text-rp-subtle">
                                                    {user.display_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Email */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm text-rp-subtle">
                                        <IconMail size={14} />
                                        {user.email}
                                    </div>
                                </td>

                                {/* Wallet */}
                                <td className="px-4 py-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <IconCoin size={14} className="text-rp-gold" />
                                            <span className="font-mono text-rp-gold">
                                                {user.balance_aether.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <IconBrain size={14} className="text-rp-iris" />
                                            <span className="font-mono text-rp-iris">
                                                {user.balance_brain.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Tier */}
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTierColor(user.tier)}`}>
                                        {user.tier.toUpperCase()}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(user.status)}`}>
                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                    </span>
                                </td>

                                {/* Joined */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-sm text-rp-subtle">
                                        <IconClock size={14} />
                                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                    </div>
                                    {user.last_sign_in_at && (
                                        <div className="mt-1 text-xs text-rp-muted">
                                            Last: {formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })}
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onViewUser(user.id)}
                                        >
                                            <IconEye size={16} className="mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
