"use client"

import React, { useState, useRef, useMemo } from 'react'
import {
  IconChevronDown,
  IconChevronUp,
  IconSettings,
  IconMessageCircle,
  IconUsers,
  IconMail,
  IconCircleFilled,
  IconArrowRight,
  IconArrowLeft,
  IconBook,
  IconMessage,
  IconPhoto,
  IconDotsVertical,
  IconVolume,
  IconVolumeOff,
  IconSparkles,
  IconBolt,
  IconDownload,
  IconMusic,
  IconMicrophone,
  IconUser
} from '@tabler/icons-react'
import { cn } from "@/lib/utils"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { uploadChatBackground, getChatBackgroundFromStorage } from "@/db/storage/chat-backgrounds"
import { toast } from "sonner"
import { WithTooltip } from "@/components/ui/with-tooltip"
import { UnifiedMediaPlayer, AudioTrack } from "@/components/audio/UnifiedMediaPlayer"


interface MiniProfileProps {
  personaId?: string
  personaName?: string
  personaImage?: string
  description?: string
  creatorName?: string
  stats?: {
    chats?: number
    followers?: number
    messages?: string | number
  }
  traits?: Array<{
    emoji: string
    title: string
    subtitle: string
  }>
  onViewProfile?: () => void
  onSettings?: () => void
  onBack?: () => void
  moodState?: {
    mood: string
    emoji: string
    battery: number
  }
  isVisualNovelMode?: boolean
  onToggleVisualNovel?: () => void
  profile?: any // For background upload
  setChatBackgroundEnabled?: (enabled: boolean) => void
  setActiveBackgroundUrl?: (url: string) => void
  welcomeAudioUrl?: string | null
  backgroundMusicUrl?: string | null
  audioTracks?: AudioTrack[]
  // New personalization props
  onPersonalize?: (tab?: string) => void
  isGlobalMuted?: boolean
  onToggleMute?: () => void
  onSparkOfLife?: () => void
  isSparking?: boolean
  onChangeHeroImage?: () => void
  isOwner?: boolean
  hasVideo?: boolean
}

export const MiniProfile: React.FC<MiniProfileProps> = ({
  personaId,
  personaName = "Persona",
  personaImage,
  description,
  creatorName = "System",
  stats = { chats: 0, followers: 0, messages: "∞" },
  traits = [
    { emoji: "💬", title: "Available for chat", subtitle: "Ready to assist you" },
    { emoji: "🌸", title: "Loyal companion", subtitle: "Always at your service" }
  ],
  onViewProfile,
  onSettings,
  onBack,
  moodState,
  isVisualNovelMode = false,
  onToggleVisualNovel,
  profile,
  setChatBackgroundEnabled,
  setActiveBackgroundUrl,
  welcomeAudioUrl,
  backgroundMusicUrl,
  audioTracks,
  onPersonalize,
  isGlobalMuted = false,
  onToggleMute,
  onSparkOfLife,
  isSparking = false,
  onChangeHeroImage,
  isOwner = false,
  hasVideo = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Derived tracks if none provided (for backward compatibility)
  const tracks = useMemo(() => {
    if (audioTracks && audioTracks.length > 0) return audioTracks;

    const derived: AudioTrack[] = [];
    if (welcomeAudioUrl) {
      derived.push({
        id: 'welcome',
        name: `${personaName}'s Greeting`,
        url: welcomeAudioUrl,
        type: 'welcome'
      });
    }
    if (backgroundMusicUrl) {
      derived.push({
        id: 'ambient',
        name: `${personaName}'s Atmosphere`,
        url: backgroundMusicUrl,
        type: 'music'
      });
    }
    return derived;
  }, [audioTracks, welcomeAudioUrl, backgroundMusicUrl, personaName]);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !profile || !setActiveBackgroundUrl || !setChatBackgroundEnabled) return
    const file = e.target.files[0]

    const loadingToast = toast.loading("Uploading background...")

    try {
      const path = `${profile.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const uploadedPath = await uploadChatBackground(path, file)
      const url = await getChatBackgroundFromStorage(uploadedPath)

      setActiveBackgroundUrl(url)
      setChatBackgroundEnabled(true)

      toast.success("Background updated!", { id: loadingToast })
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error(error.message || "Failed to upload background", { id: loadingToast })
    }
  }

  const handleDownloadSoul = () => {
    if (!personaId) return
    window.location.href = `/api/v2/persona/${personaId}/export`
    toast.success("Downloading Soul...")
  }

  return (
    <div className="w-full border-b border-rp-overlay/50 bg-rp-surface/30 backdrop-blur-sm transition-all overflow-hidden z-50 rounded-2xl mx-4 my-2">
      {/* Collapsed State Header / Toggle Area */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-white hover:text-white/80 transition-colors"
              title="Back"
            >
              <IconArrowLeft size={20} />
            </button>

          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative group transition-transform active:scale-95"
            title={isExpanded ? "Hide character profile" : "View character profile"}
          >
            <div className="relative size-11 overflow-hidden rounded-full ring-2 ring-rp-highlight-med group-hover:ring-rp-iris">
              {personaImage ? (
                <Image
                  src={personaImage || "/images/mother/mother_avatar.png"}
                  alt={personaName}
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rp-iris/20 to-rp-love/20 flex items-center justify-center">
                  <span className="text-rp-text font-bold text-sm">{personaName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-rp-base rounded-full p-0.5">
              <div className="size-full bg-rp-love rounded-full animate-pulse shadow-[0_0_8px_rgba(235,111,146,0.5)]" />
            </div>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-rp-text font-bold font-tiempos-headline text-lg leading-tight">{personaName}</h3>
              {!isExpanded && (
                <div className="flex items-center gap-1 text-[10px] text-rp-love uppercase tracking-wider font-extrabold">
                  <IconCircleFilled size={6} className="animate-pulse" />
                  <span>Live</span>
                </div>
              )}
            </div>
            {isExpanded ? (
              <p className="text-rp-muted text-[10px]">Created by @{creatorName}</p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white text-[10px]">@{creatorName}</p>

              </div>
            )}
          </div>
        </div>

        {/* Right Actions Wrapper */}
        <div className="flex items-center gap-2">
          {/* Unified Media Player (Collapsed) */}
          {tracks.length > 0 && !isExpanded && (
            <div className="mr-1">
              <UnifiedMediaPlayer
                tracks={tracks}
                className="[&_button]:size-8 [&_button]:bg-transparent [&_button]:border-white/10 [&_button:hover]:bg-white/10 [&_svg]:size-3.5"
                compact
              />
            </div>
          )}

          {/* Mood (Visible when collapsed) - No pill, just emoji + battery */}
          {!isExpanded && moodState && (
            <div className="flex items-center gap-2 mr-1">
              <WithTooltip
                display={
                  <div className="p-2 max-w-xs">
                    <p className="font-bold mb-1">Soul Mood: {moodState.mood}</p>
                    <p className="text-xs text-rp-subtle">
                      The mood icons reflect the current emotional state and energy level of the Soul.
                      High battery means the Soul is alert and engaged, while low battery may lead to shorter or more distant responses.
                    </p>
                  </div>
                }
                trigger={
                  <div className="flex items-center gap-2 cursor-help">
                    <span className="text-lg leading-none">{moodState.emoji}</span>
                    <div className="w-8 h-1.5 bg-rp-surface/50 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          moodState.battery > 70 ? "bg-rp-iris" :
                            moodState.battery > 30 ? "bg-rp-gold" : "bg-rp-love"
                        )}
                        style={{ width: `${moodState.battery}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>
                }
              />
            </div>
          )}


          {/* VN Toggle - Icon only, no pill */}
          {!isExpanded && onToggleVisualNovel && (
            <button
              onClick={onToggleVisualNovel}
              className="p-2 text-white hover:text-white/80 transition-colors"
              title={isVisualNovelMode ? "Switch to Classic Mode" : "Switch to Visual Novel Mode"}
            >
              {isVisualNovelMode ? <IconMessage size={18} /> : <IconBook size={18} />}
            </button>
          )}


          {/* Details Toggle - Icon only */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-white hover:text-white/80 transition-colors"
            title={isExpanded ? 'Hide Details' : 'Show Details'}
          >
            {isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </button>


          {/* Quick Settings Dropdown - Icon only */}
          <div className="relative">
            <label htmlFor="background-upload-chat" className="sr-only">Upload Chat Background</label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              id="background-upload-chat"
              onChange={handleBackgroundUpload}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white hover:text-white/80 transition-colors" title="Chat Settings">
                  <IconDotsVertical size={18} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-rp-surface border-rp-overlay shadow-2xl p-1.5">
                {/* Mute Audio Toggle */}
                <DropdownMenuItem
                  className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5 rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleMute?.();
                  }}
                >
                  {isGlobalMuted ? <IconVolumeOff size={18} className="mr-2 text-red-400" /> : <IconVolume size={18} className="mr-2 text-emerald-400" />}
                  <div className="flex flex-1 items-center justify-between">
                    <span>{isGlobalMuted ? "Unmute Audio" : "Mute Audio"}</span>
                    <div className={cn(
                      "w-8 h-4 rounded-full p-0.5 transition-colors relative ml-2",
                      isGlobalMuted ? "bg-rp-muted/30" : "bg-rp-iris"
                    )}>
                      <div className={cn(
                        "size-3 bg-white rounded-full shadow-sm transition-transform",
                        isGlobalMuted ? "translate-x-0" : "translate-x-4"
                      )} />
                    </div>
                  </div>
                </DropdownMenuItem>

                {/* Personalize Button */}
                <DropdownMenuItem
                  className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5 rounded-lg"
                  onClick={() => onPersonalize?.()}
                >
                  <IconSparkles size={18} className="mr-2 text-rp-foam" />
                  <div className="flex flex-1 items-center justify-between">
                    <span>Personalize</span>
                    <span className="text-[9px] bg-rp-foam/20 text-rp-foam px-1.5 py-0.5 rounded font-bold">NEW</span>
                  </div>
                </DropdownMenuItem>

                {/* Download Soul Button */}
                <DropdownMenuItem
                  className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5 rounded-lg"
                  onClick={handleDownloadSoul}
                >
                  <IconDownload size={18} className="mr-2 text-rp-iris" />
                  <span>Download Soul</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-rp-highlight-low/10 my-1" />

                {/* Change Background (Always available) */}
                <DropdownMenuItem
                  className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5 rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconPhoto size={18} className="mr-2 text-rp-love" />
                  Change Background
                </DropdownMenuItem>

                {/* Owner Only Actions */}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator className="bg-rp-highlight-low/10 my-1" />

                    {/* Spark of Life */}
                    {!hasVideo && (
                      <DropdownMenuItem
                        className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5 rounded-lg"
                        onClick={onSparkOfLife}
                        disabled={isSparking}
                      >
                        <IconBolt size={18} className={cn("mr-2", isSparking ? "animate-spin text-rp-rose" : "text-rp-rose")} />
                        <div className="flex flex-1 items-center justify-between">
                          <span>Spark of Life</span>
                          <span className="text-[9px] bg-rp-rose/20 text-rp-rose px-1.5 py-0.5 rounded font-bold">50 A</span>
                        </div>
                      </DropdownMenuItem>
                    )}

                    {/* Change Hero Image */}
                    <DropdownMenuItem
                      className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5 rounded-lg"
                      onClick={onChangeHeroImage}
                    >
                      <IconPhoto size={18} className="mr-2 text-emerald-400" />
                      Change Hero Portrait
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Expanded Content Area */}
      <div className={cn(
        "transition-all duration-300 ease-in-out px-4",
        isExpanded ? "max-h-[600px] opacity-100 pb-5" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <div className="pt-5 border-t border-rp-highlight-low/10 flex flex-col md:flex-row gap-8">
          {/* Large Representative Image / Portrait - Increased size */}
          <div className="hidden md:block relative shrink-0">
            <div className="size-40 rounded-3xl overflow-hidden ring-1 ring-rp-highlight-med/50 shadow-2xl group relative">
              {personaImage ? (
                <Image
                  src={personaImage || "/images/mother/mother_avatar.png"}
                  alt={personaName}
                  fill
                  sizes="160px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-rp-overlay/50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-rp-base/60 to-transparent" />
            </div>
          </div>

          {/* Stats & Traits */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stats & Bio */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-rp-iris/20 backdrop-blur-md border border-rp-iris/30 text-white px-4 py-2 rounded-2xl shadow-lg">
                    <IconMessageCircle size={16} />
                    <span className="text-sm font-black">{stats.chats}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Chats</span>
                  </div>
                  <div className="flex items-center gap-2 bg-rp-love/20 backdrop-blur-md border border-rp-love/30 text-white px-4 py-2 rounded-2xl shadow-lg">
                    <IconUsers size={16} />
                    <span className="text-sm font-black">{stats.followers}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Follows</span>
                  </div>
                </div>

                {description && (
                  <div className="bg-rp-overlay/10 rounded-2xl p-4 border border-rp-highlight-low/10">
                    <p className="text-rp-subtle text-xs leading-relaxed italic line-clamp-4">
                      {`"${description}"`}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Settings - Interactive Links replaces Traits */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rp-overlay/10 border border-rp-highlight-low/10 hover:bg-rp-overlay/20 hover:border-rp-iris/30 transition-all group"
                  title="Change Chat Background"
                >
                  <div className="size-8 rounded-full bg-rp-iris/10 flex items-center justify-center group-hover:bg-rp-iris/20 transition-colors">
                    <IconPhoto size={18} className="text-rp-iris" />
                  </div>
                  <span className="text-[10px] font-bold text-rp-text uppercase tracking-widest">Background</span>
                </button>

                <button
                  onClick={() => onPersonalize?.('voice')}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rp-overlay/10 border border-rp-highlight-low/10 hover:bg-rp-overlay/20 hover:border-rp-iris/30 transition-all group"
                  title="Change Welcome Message"
                >
                  <div className="size-8 rounded-full bg-rp-pine/10 flex items-center justify-center group-hover:bg-rp-pine/20 transition-colors">
                    <IconMicrophone size={18} className="text-rp-pine" />
                  </div>
                  <span className="text-[10px] font-bold text-rp-text uppercase tracking-widest">Welcome</span>
                </button>

                <button
                  onClick={() => onPersonalize?.('music')}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rp-overlay/10 border border-rp-highlight-low/10 hover:bg-rp-overlay/20 hover:border-rp-iris/30 transition-all group"
                  title="Change Background Music"
                >
                  <div className="size-8 rounded-full bg-rp-gold/10 flex items-center justify-center group-hover:bg-rp-gold/20 transition-colors">
                    <IconMusic size={18} className="text-rp-gold" />
                  </div>
                  <span className="text-[10px] font-bold text-rp-text uppercase tracking-widest">Music</span>
                </button>

                <button
                  onClick={() => onChangeHeroImage?.()}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rp-overlay/10 border border-rp-highlight-low/10 hover:bg-rp-overlay/20 hover:border-rp-iris/30 transition-all group"
                  title="Change Hero Image"
                >
                  <div className="size-8 rounded-full bg-rp-foam/10 flex items-center justify-center group-hover:bg-rp-foam/20 transition-colors">
                    <IconUser size={18} className="text-rp-foam" />
                  </div>
                  <span className="text-[10px] font-bold text-rp-text uppercase tracking-widest">Hero Image</span>
                </button>

                <button
                  onClick={() => onPersonalize?.('preferences')}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-rp-overlay/10 border border-rp-highlight-low/10 hover:bg-rp-overlay/20 hover:border-rp-iris/30 transition-all group"
                  title="Character Preferences"
                >
                  <div className="size-8 rounded-full bg-rp-love/10 flex items-center justify-center group-hover:bg-rp-love/20 transition-colors">
                    <IconSettings size={18} className="text-rp-love" />
                  </div>
                  <span className="text-[10px] font-bold text-rp-text uppercase tracking-widest">Prefs</span>
                </button>
              </div>

              {/* Audio Station (Expanded View) */}
              {tracks.length > 0 && (
                <div className="bg-rp-base/20 rounded-2xl p-4 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                      <IconMusic size={14} className="text-rp-iris" />
                      Audio Station
                    </h5>
                    <button
                      onClick={() => onPersonalize?.('music')}
                      className="text-[9px] font-bold text-rp-iris hover:text-rp-foam transition-colors uppercase tracking-widest"
                    >
                      Manage Tracks
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="size-8 rounded-full bg-rp-base/40 flex items-center justify-center shrink-0">
                            {track.type === 'welcome' ? <IconMicrophone size={14} className="text-rp-pine" /> : <IconMusic size={14} className="text-rp-gold" />}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[11px] font-bold text-rp-text truncate">{track.name}</span>
                            <span className="text-[8px] text-rp-muted uppercase tracking-tighter">{track.type}</span>
                          </div>
                        </div>
                        <UnifiedMediaPlayer
                          tracks={[track]}
                          compact
                          className="bg-transparent backdrop-blur-none border-none p-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onViewProfile}
                className="flex-[1.5] flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-rp-iris/20 backdrop-blur-md border border-rp-iris/30 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rp-iris/30 hover:shadow-[0_0_20px_rgba(196,167,231,0.3)] transition-all active:scale-95 group"
              >
                Launch Soul Bio
                <IconArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onPersonalize?.()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-rp-foam/20 backdrop-blur-md border border-rp-foam/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rp-foam/30 transition-all active:scale-95 group"
              >
                <IconSparkles size={16} className="text-rp-foam animate-pulse" />
                <span>Personalize</span>
              </button>

              {/* VN Mode Toggle in Expanded View - Matches stats styling */}
              <button
                onClick={onToggleVisualNovel}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rp-base/20 backdrop-blur-md border border-white/10 text-white hover:bg-rp-base/30 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg"
                title={isVisualNovelMode ? "Classic" : "V.Novel"}
              >
                {isVisualNovelMode ? <IconMessage size={16} /> : <IconBook size={16} />}
                <span>{isVisualNovelMode ? "Classic" : "V.Novel"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}