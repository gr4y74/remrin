'use client';

import React, { useState } from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';
import { XPInput } from './XPInput';
import { cn } from '@/lib/utils';
import { useBuddyList, Buddy } from '@/hooks/useBuddyList';
import { IconUserPlus, IconLogout, IconMessage, IconUsers, IconSettings, IconBrandWindows, IconHome, IconSparkles, IconDice, IconBooks, IconShoppingBag, IconBrush, IconWallet, IconBell, IconBrandDiscord, IconBrandReddit, IconBrandTiktok, IconBrandX, IconBrandInstagram } from '@tabler/icons-react';
import { CharacterDirectory } from './CharacterDirectory';
import { SidebarRecentChats } from '../layout/SidebarRecentChats';
import { RemrinContext } from '@/context/context';
import Image from 'next/image';

interface BuddyListWindowProps {
    currentUser: any;
    onOpenIM: (userId: string, username: string) => void;
    onClose: () => void;
    onJoinRoom?: () => void;
    onSetAway?: () => void;
    currentStatus?: string;
    isStandalone?: boolean;
}

export const BuddyListWindow: React.FC<BuddyListWindowProps> = ({
    currentUser: propUser,
    onOpenIM,
    onClose,
    onJoinRoom,
    onSetAway,
    currentStatus = 'online',
    isStandalone = false
}) => {
    const { profile } = React.useContext(RemrinContext);
    const currentUser = profile || propUser;

    const displayName = profile?.display_name || currentUser?.user_metadata?.username || 'Guest';
    const avatarUrl = profile?.avatar_url || currentUser?.user_metadata?.image_url || '/images/default-avatar.png';

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
    const [activeTab, setActiveTab] = useState<'contacts' | 'chats'>('contacts');
    const [showCharacterDirectory, setShowCharacterDirectory] = useState(false);

    const handleAddBot = async (personaId: string) => {
        const result = await addBuddy('', 'Characters', undefined, personaId);
        if (result.success) {
            setShowCharacterDirectory(false);
        } else {
            alert(result.error || 'Failed to add bot');
        }
    };

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

    const handlePopOut = () => {
        const width = 220;
        const height = 480;
        const left = window.screenX + (window.innerWidth - width) / 2;
        const top = window.screenY + (window.innerHeight - height) / 2;

        window.open(
            `${window.location.origin}/en/aol/messenger`,
            'RemrinMessenger',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
        );
    };

    return (
        <>
            <XPWindow
                title={`${currentUser?.user_metadata?.username || 'Guest'}'s Buddy List`}
                className={cn("w-full h-full flex flex-col", isStandalone && "shadow-none rounded-none border-none")}
                onClose={onClose}
                onMinimize={() => !isStandalone && handlePopOut()}
                icon="/icons/win95/aol_icon.png"
            >
                {/* Yahoo Style Menu Bar */}
                <div className="flex px-2 py-0.5 bg-[#ece9d8] border-b border-[#d4d0c8] text-[11px] gap-2 text-[#444] select-none">
                    <span className="hover:bg-[#5e2b8d] hover:text-white px-1 cursor-pointer rounded-sm">Messenger</span>
                    <span className="hover:bg-[#5e2b8d] hover:text-white px-1 cursor-pointer rounded-sm">View</span>
                    <span className="hover:bg-[#5e2b8d] hover:text-white px-1 cursor-pointer rounded-sm">Contacts</span>
                    <span className="hover:bg-[#5e2b8d] hover:text-white px-1 cursor-pointer rounded-sm">Help</span>
                </div>

                {/* AIM/Yahoo Brand Header with User Profile */}
                <div className="bg-gradient-to-b from-[#fceebb] to-[#f4d27a] p-3 border-b border-[#e0c060] shadow-sm yahoo-header">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={avatarUrl}
                                alt="Me"
                                className="w-12 h-12 rounded border-2 border-white shadow-sm object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-[#2d005d] text-sm truncate">{displayName}</span>
                                <span className="text-[10px] text-[#5e2b8d]">▼</span>
                            </div>
                            <div className="text-[11px] text-[#5e2b8d] font-medium leading-tight truncate">
                                {currentStatus === 'online' ? 'Feeling lucky! ✨' : 'Away from keyboard...'}
                            </div>
                        </div>
                        {!isStandalone && (
                            <button
                                onClick={handlePopOut}
                                className="p-1 hover:bg-black/10 rounded transition-colors"
                                title="Pop out into standalone window"
                            >
                                <IconLogout size={14} className="rotate-[-90deg] text-[#5e2b8d]" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar Navigation Icons */}
                <div className="flex bg-[#f3ebf9] p-1 border-b border-[#d8c3e8] justify-around">
                    {[
                        { icon: IconHome, label: "Discover", href: "/" },
                        { icon: IconSparkles, label: "Feed", href: "/feed" },
                        { icon: IconDice, label: "Summon", href: "/summon" },
                        { icon: IconBooks, label: "Collection", href: "/collection" },
                        { icon: IconShoppingBag, label: "Marketplace", href: "/marketplace" },
                        { icon: IconBrush, label: "Studio", href: "/studio" },
                        { icon: IconWallet, label: "Wallet", href: "/wallet" },
                        { icon: IconBell, label: "Notifications", href: "#" },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => item.href !== "#" && window.open(item.href, '_blank')}
                            className="p-1.5 hover:bg-[#d8c3e8] rounded-md transition-all group relative"
                            title={item.label}
                        >
                            <item.icon size={18} className="text-[#5e2b8d]" />
                            {/* Simple Pure CSS Tooltip */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#2d005d] text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex flex-col flex-1 bg-[#ece9d8] p-0 overflow-hidden yahoo-content">
                    {/* Yahoo Style Tabs */}
                    <div className="flex bg-[#7b4ea3] px-1 pt-1 gap-[1px]">
                        <button
                            onClick={() => setActiveTab('contacts')}
                            className={cn(
                                "px-4 py-1.5 text-[11px] font-bold rounded-t-[4px] transition-colors",
                                activeTab === 'contacts' ? "bg-[#f3ebf9] text-[#2d005d]" : "bg-[#5e2b8d] text-white hover:bg-[#6d39a3]"
                            )}
                        >
                            Contacts
                        </button>
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={cn(
                                "px-4 py-1.5 text-[11px] font-bold rounded-t-[4px] transition-colors",
                                activeTab === 'chats' ? "bg-[#f3ebf9] text-[#2d005d]" : "bg-[#5e2b8d] text-white hover:bg-[#6d39a3]"
                            )}
                        >
                            Chats
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex gap-1 py-2 px-2 bg-[#f3ebf9] border-b border-[#d8c3e8]">
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#5e2b8d]" onClick={onSetAway}>
                            <IconSettings size={20} />
                            <span>Setup</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#5e2b8d]" onClick={() => setShowAddModal(true)}>
                            <IconUserPlus size={20} />
                            <span>Add</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#5e2b8d]" onClick={() => setShowCharacterDirectory(true)}>
                            <IconBrandWindows size={20} />
                            <span>Find Bot</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-1 rounded hover:bg-white/50 transition-colors text-[10px] text-[#5e2b8d]" onClick={onJoinRoom}>
                            <IconUsers size={20} />
                            <span>Chat</span>
                        </button>
                    </div>

                    {/* Buddy List or Recent Chats */}
                    <div className="flex-1 bg-white border-t border-[#7f9db9] overflow-y-auto font-['Tahoma',_sans-serif] text-[11px] shadow-inner">
                        {activeTab === 'chats' ? (
                            <div className="p-2 yahoo-recent-chats">
                                <SidebarRecentChats isExpanded={true} maxChats={20} showDemo={false} />
                            </div>
                        ) : loading ? (
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
                                                            isSelected ? "bg-[#5e2b8d] text-white" : "hover:bg-[#f3ebf9] text-[#2d005d]"
                                                        )}
                                                    >
                                                        {/* Status Icon or Avatar */}
                                                        {buddy.buddy_type === 'bot' ? (
                                                            <img
                                                                src={buddy.avatar_url || '/images/default-avatar.png'}
                                                                alt=""
                                                                className="w-5 h-5 rounded-full border border-gray-200 object-cover"
                                                            />
                                                        ) : (
                                                            <div className={cn(
                                                                "w-2.5 h-2.5 rounded-sm shadow-sm border border-black/10 flex-shrink-0",
                                                                buddy.status === 'online' && "bg-[#00cc00]",
                                                                buddy.status === 'away' && "bg-[#ffcc00]",
                                                                buddy.status === 'busy' && "bg-[#ff0000]",
                                                                buddy.status === 'offline' && "bg-[#999999]"
                                                            )} />
                                                        )}

                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="truncate font-medium">{buddy.nickname || buddy.buddy_username}</div>
                                                            {buddy.buddy_type === 'human' && buddy.status === 'offline' && buddy.last_seen && (
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
                    <div className="bg-[#f3ebf9] p-1 flex justify-between items-center border-t border-[#d8c3e8]">
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
                        <div className="h-4 w-[1px] bg-[#d8c3e8] mx-1" />
                        <XPButton
                            disabled={!selectedBuddy}
                            onClick={() => selectedBuddy && handleRemoveBuddy(selectedBuddy)}
                            className="bg-transparent border-none shadow-none hover:bg-red-100 hover:text-red-600 px-2"
                        >
                            Remove
                        </XPButton>
                    </div>

                    {/* Yahoo-style Footer (Brand Section) */}
                    <div className="bg-[#f3ebf9] p-4 border-t border-[#d8c3e8] mt-auto">
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Image
                                    src="/logo_dark.svg"
                                    alt="Remrin logo"
                                    width={100}
                                    height={30}
                                    className="h-6 w-auto"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {[
                                    { href: "https://discord.gg/remrin", icon: IconBrandDiscord },
                                    { href: "https://reddit.com/r/remrin", icon: IconBrandReddit },
                                    { href: "https://tiktok.com/@remrin_ai", icon: IconBrandTiktok },
                                    { href: "https://twitter.com/remrin_ai", icon: IconBrandX },
                                    { href: "https://instagram.com/remrin_ai", icon: IconBrandInstagram }
                                ].map((social, idx) => (
                                    <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="text-[#5e2b8d] hover:text-[#2d005d] transition-colors">
                                        <social.icon size={18} />
                                    </a>
                                ))}
                            </div>

                            <p className="text-[9px] text-[#5e2b8d] text-center opacity-70">
                                Copyright © 2025 Remrin AI. All rights reserved
                            </p>
                        </div>
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
                                    <h3 className="font-bold text-[12px] text-[#5e2b8d] mb-1">Add New Buddy</h3>
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

            {showCharacterDirectory && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110]">
                    <CharacterDirectory
                        onClose={() => setShowCharacterDirectory(false)}
                        onAddBot={handleAddBot}
                    />
                </div>
            )}
        </>
    );
};
