import { useEffect, useState } from 'react'
import { MoreVertical, Search, Lock, Unlock, Star, Trash2 } from 'lucide-react'

export default function RoomManagement() {
    const [rooms, setRooms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const fetchRooms = () => {
        setLoading(true)
        fetch(`/api/admin/chat/rooms?page=${page}`)
            .then(res => res.json())
            .then(data => {
                setRooms(data.rooms || [])
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchRooms()
    }, [page])

    const handleAction = async (roomId: string, action: string) => {
        if (!confirm(`Are you sure you want to ${action} this room?`)) return

        let url = `/api/admin/chat/rooms/${roomId}`
        let method = 'POST'

        if (action === 'delete') {
            method = 'DELETE'
        } else if (action === 'feature') {
            url += '/feature'
        } else if (action === 'close') {
            url += '/close'
        }

        await fetch(url, { method })
        fetchRooms()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Rooms Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search rooms..."
                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Members</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                        ) : rooms.map((room) => (
                            <tr key={room.id} className="hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-white">{room.name}</div>
                                    <div className="text-xs text-gray-500">{room.topic}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">{room.category}</td>
                                <td className="px-6 py-4 text-gray-300">{room.member_count}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        {room.is_featured && <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs">Featured</span>}
                                        {room.is_closed && <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs">Closed</span>}
                                        {!room.is_public && <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-xs">Private</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                    {new Date(room.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction(room.id, 'feature')} className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-yellow-400" title="Feature">
                                            <Star className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleAction(room.id, 'close')} className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-red-400" title="Close">
                                            <Lock className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleAction(room.id, 'delete')} className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-red-600" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300"
                >
                    Next
                </button>
            </div>
        </div>
    )
}
