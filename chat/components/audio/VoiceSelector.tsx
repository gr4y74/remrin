"use client";

import { useState, useMemo } from "react";
import { Search, LayoutGrid, List as ListIcon, Star, Filter, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Voice, VoiceProvider } from "@/types/audio";
import { useVoices } from "@/hooks/useVoices";
import { VoicePreview } from "./VoicePreview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VoiceSelectorProps {
    provider?: VoiceProvider;
    value?: string;
    onValueChange?: (voiceId: string) => void;
    className?: string;
}

export function VoiceSelector({
    provider = 'edge',
    value,
    onValueChange,
    className
}: VoiceSelectorProps) {
    const {
        voices,
        isLoading,
        favorites,
        toggleFavorite,
        filters,
        setFilters,
        searchQuery,
        setSearchQuery,
        playPreview,
        currentPlayingId,
        isPlaying
    } = useVoices(provider);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Language options for filter
    const languages = useMemo(() => {
        const langs = new Set(voices.map(v => v.language));
        return Array.from(langs).sort();
    }, [voices]);

    const handleSelect = (voiceId: string) => {
        if (onValueChange) {
            onValueChange(voiceId);
        }
    };

    if (isLoading) {
        return <VoiceSelectorSkeleton viewMode={viewMode} />;
    }

    return (
        <div className={cn("flex flex-col gap-4 w-full h-[600px] bg-rp-surface rounded-lg border border-rp-border overflow-hidden", className)}>
            {/* Header / Controls */}
            <div className="p-4 border-b border-rp-border space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-rp-subtle" />
                        <Input
                            placeholder="Search voices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-rp-overlay border-rp-highlight-low focus-visible:ring-rp-iris"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
                            <TabsList className="bg-rp-overlay text-rp-subtle">
                                <TabsTrigger value="grid" className="data-[state=active]:bg-rp-highlight-low data-[state=active]:text-rp-text">
                                    <LayoutGrid className="size-4" />
                                </TabsTrigger>
                                <TabsTrigger value="list" className="data-[state=active]:bg-rp-highlight-low data-[state=active]:text-rp-text">
                                    <ListIcon className="size-4" />
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        value={filters.language || "_all"}
                        onValueChange={(val) => setFilters({ ...filters, language: val === "_all" ? undefined : val })}
                    >
                        <SelectTrigger className="w-[180px] bg-rp-overlay border-rp-highlight-low text-rp-text">
                            <SelectValue placeholder="All Languages" />
                        </SelectTrigger>
                        <SelectContent className="bg-rp-overlay border-rp-border text-rp-text">
                            <SelectItem value="_all">All Languages</SelectItem>
                            {languages.map(lang => (
                                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.gender || "_all"}
                        onValueChange={(val) => setFilters({ ...filters, gender: val === "_all" ? undefined : val as 'Male' | 'Female' })}
                    >
                        <SelectTrigger className="w-[140px] bg-rp-overlay border-rp-highlight-low text-rp-text">
                            <SelectValue placeholder="All Genders" />
                        </SelectTrigger>
                        <SelectContent className="bg-rp-overlay border-rp-border text-rp-text">
                            <SelectItem value="_all">All Genders</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-rp-subtle uppercase tracking-wider font-medium">
                            {voices.length} Voices
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4 bg-rp-base/50">
                {voices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-rp-subtle">
                        <Info className="size-12 mb-4 opacity-50" />
                        <p>No voices found matching your filters.</p>
                        <Button
                            variant="link"
                            onClick={() => {
                                setFilters({});
                                setSearchQuery('');
                            }}
                            className="text-rp-iris mt-2"
                        >
                            Clear all filters
                        </Button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {voices.map(voice => (
                            <VoiceCard
                                key={voice.id}
                                voice={voice}
                                isSelected={value === voice.id}
                                isFavorite={favorites.includes(voice.id)}
                                isPlaying={isPlaying && currentPlayingId === voice.id}
                                onSelect={() => handleSelect(voice.id)}
                                onToggleFavorite={() => toggleFavorite(voice.id)}
                                onPlay={() => playPreview(voice)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {voices.map(voice => (
                            <VoiceListItem
                                key={voice.id}
                                voice={voice}
                                isSelected={value === voice.id}
                                isFavorite={favorites.includes(voice.id)}
                                isPlaying={isPlaying && currentPlayingId === voice.id}
                                onSelect={() => handleSelect(voice.id)}
                                onToggleFavorite={() => toggleFavorite(voice.id)}
                                onPlay={() => playPreview(voice)}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

function VoiceCard({
    voice,
    isSelected,
    isFavorite,
    isPlaying,
    onSelect,
    onToggleFavorite,
    onPlay
}: {
    voice: Voice,
    isSelected: boolean,
    isFavorite: boolean,
    isPlaying: boolean,
    onSelect: () => void,
    onToggleFavorite: () => void,
    onPlay: () => void
}) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "group relative flex flex-col gap-3 p-3 rounded-xl border border-rp-highlight-low bg-rp-overlay/50 transition-all cursor-pointer hover:border-rp-iris/50 hover:bg-rp-overlay",
                isSelected && "border-rp-iris bg-rp-iris/5 ring-1 ring-rp-iris"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                    <VoicePreview
                        voiceId={voice.id}
                        previewUrl={voice.previewUrl}
                        isPlaying={isPlaying}
                        onPlay={onPlay}
                        onStop={onPlay} // Toggle logic handled in parent or preview
                        className="scale-90"
                    />
                    <div className="flex flex-col">
                        <span className={cn("font-medium text-sm text-rp-text leading-none", isSelected && "text-rp-iris")}>
                            {voice.name}
                        </span>
                        <span className="text-xs text-rp-subtle mt-1">
                            {voice.gender}, {voice.language}
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className={cn(
                        "size-6 text-rp-subtle opacity-0 group-hover:opacity-100 transition-opacity",
                        isFavorite && "opacity-100 text-yellow-400"
                    )}
                >
                    <Star className={cn("size-3.5", isFavorite && "fill-current")} />
                </Button>
            </div>

            <div className="flex flex-wrap gap-1 mt-auto">
                {voice.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px] bg-rp-surface text-rp-subtle border-rp-highlight-low">
                        {tag}
                    </Badge>
                ))}
            </div>

            {isSelected && (
                <div className="absolute top-2 right-2 p-1 bg-rp-iris rounded-full">
                    <Check className="size-3 text-white" />
                </div>
            )}
        </div>
    );
}

function VoiceListItem({
    voice,
    isSelected,
    isFavorite,
    isPlaying,
    onSelect,
    onToggleFavorite,
    onPlay
}: {
    voice: Voice,
    isSelected: boolean,
    isFavorite: boolean,
    isPlaying: boolean,
    onSelect: () => void,
    onToggleFavorite: () => void,
    onPlay: () => void
}) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "group flex items-center gap-4 p-3 rounded-lg border border-transparent bg-rp-overlay/30 transition-all cursor-pointer hover:bg-rp-overlay",
                isSelected && "bg-rp-iris/10 border-rp-iris/30"
            )}
        >
            <VoicePreview
                voiceId={voice.id}
                isPlaying={isPlaying}
                onPlay={onPlay}
                onStop={onPlay}
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn("font-medium text-sm text-rp-text", isSelected && "text-rp-iris")}>
                        {voice.name}
                    </span>
                    {isFavorite && <Star className="size-3 fill-yellow-400 text-yellow-400 text-[10px]" />}
                </div>
                <span className="text-xs text-rp-subtle truncate block">
                    {voice.gender} • {voice.language} {voice.tags && `• ${voice.tags.join(', ')}`}
                </span>
            </div>

            {isSelected && <Check className="size-4 text-rp-iris" />}
        </div>
    );
}

function VoiceSelectorSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
    return (
        <div className="w-full h-[600px] bg-rp-surface rounded-lg border border-rp-border p-4 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1 bg-rp-highlight-low" />
                <Skeleton className="size-10 bg-rp-highlight-low" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-8 w-32 bg-rp-highlight-low" />
                <Skeleton className="h-8 w-32 bg-rp-highlight-low" />
            </div>
            <div className={cn("grid gap-3 pt-4", viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className={cn("bg-rp-highlight-low", viewMode === 'grid' ? "h-32 rounded-xl" : "h-16 rounded-lg")} />
                ))}
            </div>
        </div>
    );
}
