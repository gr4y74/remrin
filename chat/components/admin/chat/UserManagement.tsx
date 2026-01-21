import { useEffect, useState } from 'react'
import { Search, Ban, MicOff, CheckCircle } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const fetchUsers = () => {
        setLoading(true)
        fetch(`/api/admin/chat/users?search=${search}`)
            .then(res => res.json())
            .then(data => {
                setUsers(data.users || [])
                setLoading(false)
            })
    }

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 500)
        return () => clearTimeout(timeout)
    }, [search])

    const handleAction = async (userId: string, action: string) => {
        const method = 'POST'
        let url = `/api/admin/chat/users/${userId}/${action}` // ban, unban, mute

        await fetch(url, { method })
        fetchUsers()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Users Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <div key={user.user_id} className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold">{user.username}</h3>
                            <p className="text-gray-400 text-sm">{user.display_name}</p>
                            <div className="mt-2 flex gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${user.status === 'online' ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'}`}>
                                    {user.status}
                                </span>
                                {user.is_banned && <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">BANNED</span>}
                                {user.is_muted && <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">MUTED</span>}
                            </div>
                            <div className="mt-4 flex gap-2">
                                {user.is_banned ? (
                                    <button onClick={() => handleAction(user.user_id, 'unban')} className="px-3 py-1 bg-green-900/40 text-green-400 rounded text-xs hover:bg-green-900/60">
                                        Unban
                                    </button>
                                ) : (
                                    <button onClick={() => handleAction(user.user_id, 'ban')} className="px-3 py-1 bg-red-900/40 text-red-400 rounded text-xs hover:bg-red-900/60">
                                        Ban
                                    </button>
                                )}
                                <button onClick={() => handleAction(user.user_id, 'mute')} className="px-3 py-1 bg-yellow-900/40 text-yellow-400 rounded text-xs hover:bg-yellow-900/60">
                                    Mute
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
