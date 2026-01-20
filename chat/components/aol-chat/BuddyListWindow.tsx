'use client';

import React, { useState } from 'react';
import { Win95Window } from './Win95Window';
import { Win95Button } from './Win95Button';
import { Win95Input } from './Win95Input';
import { cn } from '@/lib/utils';
import { useBuddyList, Buddy } from '@/hooks/useBuddyList';

interface BuddyListWindowProps {
    currentUser: any;
    onOpenIM: (userId: string, username: string) => void;
    onClose: () => void;
    onJoinRoom?: () => void;
    onSetAway?: () => void;
    currentStatus?: string;
}

export const BuddyListWindow: React.FC<BuddyListWindowProps> = ({
    currentUser,
    onOpenIM,
    onClose,
    onJoinRoom,
    onSetAway,
    currentStatus = 'online'
}) => {
    const {
        buddies,
        loading,
        addBuddy,
        removeBuddy,
        blockUser,
        groupedBuddies
    } = useBuddyList();

    const [selectedBuddy, setSelectedBuddy] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Buddies': true,
        'Family': true,
        'Co-Workers': false,
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [addUsername, setAddUsername] = useState('');
    const [addError, setAddError] = useState('');

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const groups = groupedBuddies();
    const groupNames = Object.keys(groups).length > 0 ? Object.keys(groups) : ['Buddies'];

    const handleAddBuddy = async () => {
        if (!addUsername.trim()) return;

        setAddError('');
        const result = await addBuddy(addUsername.trim());

        if (result.success) {
            setAddUsername('');
            setShowAddModal(false);
        } else {
            setAddError(result.error || 'Failed to add buddy');
        }
    };

    const handleRemoveBuddy = async (buddyId: string) => {
        if (confirm('Remove this buddy from your list?')) {
            await removeBuddy(buddyId);
            setSelectedBuddy(null);
        }
    };

    const handleBlockUser = async (buddyId: string) => {
        if (confirm('Block this user? They will be removed from your buddy list.')) {
            await blockUser(buddyId);
            setSelectedBuddy(null);
        }
    };

    const getSelectedBuddy = (): Buddy | undefined => {
        return buddies.find(b => b.buddy_id === selectedBuddy);
    };

    return (
        <>
            <Win95Window
                title={`${currentUser?.user_metadata?.username || 'Guest'}'s Buddy List`}
                className="w-[240px] h-[480px]"
                onClose={onClose}
                icon="/icons/win95/aol_icon.png"
            >
                {/* Menu Bar */}
                <div className="flex px-1 py-[2px] border-b border-[#808080] mb-1 text-[11px] bg-[#c0c0c0]">
                    <span className="px-1 cursor-pointer hover:bg-[#000080] hover:text-white">My AIM</span>
                    <span className="px-1 cursor-pointer hover:bg-[#000080] hover:text-white">People</span>
                    <span className="px-1 cursor-pointer hover:bg-[#000080] hover:text-white">Help</span>
                </div>

                {/* Main Content */}
                <div className="flex flex-col h-[calc(100%-46px)] bg-[#c0c0c0] p-1">
                    {/* Banner */}
                    <div className="h-14 bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-[#808080] mb-1 flex items-center justify-center rounded">
                        <span className="text-white font-bold text-sm drop-shadow-md">Remrin Chat</span>
                    </div>

                    {/* Buddy List */}
                    <div className="flex-1 bg-white border-2 border-[inset] border-[#808080] overflow-y-auto font-['Tahoma',_sans-serif] text-[11px]">
                        {loading ? (
                            <div className="p-2 text-center text-gray-500">Loading...</div>
                        ) : buddies.length === 0 ? (
                            <div className="p-2 text-center text-gray-500">
                                No buddies yet.<br />
                                Click &quot;Add&quot; to get started!
                            </div>
                        ) : (
                            groupNames.map(group => (
                                <div key={group}>
                                    <div
                                        className="flex items-center cursor-pointer hover:bg-gray-100 select-none px-1 py-[2px]"
                                        onClick={() => toggleGroup(group)}
                                    >
                                        <span className="mr-1 text-[9px]">{expandedGroups[group] ? '▼' : '▶'}</span>
                                        <span className="font-bold text-[#000080]">
                                            {group} ({(groups[group] || []).filter(b => b.status === 'online').length}/{(groups[group] || []).length})
                                        </span>
                                    </div>

                                    {expandedGroups[group] && (
                                        <div className="ml-2">
                                            {(groups[group] || []).map(buddy => (
                                                <div
                                                    key={buddy.buddy_id}
                                                    onClick={() => setSelectedBuddy(buddy.buddy_id)}
                                                    onDoubleClick={() => onOpenIM(buddy.buddy_id, buddy.nickname || buddy.buddy_username)}
                                                    className={cn(
                                                        "cursor-pointer px-1 py-[1px] flex items-center gap-1",
                                                        selectedBuddy === buddy.buddy_id && "bg-[#000080] text-white"
                                                    )}
                                                >
                                                    {/* Status indicator */}
                                                    <span className={cn(
                                                        "inline-block w-2 h-2 rounded-full",
                                                        buddy.status === 'online' && "bg-green-500",
                                                        buddy.status === 'away' && "bg-orange-500",
                                                        buddy.status === 'busy' && "bg-red-500",
                                                        buddy.status === 'offline' && "bg-gray-400"
                                                    )} />

                                                    {/* Name */}
                                                    <span className={buddy.status === 'offline' ? 'text-gray-500' : ''}>
                                                        {buddy.nickname || buddy.buddy_username}
                                                        {buddy.is_favorite && ' ⭐'}
                                                        {buddy.status === 'offline' && buddy.last_seen && (
                                                            <span className="text-[9px] text-gray-400 ml-1 italic">
                                                                (Last seen {(() => {
                                                                    const diff = Date.now() - new Date(buddy.last_seen).getTime();
                                                                    const minutes = Math.floor(diff / 60000);
                                                                    if (minutes < 1) return 'just now';
                                                                    if (minutes < 60) return `${minutes} min ago`;
                                                                    const hours = Math.floor(minutes / 60);
                                                                    if (hours < 24) return `${hours} hr ago`;
                                                                    return new Date(buddy.last_seen).toLocaleDateString();
                                                                })()})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                            {(groups[group] || []).length === 0 && (
                                                <div className="text-gray-400 italic px-1">Empty</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Bottom Buttons */}
                    <div className="mt-1 flex flex-wrap gap-1 px-1">
                        <Win95Button
                            className="flex-1 px-1 py-0 min-w-[40px] text-[10px]"
                            disabled={!selectedBuddy}
                            onClick={() => {
                                const buddy = getSelectedBuddy();
                                if (buddy) onOpenIM(buddy.buddy_id, buddy.nickname || buddy.buddy_username);
                            }}
                        >
                            IM
                        </Win95Button>
                        <Win95Button
                            className="flex-1 px-1 py-0 min-w-[40px] text-[10px]"
                            onClick={onJoinRoom}
                        >
                            Chat
                        </Win95Button>
                        <Win95Button
                            className="flex-1 px-1 py-0 min-w-[40px] text-[10px]"
                            onClick={() => setShowAddModal(true)}
                        >
                            Add
                        </Win95Button>
                        <Win95Button
                            className="flex-1 px-1 py-0 min-w-[40px] text-[10px]"
                            onClick={onSetAway}
                        >
                            Away
                        </Win95Button>
                        <Win95Button
                            className="flex-1 px-1 py-0 min-w-[40px] text-[10px]"
                            disabled={!selectedBuddy}
                            onClick={() => selectedBuddy && handleRemoveBuddy(selectedBuddy)}
                        >
                            Remove
                        </Win95Button>
                    </div>
                </div>
            </Win95Window>

            {/* Add Buddy Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Win95Window
                        title="Add Buddy"
                        className="w-[280px] h-auto"
                        onClose={() => setShowAddModal(false)}
                    >
                        <div className="p-3">
                            <p className="text-[11px] mb-2">Enter the username of the buddy you want to add:</p>
                            <Win95Input
                                value={addUsername}
                                onChange={(e) => setAddUsername(e.target.value)}
                                placeholder="Username"
                                className="w-full mb-2"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddBuddy()}
                                autoFocus
                            />
                            {addError && (
                                <p className="text-red-600 text-[10px] mb-2">{addError}</p>
                            )}
                            <div className="flex gap-2 justify-end">
                                <Win95Button onClick={() => setShowAddModal(false)}>Cancel</Win95Button>
                                <Win95Button onClick={handleAddBuddy}>Add</Win95Button>
                            </div>
                        </div>
                    </Win95Window>
                </div>
            )}
        </>
    );
};
