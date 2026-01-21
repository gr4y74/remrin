import { useEffect, useState } from 'react'
import { AlertCircle, Check, X } from 'lucide-react'

export default function ReportsQueue() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchReports = () => {
        setLoading(true)
        fetch('/api/admin/chat/reports?status=pending')
            .then(res => res.json())
            .then(data => {
                setReports(data.reports || [])
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchReports()
    }, [])

    const handleResolve = async (id: string, status: string) => {
        await fetch(`/api/admin/chat/reports/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
        fetchReports()
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Reports Queue</h2>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-gray-400">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-green-400 flex items-center gap-2">
                        <Check className="w-5 h-5" /> All caught up! No pending reports.
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-gray-800/50 border border-red-500/30 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            <div className="flex justify-between items-start gap-6">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="text-red-500 w-5 h-5" />
                                        <h3 className="text-lg font-bold text-white capitalize">{report.reason}</h3>
                                        <span className="text-sm text-gray-500">• {new Date(report.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-gray-900/50 p-4 rounded-lg text-gray-300 text-sm">
                                        <p><span className="text-gray-500">Details: </span>{report.details || 'No details provided'}</p>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-400 mt-2">
                                        <span>Reported by: <span className="text-white">{report.reporter?.username || 'Unknown'}</span></span>
                                        <span>User: <span className="text-white">{report.reported?.username || 'Unknown'}</span></span>
                                        <span>Room: <span className="text-white">{report.room?.name || 'Unknown'}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleResolve(report.id, 'actioned')}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Take Action
                                    </button>
                                    <button
                                        onClick={() => handleResolve(report.id, 'dismissed')}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
