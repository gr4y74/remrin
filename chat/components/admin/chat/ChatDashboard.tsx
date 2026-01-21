import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card' // Assuming ui components exist
import { Users, MessageSquare, AlertTriangle, Hash } from 'lucide-react'

// Mock card if generic card doesn't exist, but usually it does in modern stacks
const DashboardCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl flex items-center justify-between backdrop-blur-sm">
        <div>
            <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-full bg-opacity-20 ${color}`}>
            <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
        </div>
    </div>
)

export default function ChatDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/admin/chat/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase-auth-token')}` } // pseudo-code for auth
        })
            .then(res => res.json())
            .then(data => {
                setStats(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="text-white">Loading stats...</div>
    if (!stats) return <div className="text-red-400">Failed to load stats</div>

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white mb-6">Chat Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Active Rooms"
                    value={stats.active_rooms}
                    icon={Hash}
                    color="bg-purple-500"
                />
                <DashboardCard
                    title="Online Users"
                    value={stats.online_users}
                    icon={Users}
                    color="bg-green-500"
                />
                <DashboardCard
                    title="Messages Today"
                    value={stats.messages_today}
                    icon={MessageSquare}
                    color="bg-blue-500"
                />
                <DashboardCard
                    title="Pending Reports"
                    value={stats.recent_reports?.length || 0}
                    icon={AlertTriangle}
                    color="bg-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Top Active Rooms</h3>
                    <div className="space-y-4">
                        {stats.top_rooms?.map((room: any) => (
                            <div key={room.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                                <span className="text-white font-medium">{room.name}</span>
                                <span className="text-gray-400 text-sm">{room.member_count} members</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Reports</h3>
                    <div className="space-y-4">
                        {stats.recent_reports?.map((report: any) => (
                            <div key={report.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg border-l-4 border-red-500">
                                <div>
                                    <p className="text-white font-medium text-sm">{report.reason}</p>
                                    <p className="text-gray-500 text-xs">{new Date(report.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded uppercase">
                                    {report.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
