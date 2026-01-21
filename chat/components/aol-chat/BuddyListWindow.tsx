'use client';

import React, { useState } from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';
import { XPInput } from './XPInput';
import { cn } from '@/lib/utils';
import { useBuddyList, Buddy } from '@/hooks/useBuddyList';
import { IconUserPlus, IconLogout, IconMessage, IconUsers, IconSettings } from '@tabler/icons-react';

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

    const getSelectedBuddy = (): Buddy | undefined => {
        return buddies.find(b => b.buddy_id === selectedBuddy);
    };

    return (
        <>
            <XPWindow
                title={`${currentUser?.user_metadata?.username || 'Guest'}'s Buddy List`}
                className="w-full h-full min-h-[500px] flex flex-col"
                onClose={onClose}
                icon="/icons/win95/aol_icon.png"
            >
                {/* AIM Brand Header */}
                <div className="bg-gradient-to-b from-[#fceebb] to-[#f4d27a] p-2 border-b border-[#e0c060] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        {/* Placeholder for AIM running man logo if we had it, using text for now */}
                        <div className="font-bold text-[#0054e3] italic text-lg tracking-tighter drop-shadow-sm">Remrin IM</div>
                    </div>
                    <div className="text-[10px] text-[#555] font-semibold">
                        {currentStatus === 'online' ? 'Online' : 'Away'}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-1 bg-[#ece9d8] p-1 overflow-hidden">

                    {/* Toolbar */}
                    <div className="flex gap-1 mb-2 px-1">
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#0054e3]" onClick={onSetAway}>
                            <IconSettings size={20} />
                            <span>Setup</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#0054e3]" onClick={() => setShowAddModal(true)}>
                            <IconUserPlus size={20} />
                            <span>Add</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#0054e3]" onClick={onJoinRoom}>
                            <IconUsers size={20} />
                            <span>Chat</span>
                        </button>
                    </div>

                    {/* Buddy List */}
                    <div className="flex-1 bg-white border border-[#7f9db9] rounded-[2px] overflow-y-auto font-['Tahoma',_sans-serif] text-[11px] shadow-inner mb-2">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 italic">Loading List...</div>
                        ) : buddies.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">
                                <p className="mb-2">Your buddy list is empty.</p>
                                <XPButton onClick={() => setShowAddModal(true)} variant="normal" className="text-[10px]">Add a Buddy</XPButton>
                            </div>
                        ) : (
                            groupNames.map(group => (
                                <div key={group} className="select-none">
                                    <div
                                        className="flex items-center cursor-pointer hover:bg-[#eef3fa] px-2 py-1 bg-[#f7f8f9] border-b border-gray-100"
                                        onClick={() => toggleGroup(group)}
                                    >
                                        <span className="mr-1 text-[8px] text-gray-500 transform transition-transform duration-200" style={{ transform: expandedGroups[group] ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                        <span className="font-bold text-[#4a4a4a] text-[11px]">
                                            {group}
                                        </span>
                                        <span className="ml-auto text-[10px] text-gray-400">
                                            {(groups[group] || []).filter(b => b.status === 'online').length}/{(groups[group] || []).length}
                                        </span>
                                    </div>

                                    {expandedGroups[group] && (
                                        <div className="bg-white">
                                            {(groups[group] || []).map(buddy => {
                                                const isSelected = selectedBuddy === buddy.buddy_id;
                                                return (
                                                    <div
                                                        key={buddy.buddy_id}
                                                        onClick={() => setSelectedBuddy(buddy.buddy_id)}
                                                        onDoubleClick={() => onOpenIM(buddy.buddy_id, buddy.nickname || buddy.buddy_username)}
                                                        className={cn(
                                                            "cursor-pointer px-4 py-1 flex items-center gap-2 transition-colors",
                                                            isSelected ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f0f0] text-black"
                                                        )}
                                                    >
                                                        {/* Status Icon */}
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-sm shadow-sm border border-black/10 flex-shrink-0",
                                                            buddy.status === 'online' && "bg-[#00cc00]",
                                                            buddy.status === 'away' && "bg-[#ffcc00]",
                                                            buddy.status === 'busy' && "bg-[#ff0000]",
                                                            buddy.status === 'offline' && "bg-[#999999]"
                                                        )} />

                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="truncate font-medium">{buddy.nickname || buddy.buddy_username}</div>
                                                            {buddy.status === 'offline' && buddy.last_seen && (
                                                                <div className={cn("text-[10px] italic truncate", isSelected ? "text-white/70" : "text-gray-400")}>
                                                                    Last seen: {new Date(buddy.last_seen).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                            {buddy.status === 'away' && (
                                                                <div className={cn("text-[10px] italic truncate", isSelected ? "text-white/70" : "text-gray-400")}>
                                                                    Away
                                                                </div>
                                                            )}
                                                        </div>

                                                        {buddy.is_favorite && <span className="text-yellow-400 text-[10px]">★</span>}
                                                    </div>
                                                );
                                            })}
                                            {(groups[group] || []).length === 0 && (
                                                <div className="text-gray-300 italic px-4 py-1 text-[10px]">No buddies in this group</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-[#d4d0c8] p-1 rounded-[2px] flex justify-between items-center border border-white shadow-[inset_1px_1px_0_rgba(0,0,0,0.1)]">
                        <XPButton
                            className="px-3"
                            disabled={!selectedBuddy}
                            onClick={() => {
                                const buddy = getSelectedBuddy();
                                if (buddy) onOpenIM(buddy.buddy_id, buddy.nickname || buddy.buddy_username);
                            }}
                        >
                            <span className="flex items-center gap-1"><IconMessage size={12} /> IM</span>
                        </XPButton>
                        <div className="h-4 w-[1px] bg-gray-400 mx-1" />
                        <XPButton
                            disabled={!selectedBuddy}
                            onClick={() => selectedBuddy && handleRemoveBuddy(selectedBuddy)}
                            className="bg-transparent border-none shadow-none hover:bg-red-100 hover:text-red-600 px-2"
                        >
                            Remove
                        </XPButton>
                    </div>
                </div>
            </XPWindow>

            {/* Add Buddy Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <XPWindow
                        title="Add to Buddy List"
                        className="w-[320px] h-auto shadow-2xl"
                        onClose={() => setShowAddModal(false)}
                    >
                        <div className="p-4 bg-[#ece9d8]">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="bg-white p-2 rounded border border-[#7f9db9]">
                                    <IconUserPlus size={24} className="text-[#0054e3]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[12px] text-[#0054e3] mb-1">Add New Buddy</h3>
                                    <p className="text-[11px] text-[#4a4a4a]">Enter the screen name of the person you want to add to your buddy list.</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-[11px] mb-1 font-bold text-[#4a4a4a]">Screen Name:</label>
                                <XPInput
                                    value={addUsername}
                                    onChange={(e) => setAddUsername(e.target.value)}
                                    placeholder="e.g. CoolDude99"
                                    className="w-full"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddBuddy()}
                                    autoFocus
                                />
                            </div>

                            {addError && (
                                <div className="bg-[#ffebeb] border border-[#ff0000] text-[#ff0000] p-2 text-[10px] mb-4 rounded-[2px] flex items-center gap-1">
                                    <span>⚠️</span> {addError}
                                </div>
                            )}

                            <div className="flex gap-2 justify-end pt-2 border-t border-white/50">
                                <XPButton onClick={() => setShowAddModal(false)} className="px-4">Cancel</XPButton>
                                <XPButton onClick={handleAddBuddy} variant="primary" className="px-4">Add Buddy</XPButton>
                            </div>
                        </div>
                    </XPWindow>
                </div>
            )}
        </>
    );
};
