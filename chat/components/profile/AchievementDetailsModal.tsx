'use client';

import { X } from 'lucide-react';

interface AchievementDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievement: {
        icon: string;
        name: string;
        description: string;
        earnedDate: string;
        rarity: string;
        colorGradient: string;
    } | null;
}

export function AchievementDetailsModal({ isOpen, onClose, achievement }: AchievementDetailsModalProps) {
    if (!isOpen || !achievement) return null;

    const rarityColors = {
        common: 'from-gray-400 to-gray-600',
        rare: 'from-blue-400 to-blue-600',
        epic: 'from-purple-400 to-purple-600',
        legendary: 'from-yellow-400 to-yellow-600',
    };

    const gradientClass = rarityColors[achievement.rarity as keyof typeof rarityColors] || rarityColors.common;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="bg-rose-pine-base rounded-lg shadow-xl max-w-md w-full border border-rose-pine-highlight"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative h-32 bg-gradient-to-br ${gradientClass} rounded-t-lg flex items-center justify-center`}>
                    <div className="text-6xl">{achievement.icon}</div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-rose-pine-text mb-1">{achievement.name}</h2>
                        <p className="text-sm text-rose-pine-subtle capitalize">{achievement.rarity} Achievement</p>
                    </div>

                    <p className="text-rose-pine-text leading-relaxed">{achievement.description}</p>

                    <div className="pt-4 border-t border-rose-pine-highlight">
                        <p className="text-sm text-rose-pine-subtle">
                            Earned on {new Date(achievement.earnedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
