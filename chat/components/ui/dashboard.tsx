"use client"

import { RemrinContext } from "@/context/context"
import { CharacterPanel } from "@/components/character"
import { CanvasPanel } from "@/components/canvas"
import Image from "next/image"
import useHotkey from "@/lib/hooks/use-hotkey"
import { MOTHER_OF_SOULS_ID } from "@/lib/forge/is-mother-chat"
import { FC, useContext, useState, useEffect } from "react"
// import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"
import { NotificationsSidebar } from "@/components/notifications/NotificationsSidebar"
import { createClient } from "@/lib/supabase/client"

// Panel widths
export const CANVAS_WIDTH = 450
export const CHARACTER_PANEL_WIDTH = 350

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  // const { handleSelectDeviceFile } = useSelectFileHandler()

  const {
    isCanvasOpen,
    setIsCanvasOpen,
    isCharacterPanelOpen,
    setIsCharacterPanelOpen,
    selectedPersona,
    chatBackgroundEnabled,
    activeBackgroundUrl,
    isNotificationsOpen,
    setIsNotificationsOpen
  } = useContext(RemrinContext)

  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const [isDragging, setIsDragging] = useState(false)

  // Hotkeys
  useHotkey("c", () => setIsCanvasOpen(prev => !prev))
  useHotkey("p", () => setIsCharacterPanelOpen(prev => !prev))

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    // const files = event.dataTransfer.files
    // const file = files[0]
    // handleSelectDeviceFile(file)
    setIsDragging(false)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <>
      <CommandK />

      {/* Ambient Orbs Background - appears on all pages */}
      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
        <div className="absolute right-[-10%] top-[-10%] size-[600px] rounded-full bg-rp-iris/10 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-10%] size-[500px] rounded-full bg-rp-rose/10 blur-[100px]" />
      </div>

      {/* Full-Width Background Layer */}
      {selectedPersona?.id === MOTHER_OF_SOULS_ID ? (
        <div className="absolute inset-0 z-0 transform-gpu overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="size-full object-cover opacity-40 transition-opacity duration-1000 will-change-transform"
          >
            <source src="/videos/mother_bg.mp4" type="video/mp4" />
          </video>
          {/* Overlay for readability - Lightened for better vibrancy */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        </div>
      ) : chatBackgroundEnabled && selectedPersona && activeBackgroundUrl ? (
        <div className="fixed inset-0 z-0 transform-gpu">
          {/* Background Image */}
          <Image
            src={activeBackgroundUrl}
            alt="Chat background"
            fill
            sizes="100vw"
            className="opacity-100 object-cover transition-opacity duration-1000 will-change-opacity"
            priority
          />
          {/* Overlay for readability - Lightened for better vibrancy */}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : null}

      {/* Main Content Area - with dynamic right margin for CharacterPanel */}
      <div
        className="flex h-full flex-1 flex-col transition-[margin-right] duration-300"
        style={{ marginRight: isCharacterPanelOpen && selectedPersona ? CHARACTER_PANEL_WIDTH : 0 }}
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="h-full flex-1">
          {isDragging ? (
            <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
              drop file here
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Canvas/Artifacts Panel (conditional) */}
      <CanvasPanel width={CANVAS_WIDTH} />

      {/* Character Panel (conditional) */}
      <CharacterPanel width={CHARACTER_PANEL_WIDTH} />

      {/* Notifications Sidebar (conditional) */}
      {userId && (
        <NotificationsSidebar
          userId={userId}
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}
    </>
  )
}

