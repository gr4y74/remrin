"use client"

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import {
    Settings,
    Globe,
    HelpCircle,
    Sparkles,
    BookOpen,
    LogOut,
    ChevronRight,
    Zap
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
    openSettings?: () => void;
}

export function UserMenu({ openSettings }: UserMenuProps) {
    const { user, signOut } = useAuth();
    const { subscription } = useSubscription();
    const { profile } = useUnifiedProfile(user?.id);

    const getUserInitials = (email: string) => {
        return email.charAt(0).toUpperCase();
    };

    const getPlanDisplay = (tier: string) => {
        const plans = {
            wanderer: 'Free plan',
            soul_weaver: 'Soul Weaver',
            architect: 'Architect',
            titan: 'Titan'
        };
        return plans[tier as keyof typeof plans] || 'Free plan';
    };

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/';
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-xl transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shrink-0">
                        {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                            <img src={profile?.avatar_url || user.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-primary font-bold text-xs">{getUserInitials(user.email || 'U')}</span>
                        )}
                    </div>
                    <div className="flex flex-col items-start pr-1 hidden md:flex">
                        <span className="text-xs font-bold text-foreground leading-none">{profile?.display_name || user.user_metadata?.full_name || 'User'}</span>
                        {subscription && (
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-primary/70 mt-0.5">
                                {getPlanDisplay(subscription.tier)}
                            </span>
                        )}
                    </div>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-xl border-border shadow-2xl p-1.5 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <div className="text-xs font-bold text-foreground truncate">{user.email}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {subscription ? getPlanDisplay(subscription.tier) : 'Wanderer'}
                    </div>
                </div>

                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors text-xs font-semibold"
                    onClick={openSettings}
                >
                    <Settings size={14} className="text-muted-foreground" />
                    <span className="flex-1">Settings</span>
                    <span className="text-[10px] opacity-40 font-mono">⌘,</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors text-xs font-semibold">
                    <Globe size={14} className="text-muted-foreground" />
                    <span className="flex-1">Language</span>
                    <ChevronRight size={12} className="opacity-30" />
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors text-xs font-semibold"
                    onClick={() => window.open('https://help.remrin.ai', '_blank')}
                >
                    <HelpCircle size={14} className="text-muted-foreground" />
                    <span>Get help</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/50 my-1" />

                {(!subscription || subscription.tier === 'wanderer') && (
                    <DropdownMenuItem
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold mb-1"
                        onClick={() => window.location.href = '/upgrade'}
                    >
                        <Sparkles size={14} />
                        <span>Upgrade plan</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors text-xs font-semibold"
                    onClick={() => window.location.href = '/'}
                >
                    <Zap size={14} className="text-primary" />
                    <span>Switch to Remrin Proper</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted transition-colors text-xs font-semibold"
                    onClick={() => window.open('https://remrin.ai/about', '_blank')}
                >
                    <BookOpen size={14} className="text-muted-foreground" />
                    <span>Learn more</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border/50 my-1" />

                <DropdownMenuItem
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-destructive/10 text-destructive transition-colors text-xs font-bold"
                    onClick={handleLogout}
                >
                    <LogOut size={14} />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
