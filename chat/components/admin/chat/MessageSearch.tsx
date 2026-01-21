import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'

export default function MessageSearch() {
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        fetch(`/api/admin/chat/messages?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                setMessages(data.messages || [])
                setLoading(false)
            })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this message?')) return
        await fetch(`/api/admin/chat/messages/${id}`, { method: 'DELETE' })
        setMessages(messages.filter(m => m.id !== id))
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Message Search</h2>

            <form onSubmit={handleSearch} className="flex gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search message content..."
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Search className="w-4 h-4" /> Search
                </button>
            </form>

            <div className="space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex justify-between items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-white">{msg.user?.username || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">in {msg.room?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500">• {new Date(msg.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-300">{msg.message}</p>
                        </div>
                        <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-2 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                {messages.length === 0 && !loading && query && (
                    <div className="text-center text-gray-500 py-8">No messages found</div>
                )}
            </div>
        </div>
    )
}
