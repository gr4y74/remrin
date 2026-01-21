"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BanRecord {
    id: string;
    user_id: string;
    reason: string;
    created_at: string;
    // TODO: Expand with username if possible
}

export function RoomSettingsPanel({ roomId, onClose }: { roomId: string, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'general' | 'bans' | 'moderators'>('general');
    const [room, setRoom] = useState<any>(null);
    const [bans, setBans] = useState<BanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const [formData, setFormData] = useState({ description: '', rules: '', is_private: false });

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // 1. Room Details
            const res = await fetch(`/api/chat/rooms/${roomId}`);
            if (res.ok) {
                const data = await res.json();
                setRoom(data);
                setFormData({
                    description: data.description || '',
                    rules: data.rules || '',
                    is_private: data.is_private
                });
            }

            // 2. Bans
            const bansRes = await fetch(`/api/chat/rooms/${roomId}/moderation/bans`);
            if (bansRes.ok) {
                setBans(await bansRes.json());
            }

            setLoading(false);
        };
        fetchData();
    }, [roomId]);

    const handleUpdate = async () => {
        const res = await fetch(`/api/chat/rooms/${roomId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            alert('Room updated!');
        } else {
            alert('Failed to update.');
        }
    };

    const handleUnban = async (userId: string) => {
        const res = await fetch(`/api/chat/rooms/${roomId}/moderation/unban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });
        if (res.ok) {
            setBans(bans.filter(b => b.user_id !== userId));
        }
    };

    if (loading) return <div className="p-4">Loading settings...</div>;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[70]">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="w-[500px] h-[400px] bg-[#ECE9D8] border border-[#0055EA] rounded shadow-xl relative z-10 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0058EE] to-[#3B92F8] px-2 py-1 flex justify-between items-center text-white rounded-t-sm shrink-0">
                    <span className="font-bold text-sm">Room Settings: {room?.name}</span>
                    <button onClick={onClose} className="bg-[#D5473B] hover:bg-[#E85B4F] w-4 h-4 flex items-center justify-center rounded text-[10px] border border-white/30">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#ECE9D8] border-b border-[#ACA899] px-2 pt-2 gap-1 uppercase text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-3 py-1 rounded-t border-t border-l border-r border-[#ACA899] ${activeTab === 'general' ? 'bg-white border-b-white -mb-px' : 'bg-[#E0DFD8] text-gray-500'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('bans')}
                        className={`px-3 py-1 rounded-t border-t border-l border-r border-[#ACA899] ${activeTab === 'bans' ? 'bg-white border-b-white -mb-px' : 'bg-[#E0DFD8] text-gray-500'}`}
                    >
                        Banned Users
                    </button>
                    {/* <button 
                onClick={() => setActiveTab('moderators')}
                className={`px-3 py-1 rounded-t border-t border-l border-r border-[#ACA899] ${activeTab === 'moderators' ? 'bg-white border-b-white -mb-px' : 'bg-[#E0DFD8] text-gray-500'}`}
            >
                Moderators
            </button> */}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white p-4 overflow-y-auto">
                    {activeTab === 'general' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold mb-1">Description</label>
                                <textarea
                                    className="w-full border border-[#7F9DB9] p-2 text-sm"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Rules</label>
                                <textarea
                                    className="w-full border border-[#7F9DB9] p-2 text-sm"
                                    rows={4}
                                    value={formData.rules}
                                    onChange={e => setFormData({ ...formData, rules: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_private}
                                        onChange={e => setFormData({ ...formData, is_private: e.target.checked })}
                                    />
                                    Private Room
                                </label>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={handleUpdate}
                                    className="bg-[#0055EA] text-white px-4 py-1 rounded text-sm hover:bg-[#0044DA]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bans' && (
                        <div>
                            <h3 className="text-xs font-bold mb-2">Banned Users</h3>
                            {bans.length === 0 ? <p className="text-sm text-gray-500">No banned users.</p> : (
                                <div className="border border-[#7F9DB9]">
                                    {bans.map(ban => (
                                        <div key={ban.id} className="flex justify-between items-center p-2 border-b border-[#E0DFD8] last:border-0 hover:bg-gray-50">
                                            <div className="text-sm">
                                                <div className="font-bold">{ban.user_id.slice(0, 8)}...</div>
                                                <div className="text-xs text-red-500">{ban.reason || 'No reason'}</div>
                                            </div>
                                            <button
                                                onClick={() => handleUnban(ban.user_id)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
