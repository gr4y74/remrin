"use client";

import React, { useState } from 'react';

export function PasswordModal({ onClose, onSuccess, roomId }: { onClose: () => void, onSuccess: () => void, roomId: string }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/chat/rooms/${roomId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Invalid password');
            }

            onSuccess();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="w-80 bg-[#ECE9D8] border border-[#0055EA] rounded shadow-xl relative z-10 p-1">
                <div className="bg-gradient-to-r from-[#0058EE] to-[#3B92F8] px-2 py-1 flex justify-between items-center text-white mb-2 rounded-t-sm">
                    <span className="font-bold text-sm text-shadow-sm">Room Password</span>
                    <button onClick={onClose} className="bg-[#D5473B] hover:bg-[#E85B4F] w-4 h-4 flex items-center justify-center rounded text-[10px] border border-white/30">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="px-3 pb-3">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 text-xs mb-2 rounded">{error}</div>}

                    <div className="mb-4">
                        <label className="block text-xs text-gray-700 mb-1">Enter Password:</label>
                        <input
                            type="password"
                            className="w-full border border-[#7F9DB9] px-2 py-1 text-sm outline-none focus:border-[#0055EA]"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoFocus
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
                            {loading ? 'Checking...' : 'Enter'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
