"use client";

import React, { useState } from 'react';
import { XPButton } from './XPButton';
import { XPInput } from './XPInput';
import { createClient } from '@/lib/supabase/client';

const CATEGORIES = ['General', 'Romance', 'Sports', 'Entertainment', 'Tech', 'Gaming', 'Music', 'Art'];

export function CreateRoomModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'General',
        is_private: false,
        password: '',
        max_members: 50
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate
            if (formData.name.length < 3) throw new Error("Name must be at least 3 characters");
            if (formData.is_private && !formData.password) throw new Error("Private rooms require a password");

            const res = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create room');

            onSuccess();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="w-96 bg-[#ECE9D8] border border-[#0055EA] rounded shadow-xl relative z-10 p-1">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0058EE] to-[#3B92F8] px-2 py-1 flex justify-between items-center text-white mb-2 rounded-t-sm">
                    <span className="font-bold text-sm text-shadow-sm">Create New Room</span>
                    <button onClick={onClose} className="bg-[#D5473B] hover:bg-[#E85B4F] w-4 h-4 flex items-center justify-center rounded text-[10px] border border-white/30">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="px-3 pb-3">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 text-xs mb-2 rounded">{error}</div>}

                    <div className="mb-2">
                        <label className="block text-xs text-gray-700 mb-1">Room Name:</label>
                        <input
                            type="text"
                            className="w-full border border-[#7F9DB9] px-2 py-1 text-sm outline-none focus:border-[#0055EA]"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <label className="block text-xs text-gray-700 mb-1">Description:</label>
                        <textarea
                            className="w-full border border-[#7F9DB9] px-2 py-1 text-sm outline-none focus:border-[#0055EA]"
                            rows={2}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="mb-2">
                        <label className="block text-xs text-gray-700 mb-1">Category:</label>
                        <select
                            className="w-full border border-[#7F9DB9] px-1 py-1 text-sm outline-none focus:border-[#0055EA]"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="mb-2">
                        <label className="flex items-center text-xs text-gray-700 gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_private}
                                onChange={e => setFormData({ ...formData, is_private: e.target.checked })}
                            />
                            Make this room private
                        </label>
                    </div>

                    {formData.is_private && (
                        <div className="mb-2 pl-4 border-l-2 border-gray-300">
                            <label className="block text-xs text-gray-700 mb-1">Room Password:</label>
                            <input
                                type="password"
                                className="w-full border border-[#7F9DB9] px-2 py-1 text-sm outline-none focus:border-[#0055EA]"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required={formData.is_private}
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs text-gray-700 mb-1">Max Members: {formData.max_members}</label>
                        <input
                            type="range"
                            min="2" max="100"
                            className="w-full"
                            value={formData.max_members}
                            onChange={e => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-400 rounded text-sm min-w-[60px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-1 bg-[#0055EA] hover:bg-[#0044DA] border border-[#0022AA] rounded text-white text-sm min-w-[60px]"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
