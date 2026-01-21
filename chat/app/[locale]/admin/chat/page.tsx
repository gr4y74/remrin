'use client'

import ChatDashboard from '@/components/admin/chat/ChatDashboard'

export default function AdminChatPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-8">Chat Administration</h1>
            <ChatDashboard />
        </div>
    )
}
