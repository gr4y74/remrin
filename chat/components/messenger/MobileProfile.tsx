'use client';

import React from 'react';
import { IconUser, IconSettings, IconLogout, IconBell, IconShield, IconPalette } from '@tabler/icons-react';

interface MobileProfileProps {
    user?: {
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
    onLogout?: () => void;
}

/**
 * Mobile Profile view - User settings and account management
 */
export const MobileProfile: React.FC<MobileProfileProps> = ({ user, onLogout }) => {
    const menuItems = [
        {
            id: 'edit-profile',
            icon: IconUser,
            title: 'Edit Profile',
            description: 'Update your profile information',
            path: '/settings/profile'
        },
        {
            id: 'notifications',
            icon: IconBell,
            title: 'Notifications',
            description: 'Manage notification preferences',
            path: '/settings/notifications'
        },
        {
            id: 'privacy',
            icon: IconShield,
            title: 'Privacy & Security',
            description: 'Control your privacy settings',
            path: '/settings/privacy'
        },
        {
            id: 'appearance',
            icon: IconPalette,
            title: 'Appearance',
            description: 'Customize your experience',
            path: '/settings/appearance'
        },
        {
            id: 'settings',
            icon: IconSettings,
            title: 'Settings',
            description: 'General app settings',
            path: '/settings'
        }
    ];

    return (
        <div className="pb-6">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-[#5e2b8d] to-[#8b5cf6] p-8 text-white">
                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 mb-4 overflow-hidden">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.display_name || user.username || 'User'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <IconUser size={48} className="text-white/70" />
                            </div>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold mb-1">
                        {user?.display_name || user?.username || 'Guest'}
                    </h1>
                    {user?.username && user?.display_name && (
                        <p className="text-white/80 text-sm">
                            @{user.username}
                        </p>
                    )}
                    {!user && (
                        <p className="text-white/80 text-sm mt-2">
                            Sign in to access all features
                        </p>
                    )}
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-4 mt-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => window.open(item.path, '_blank')}
                            className="w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all active:scale-98 border border-gray-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#5e2b8d]/10 flex items-center justify-center flex-shrink-0">
                                    <Icon size={20} className="text-[#5e2b8d]" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="font-semibold text-gray-800">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {item.description}
                                    </p>
                                </div>
                                <svg
                                    className="w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Logout Button */}
            {user && (
                <div className="px-4 mt-6">
                    <button
                        onClick={onLogout}
                        className="w-full bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                        <IconLogout size={20} />
                        Sign Out
                    </button>
                </div>
            )}

            {/* App Info */}
            <div className="px-4 mt-8 text-center text-xs text-gray-500">
                <p>Remrin Messenger v1.0.0</p>
                <p className="mt-1">© 2026 Remrin. All rights reserved.</p>
            </div>
        </div>
    );
};
