'use client';

import React, { useState, useEffect } from 'react';
import { Win95Window } from './Win95Window';
import { Win95Button } from './Win95Button';
import { createClient } from '@/lib/supabase/client';

interface ProfileCardProps {
    userId: string;
    username: string;
    onClose: () => void;
    onSendIM: (userId: string, username: string) => void;
    onAddBuddy?: (username: string) => void;
    onBlock?: (userId: string) => void;
    isOwnProfile?: boolean;
    position?: { x: number; y: number };
}

interface ProfileData {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    status: string;
    away_message: string | null;
    member_since: string | null;
    interests: string[] | null;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    userId,
    username,
    onClose,
    onSendIM,
    onAddBuddy,
    onBlock,
    isOwnProfile = false,
    position
}) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from('user_profiles_chat')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setProfile(data);
            } else {
                // Fallback if no chat profile exists
                setProfile({
                    username,
                    display_name: null,
                    avatar_url: null,
                    bio: null,
                    location: null,
                    status: 'offline',
                    away_message: null,
                    member_since: null,
                    interests: null
                });
            }

            setLoading(false);
        };

        fetchProfile();
    }, [userId, username, supabase]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            className="absolute z-30"
            style={position ? { left: position.x, top: position.y } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
            <Win95Window
                title={`Get Info: ${username}`}
                className="w-[320px] h-auto"
                onClose={onClose}
                icon="/icons/win95/user_yellow.png"
            >
                <div className="p-3 bg-[#c0c0c0]">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : profile ? (
                        <>
                            {/* Header with Avatar and Status */}
                            <div className="flex gap-3 mb-3">
                                {/* Avatar */}
                                <div className="w-16 h-16 bg-white border-2 border-[inset] border-[#808080] flex items-center justify-center overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-3xl">👤</div>
                                    )}
                                </div>

                                {/* Name and Status */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-[14px] text-[#000080]">
                                        {profile.display_name || profile.username}
                                    </h3>
                                    <p className="text-[11px] text-gray-600">{profile.username}</p>

                                    <div className="flex items-center gap-1 mt-1">
                                        <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(profile.status)}`} />
                                        <span className="text-[10px] capitalize">{profile.status}</span>
                                    </div>

                                    {profile.away_message && profile.status === 'away' && (
                                        <p className="text-[10px] italic text-gray-500 mt-1">
                                            &quot;{profile.away_message}&quot;
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="bg-white border-2 border-[inset] border-[#808080] p-2 mb-3 text-[11px]">
                                {profile.bio && (
                                    <div className="mb-2">
                                        <span className="font-bold">About:</span>
                                        <p className="text-gray-700">{profile.bio}</p>
                                    </div>
                                )}

                                {profile.location && (
                                    <div className="mb-1">
                                        <span className="font-bold">Location:</span> {profile.location}
                                    </div>
                                )}

                                <div className="mb-1">
                                    <span className="font-bold">Member Since:</span> {formatDate(profile.member_since)}
                                </div>

                                {profile.interests && profile.interests.length > 0 && (
                                    <div>
                                        <span className="font-bold">Interests:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {profile.interests.map((interest, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-[#c0c0c0] px-2 py-[1px] rounded text-[10px]"
                                                >
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 flex-wrap">
                                {!isOwnProfile && (
                                    <>
                                        <Win95Button
                                            className="flex-1 text-[11px]"
                                            onClick={() => onSendIM(userId, profile.username)}
                                        >
                                            Send IM
                                        </Win95Button>

                                        {onAddBuddy && (
                                            <Win95Button
                                                className="flex-1 text-[11px]"
                                                onClick={() => onAddBuddy(profile.username)}
                                            >
                                                Add Buddy
                                            </Win95Button>
                                        )}

                                        {onBlock && (
                                            <Win95Button
                                                className="text-[11px] text-red-600"
                                                onClick={() => onBlock(userId)}
                                            >
                                                Block
                                            </Win95Button>
                                        )}
                                    </>
                                )}

                                <Win95Button
                                    className="text-[11px]"
                                    onClick={onClose}
                                >
                                    Close
                                </Win95Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            Profile not found
                        </div>
                    )}
                </div>
            </Win95Window>
        </div>
    );
};
