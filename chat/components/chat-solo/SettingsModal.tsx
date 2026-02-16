"use client"

import React, { useState } from 'react';
import {
    X,
    User,
    Bell,
    Lock,
    CreditCard,
    Database,
    Monitor,
    Moon,
    Sun,
    Globe,
    Trash2,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase/browser-client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState('general');
    const { user } = useAuth();
    const { subscription } = useSubscription();
    const { profile, updateProfile } = useUnifiedProfile(user?.id);

    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <div className="p-8 text-center space-y-4">
                        <div className="text-xs text-muted-foreground animate-pulse">
                            Synchronizing session...
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-[10px]">
                                Force Reload & Sync
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClose} className="text-[10px] opacity-50">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const handleUpdatePreference = async (key: string, value: any) => {
        await updateProfile({ [key]: value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background/80 backdrop-blur-2xl border-white/5 shadow-2xl rounded-3xl">
                <div className="flex h-[600px]">
                    {/* Sidebar */}
                    <div className="w-56 border-r border-white/5 bg-white/5 p-4 flex flex-col gap-1">
                        <h2 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Settings</h2>

                        <button
                            onClick={() => setActiveTab('general')}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left",
                                activeTab === 'general' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <User size={16} />
                            <span>General</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left",
                                activeTab === 'appearance' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <Monitor size={16} />
                            <span>Appearance</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left",
                                activeTab === 'privacy' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <Database size={16} />
                            <span>Memory & Data</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('billing')}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left",
                                activeTab === 'billing' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <CreditCard size={16} />
                            <span>Billing</span>
                        </button>

                        <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="px-3 py-2 rounded-xl bg-destructive/5 text-[10px] text-destructive flex items-center gap-2 font-bold uppercase tracking-tight">
                                <AlertCircle size={12} />
                                Account Safety
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {activeTab === 'general' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <header>
                                        <h3 className="text-xl font-bold tracking-tight">General Settings</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Manage your account and interface preferences.</p>
                                    </header>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                                            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs font-medium text-muted-foreground cursor-not-allowed">
                                                {user.email}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-bold">Default Interface</h4>
                                                <p className="text-xs text-muted-foreground">Choose which interface to open by default.</p>
                                            </div>
                                            <div className="flex bg-muted p-1 rounded-xl">
                                                <button
                                                    onClick={() => handleUpdatePreference('preferred_interface', 'proper')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                                        profile?.preferred_interface === 'proper' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                                    )}
                                                >
                                                    PROPER
                                                </button>
                                                <button
                                                    onClick={() => handleUpdatePreference('preferred_interface', 'cockpit')}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                                        profile?.preferred_interface === 'cockpit' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                                                    )}
                                                >
                                                    COCKPIT
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <header>
                                        <h3 className="text-xl font-bold tracking-tight">Appearance</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Customize your Cockpit experience.</p>
                                    </header>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleUpdatePreference('cockpit_theme', 'light')}
                                            className={cn(
                                                "flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                                                profile?.cockpit_theme === 'light' ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-muted-foreground/30"
                                            )}
                                        >
                                            <div className="w-full aspect-video bg-white rounded-lg border border-border overflow-hidden shadow-sm flex items-center justify-center">
                                                <Sun size={24} className="text-amber-500" />
                                            </div>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Light Mode</span>
                                                <div className={cn("w-3 h-3 rounded-full border-2 border-background", profile?.cockpit_theme === 'light' ? "bg-primary" : "bg-white/10")} />
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => handleUpdatePreference('cockpit_theme', 'dark')}
                                            className={cn(
                                                "flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all text-left group",
                                                profile?.cockpit_theme === 'dark' ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-muted-foreground/30"
                                            )}
                                        >
                                            <div className="w-full aspect-video bg-zinc-900 rounded-lg border border-border overflow-hidden shadow-sm flex items-center justify-center">
                                                <Moon size={24} className="text-blue-400" />
                                            </div>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Dark Mode</span>
                                                <div className={cn("w-3 h-3 rounded-full border-2 border-background", profile?.cockpit_theme === 'dark' ? "bg-primary" : "bg-white/10")} />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <header>
                                        <h3 className="text-xl font-bold tracking-tight">Memory & Data</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Control how Rem remembers your interactions.</p>
                                    </header>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                                <div className="text-xl font-black text-primary mb-1">2.4k</div>
                                                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Vector Memories</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                                <div className="text-xl font-black text-secondary mb-1">112</div>
                                                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Shared Facts</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-bold">Long-Term Memory</h4>
                                                <p className="text-[11px] text-muted-foreground max-w-[280px]">Allow Rem to save and recall facts across sessions via R.E.M. Engine.</p>
                                            </div>
                                            <Switch
                                                checked={profile?.enable_memory ?? true}
                                                onCheckedChange={(checked) => handleUpdatePreference('enable_memory', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-bold italic tracking-tight text-primary/80">Show Inner Heart</h4>
                                                <p className="text-[11px] text-muted-foreground max-w-[280px]">Watch Rem's "subconscious" thinking process in real-time.</p>
                                            </div>
                                            <Switch
                                                checked={profile?.enable_thinking ?? false}
                                                onCheckedChange={(checked) => handleUpdatePreference('enable_thinking', checked)}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <Button variant="outline" className="w-full h-11 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10 gap-2 text-xs font-bold leading-none">
                                                <Trash2 size={16} />
                                                Wipe Local Memory
                                            </Button>
                                            <p className="text-[9px] text-center text-muted-foreground/60 mt-3 px-4">
                                                This action clears the short-term context window. Permanent Locket truths and R.E.M. vectors will remain in the cloud.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <header>
                                        <h3 className="text-xl font-bold tracking-tight">Subscription</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Manage your plan and billing details.</p>
                                    </header>

                                    <div className="p-6 rounded-3xl bg-primary/5 border-2 border-primary/20 relative overflow-hidden">
                                        <div className="relative z-10 flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Current Plan</span>
                                                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">Active</span>
                                            </div>
                                            <h4 className="text-3xl font-black italic tracking-tighter text-foreground">
                                                {subscription?.tier.replace('_', ' ').toUpperCase() || 'WANDERER'}
                                            </h4>
                                            <div className="space-y-2 mt-2">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-muted-foreground font-medium">Message Usage</span>
                                                    <span className="text-foreground font-bold">{subscription?.messages_used_this_month || 0} / {subscription?.monthly_message_limit || 'Free'}</span>
                                                </div>
                                                <div className="w-full mt-1">
                                                    <Progress
                                                        value={Math.min(100, ((subscription?.messages_used_this_month || 0) / (subscription?.monthly_message_limit || 100)) * 100)}
                                                        className="h-1.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            className="mt-2 h-11 rounded-xl font-bold text-xs gap-2 shadow-lg shadow-primary/20"
                                            onClick={() => window.location.href = '/upgrade'}
                                        >
                                            <Sparkles size={16} />
                                            Upgrade Plan
                                        </Button>
                                    </div>
                                    <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-primary/10 -rotate-12" />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground font-medium">Remrin Engine v3.0.4-stable</p>
                            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold text-xs">Done</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
