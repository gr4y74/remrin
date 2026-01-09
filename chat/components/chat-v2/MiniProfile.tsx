"use client"

import React, { useState, useRef } from 'react'
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
  IconDotsVertical
} from '@tabler/icons-react'
import { cn } from "@/lib/utils"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { uploadChatBackground, getChatBackgroundFromStorage } from "@/db/storage/chat-backgrounds"
import { toast } from "sonner"
import { WithTooltip } from "@/components/ui/with-tooltip"
import { WelcomeAudioPlayer } from "@/components/audio/WelcomeAudioPlayer"


interface MiniProfileProps {
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
}

export const MiniProfile: React.FC<MiniProfileProps> = ({
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
  welcomeAudioUrl
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="w-full border-b border-rp-overlay/50 bg-rp-surface/30 backdrop-blur-sm transition-all overflow-hidden z-50 rounded-2xl mx-4 my-2">
      {/* Collapsed State Header / Toggle Area */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-white hover:text-white/80 transition-colors"
            >
              <IconArrowLeft size={20} />
            </button>

          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative group transition-transform active:scale-95"
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
          {/* Welcome Audio Player */}
          {welcomeAudioUrl && !isExpanded && (
            <div className="mr-1">
              <WelcomeAudioPlayer
                audioUrl={welcomeAudioUrl}
                autoPlay={true}
                className="[&_button]:size-8 [&_button]:bg-transparent [&_button]:border-white/10 [&_button:hover]:bg-white/10 [&_svg]:size-3.5"
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
                        style={{ width: `${moodState.battery}%` }}
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
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleBackgroundUpload}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white hover:text-white/80 transition-colors">
                  <IconDotsVertical size={18} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48 bg-rp-surface border-rp-overlay shadow-2xl">
                <DropdownMenuItem
                  className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5"
                  onClick={onSettings}
                >
                  <IconSettings size={18} className="mr-2" />
                  Chat Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-rp-highlight-low/20" />
                <DropdownMenuItem
                  className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer py-2.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconPhoto size={18} className="mr-2" />
                  Change Background
                </DropdownMenuItem>
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

              {/* Traits - Simplified, no pills */}
              <div className="flex items-center gap-4">
                {traits.map((trait, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xl">{trait.emoji}</span>
                    <span className="text-rp-text text-xs font-medium">{trait.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={onViewProfile}
                className="flex-1 flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-rp-iris/20 backdrop-blur-md border border-rp-iris/30 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rp-iris/30 hover:shadow-[0_0_20px_rgba(196,167,231,0.3)] transition-all active:scale-95 group"
              >
                Launch Soul Bio
                <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>

              {/* VN Mode Toggle in Expanded View - Matches stats styling */}
              <button
                onClick={onToggleVisualNovel}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rp-base/20 backdrop-blur-md border border-white/10 text-white hover:bg-rp-base/30 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg"
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