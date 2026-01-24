'use client';

import React from 'react';
import { IconX, IconSettings, IconLogout, IconUser, IconBell } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user?: {
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
    onLogout?: () => void;
}

/**
 * Mobile menu drawer that slides in from the left
 */
export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
    isOpen,
    onClose,
    user,
    onLogout
}) => {
    const menuItems = [
        {
            id: 'profile',
            icon: IconUser,
            label: 'Profile',
            onClick: () => window.open('/profile/' + user?.username, '_blank')
        },
        {
            id: 'settings',
            icon: IconSettings,
            label: 'Settings',
            onClick: () => window.open('/settings', '_blank')
        },
        {
            id: 'notifications',
            icon: IconBell,
            label: 'Notifications',
            onClick: () => window.open('/activity', '_blank')
        }
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full w-[280px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#5e2b8d] to-[#8b5cf6] p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Menu</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close menu"
                        >
                            <IconX size={20} />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar_url || '/images/default-avatar.png'}
                            alt={user?.display_name || user?.username || 'User'}
                            className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold truncate">
                                {user?.display_name || user?.username || 'Guest'}
                            </div>
                            {user?.username && user?.display_name && (
                                <div className="text-xs text-white/70 truncate">
                                    @{user.username}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.onClick();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors active:scale-98"
                            >
                                <Icon size={20} className="text-[#5e2b8d]" />
                                <span className="font-medium text-gray-700">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Logout Button */}
                {user && onLogout && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                onLogout();
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors active:scale-98"
                        >
                            <IconLogout size={20} />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
