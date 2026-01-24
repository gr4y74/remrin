'use client';

import React, { useState, useEffect } from 'react';
import { IconSearch, IconRobot, IconUsers, IconPlus, IconCheck, IconLoader } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DiscoverResult {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    type: 'user' | 'persona';
    creator_id?: string;
}

interface MobileDiscoverProps {
    currentUserId?: string;
    onBuddyAdded?: () => void;
}

/**
 * Mobile Discover view - Browse and add users/personas as buddies
 */
export const MobileDiscover: React.FC<MobileDiscoverProps> = ({
    currentUserId,
    onBuddyAdded
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'users' | 'personas'>('all');
    const [results, setResults] = useState<DiscoverResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    // Fetch results
    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                type: filterType,
                search: searchQuery,
                limit: '20'
            });

            const response = await fetch(`/api/chat/discover?${params}`);
            const data = await response.json();

            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Error fetching discover results:', error);
            toast.error('Failed to load results');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchResults();
    }, [filterType]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery || filterType !== 'all') {
                fetchResults();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Add buddy
    const handleAddBuddy = async (result: DiscoverResult) => {
        setAddingIds(prev => new Set(prev).add(result.id));

        try {
            const response = await fetch('/api/chat/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buddyId: result.id,
                    buddyUsername: result.username,
                    buddyType: result.type === 'persona' ? 'bot' : 'human',
                    personaId: result.type === 'persona' ? result.id : null
                })
            });

            if (response.ok) {
                setAddedIds(prev => new Set(prev).add(result.id));
                toast.success(`Added ${result.display_name || result.username}!`);
                onBuddyAdded?.();
            } else {
                toast.error('Failed to add buddy');
            }
        } catch (error) {
            console.error('Error adding buddy:', error);
            toast.error('Failed to add buddy');
        } finally {
            setAddingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(result.id);
                return newSet;
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-[#5e2b8d] to-[#7b4ea3] px-4 py-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Discover</h1>
                <p className="text-white/80 text-sm">Find and add new buddies</p>
            </div>

            {/* Search Bar */}
            <div className="flex-shrink-0 p-4 bg-white border-b border-gray-200">
                <div className="relative">
                    <IconSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users or personas..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5e2b8d]"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex-shrink-0 flex gap-2 px-4 py-3 bg-white border-b border-gray-200 overflow-x-auto">
                {[
                    { value: 'all', label: 'All', icon: null },
                    { value: 'users', label: 'Users', icon: IconUsers },
                    { value: 'personas', label: 'AI', icon: IconRobot }
                ].map((filter) => {
                    const Icon = filter.icon;
                    return (
                        <button
                            key={filter.value}
                            onClick={() => setFilterType(filter.value as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                filterType === filter.value
                                    ? "bg-[#5e2b8d] text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                        >
                            {Icon && <Icon size={16} />}
                            {filter.label}
                        </button>
                    );
                })}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader size={32} className="text-[#5e2b8d] animate-spin" />
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-2">
                            {searchQuery ? '🔍' : '👋'}
                        </div>
                        <p className="text-gray-600">
                            {searchQuery ? 'No results found' : 'Start searching to discover buddies'}
                        </p>
                    </div>
                ) : (
                    results.map((result) => {
                        const isAdding = addingIds.has(result.id);
                        const isAdded = addedIds.has(result.id);

                        return (
                            <div
                                key={result.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <img
                                        src={result.avatar_url || '/images/default-avatar.png'}
                                        alt={result.display_name || result.username}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-800 truncate">
                                                {result.display_name || result.username}
                                            </h3>
                                            {result.type === 'persona' && (
                                                <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                    AI
                                                </span>
                                            )}
                                        </div>
                                        {result.bio && (
                                            <p className="text-sm text-gray-600 truncate mt-0.5">
                                                {result.bio}
                                            </p>
                                        )}
                                    </div>

                                    {/* Add Button */}
                                    <button
                                        onClick={() => handleAddBuddy(result)}
                                        disabled={isAdding || isAdded}
                                        className={cn(
                                            "flex-shrink-0 p-2 rounded-full transition-all active:scale-95",
                                            isAdded
                                                ? "bg-green-100 text-green-600"
                                                : "bg-[#5e2b8d] text-white hover:bg-[#7b4ea3]",
                                            (isAdding || isAdded) && "cursor-not-allowed"
                                        )}
                                    >
                                        {isAdding ? (
                                            <IconLoader size={20} className="animate-spin" />
                                        ) : isAdded ? (
                                            <IconCheck size={20} />
                                        ) : (
                                            <IconPlus size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
