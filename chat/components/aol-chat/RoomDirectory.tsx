"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, Lock, Users, Plus, RefreshCw } from 'lucide-react';
import { CreateRoomModal } from './CreateRoomModal';
import { PasswordModal } from './PasswordModal';

interface Room {
    id: string;
    name: string;
    description: string;
    category: string;
    is_private: boolean;
    max_members: number;
    created_at: string;
    owner_id: string;
}

const CATEGORIES = ['All', 'General', 'Romance', 'Sports', 'Entertainment', 'Tech', 'Gaming', 'Music', 'Art'];

export function RoomDirectory({ onClose, onJoinRoom }: { onClose: () => void, onJoinRoom: (roomName: string, roomId: string) => void }) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [passwordModalRoom, setPasswordModalRoom] = useState<{ id: string, name: string } | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const fetchRooms = async () => {
        setLoading(true);
        try {
            let url = '/api/chat/rooms?';
            if (selectedCategory !== 'All') url += `category=${selectedCategory}&`;
            if (searchQuery) url += `search=${searchQuery}&`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (e) {
            console.error('Failed to fetch rooms', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [selectedCategory]); // Search triggers manually or with debounce in real app, here on enter or button usually

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRooms();
    };

    const handleRoomClick = (room: Room) => {
        if (room.is_private) {
            setPasswordModalRoom({ id: room.id, name: room.name });
        } else {
            onJoinRoom(room.name, room.id);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-sans">
            <div className="w-full max-w-4xl bg-[#ECE9D8] border border-[#0055EA] rounded-t-lg shadow-xl flex flex-col h-[80vh] overflow-hidden">
                {/* Title Bar */}
                <div className="bg-gradient-to-r from-[#0058EE] to-[#3B92F8] px-3 py-2 flex justify-between items-center text-white shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <img src="/icons/aol-icon.png" className="w-4 h-4" alt="" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <span className="font-bold text-shadow-sm select-none">Find a Chat Room</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onClose}
                            className="w-5 h-5 bg-[#D5473B] hover:bg-[#E85B4F] border border-white/30 rounded flex items-center justify-center text-xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-[#ECE9D8] border-b border-[#ACA899] p-2 flex items-center gap-2 shrink-0">
                    <div className="flex-1 bg-white border border-[#7F9DB9] rounded px-2 py-1 flex items-center">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            className="w-full outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchRooms()}
                        />
                    </div>
                    <button
                        onClick={fetchRooms}
                        className="px-3 py-1 bg-[#F1F1F1] hover:bg-[#E1E1E1] border border-[#ACA899] rounded text-sm text-black flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Go
                    </button>
                    <div className="h-6 w-px bg-[#ACA899] mx-1" />
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-3 py-1 bg-[#F1F1F1] hover:bg-[#E1E1E1] border border-[#ACA899] rounded text-sm text-black flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Create Room
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Categories Sidebar */}
                    <div className="w-48 bg-white border-r border-[#ACA899] overflow-y-auto p-1">
                        <div className="text-xs font-bold text-[#003399] uppercase px-2 py-1 mb-1">Categories</div>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-sm mb-0.5 flex items-center ${selectedCategory === cat
                                    ? 'bg-[#316AC5] text-white'
                                    : 'hover:bg-[#EBF3FD] text-black'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Room List */}
                    <div className="flex-1 bg-white overflow-y-auto p-4 flex flex-col gap-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-gray-400">Loading rooms...</div>
                        ) : rooms.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">No rooms found.</div>
                        ) : (
                            rooms.map(room => (
                                <div
                                    key={room.id}
                                    className="group bg-white hover:bg-[#F2F7FF] border border-transparent hover:border-[#316AC5] rounded p-3 cursor-pointer transition-colors"
                                    onClick={() => handleRoomClick(room)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-[#003399] group-hover:underline">{room.name}</h3>
                                            {room.is_private && <Lock className="w-3 h-3 text-yellow-600" />}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Users className="w-3 h-3 mr-1" />
                                            <span>{Math.floor(Math.random() * 50)}/{room.max_members}</span> {/* Mock active users for now */}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{room.description || 'No description'}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-[#ECE9D8] border-t border-[#ACA899] px-3 py-1 text-xs text-gray-600 shrink-0 flex justify-between">
                    <span>{rooms.length} objects</span>
                    <span className="truncate">Connected to AOL Network</span>
                </div>
            </div>

            {showCreateModal && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchRooms();
                    }}
                />
            )}

            {passwordModalRoom && (
                <PasswordModal
                    roomId={passwordModalRoom.id}
                    onClose={() => setPasswordModalRoom(null)}
                    onSuccess={() => {
                        onJoinRoom(passwordModalRoom.name, passwordModalRoom.id);
                        setPasswordModalRoom(null);
                    }}
                />
            )}
        </div>
    );
}
