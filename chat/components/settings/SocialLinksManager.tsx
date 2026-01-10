'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { IconBrandTwitter, IconBrandGithub, IconBrandLinkedin, IconBrandDiscord, IconBrandYoutube, IconBrandTwitch, IconBrandInstagram, IconWorld, IconPlus, IconTrash, IconLoader2 } from '@tabler/icons-react';

interface SocialLink {
    id: string;
    platform: string;
    handle?: string;
    url: string;
    display_order: number;
}

const PLATFORMS = [
    { value: 'twitter', label: 'Twitter/X', icon: IconBrandTwitter },
    { value: 'github', label: 'GitHub', icon: IconBrandGithub },
    { value: 'linkedin', label: 'LinkedIn', icon: IconBrandLinkedin },
    { value: 'discord', label: 'Discord', icon: IconBrandDiscord },
    { value: 'youtube', label: 'YouTube', icon: IconBrandYoutube },
    { value: 'twitch', label: 'Twitch', icon: IconBrandTwitch },
    { value: 'instagram', label: 'Instagram', icon: IconBrandInstagram },
    { value: 'website', label: 'Website', icon: IconWorld },
];

export function SocialLinksManager() {
    const supabase = createClient();
    const [links, setLinks] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newLink, setNewLink] = useState({ platform: 'twitter', url: '', handle: '' });

    useEffect(() => {
        loadLinks();
    }, []);

    const loadLinks = async () => {
        try {
            const response = await fetch('/api/profile/social-links');
            const data = await response.json();

            if (response.ok) {
                setLinks(data.links || []);
            } else {
                toast.error('Failed to load social links');
            }
        } catch (error) {
            console.error('Error loading social links:', error);
            toast.error('Failed to load social links');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newLink.url) {
            toast.error('Please enter a URL');
            return;
        }

        setAdding(true);
        try {
            const response = await fetch('/api/profile/social-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newLink,
                    display_order: links.length,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setLinks([...links, data.link]);
                setNewLink({ platform: 'twitter', url: '', handle: '' });
                toast.success('Social link added!');
            } else {
                toast.error(data.error || 'Failed to add social link');
            }
        } catch (error) {
            console.error('Error adding social link:', error);
            toast.error('Failed to add social link');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this social link?')) return;

        try {
            const response = await fetch(`/api/profile/social-links/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setLinks(links.filter(link => link.id !== id));
                toast.success('Social link deleted');
            } else {
                toast.error('Failed to delete social link');
            }
        } catch (error) {
            console.error('Error deleting social link:', error);
            toast.error('Failed to delete social link');
        }
    };

    const getPlatformIcon = (platform: string) => {
        const platformData = PLATFORMS.find(p => p.value === platform);
        const Icon = platformData?.icon || IconWorld;
        return <Icon className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <IconLoader2 className="w-6 h-6 animate-spin text-rp-iris" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
            <h2 className="text-lg font-semibold text-rp-text mb-4">Social Links</h2>

            {/* Existing Links */}
            <div className="space-y-3 mb-6">
                {links.length === 0 ? (
                    <p className="text-sm text-rp-muted text-center py-4">
                        No social links added yet
                    </p>
                ) : (
                    links.map((link) => (
                        <div
                            key={link.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-rp-highlight-med bg-rp-base"
                        >
                            <div className="text-rp-iris">
                                {getPlatformIcon(link.platform)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-rp-text capitalize">
                                    {link.platform}
                                </p>
                                <p className="text-xs text-rp-muted truncate">
                                    {link.url}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(link.id)}
                                className="text-red-500 hover:text-red-600 transition-colors"
                            >
                                <IconTrash className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add New Link */}
            <div className="space-y-3 pt-4 border-t border-rp-highlight-med">
                <h3 className="text-sm font-medium text-rp-text">Add Social Link</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-rp-muted mb-1">Platform</label>
                        <select
                            value={newLink.platform}
                            onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm text-rp-text focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                        >
                            {PLATFORMS.map((platform) => (
                                <option key={platform.value} value={platform.value}>
                                    {platform.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-rp-muted mb-1">Handle (optional)</label>
                        <input
                            type="text"
                            value={newLink.handle}
                            onChange={(e) => setNewLink({ ...newLink, handle: e.target.value })}
                            placeholder="@username"
                            className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-rp-muted mb-1">URL</label>
                    <input
                        type="url"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-rp-highlight-med bg-rp-base px-3 py-2 text-sm text-rp-text placeholder:text-rp-muted focus:border-rp-iris focus:outline-none focus:ring-2 focus:ring-rp-iris/20"
                    />
                </div>

                <button
                    onClick={handleAdd}
                    disabled={adding || !newLink.url}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-rp-iris px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rp-iris/80 disabled:opacity-50"
                >
                    {adding ? (
                        <>
                            <IconLoader2 className="w-4 h-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <IconPlus className="w-4 h-4" />
                            Add Link
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
