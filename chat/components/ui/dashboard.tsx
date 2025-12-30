"use client"

import { RemrinContext } from "@/context/context"
import { CharacterPanel } from "@/components/character"
import { CanvasPanel } from "@/components/canvas"
import Image from "next/image"
import useHotkey from "@/lib/hooks/use-hotkey"
import { FC, useContext, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"

// Panel widths
export const CANVAS_WIDTH = 450
export const CHARACTER_PANEL_WIDTH = 350

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  const { handleSelectDeviceFile } = useSelectFileHandler()

  const {
    isCanvasOpen,
    setIsCanvasOpen,
    isCharacterPanelOpen,
    setIsCharacterPanelOpen,
    selectedPersona,
    chatBackgroundEnabled,
    activeBackgroundUrl
  } = useContext(RemrinContext)

  const [isDragging, setIsDragging] = useState(false)

  // Hotkeys
  useHotkey("c", () => setIsCanvasOpen(prev => !prev))
  useHotkey("p", () => setIsCharacterPanelOpen(prev => !prev))

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    const file = files[0]
    handleSelectDeviceFile(file)
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

      {/* Full-Width Background Layer */}
      {chatBackgroundEnabled && selectedPersona && (
        <div className="fixed inset-0 z-0">
          {/* Background Image */}
          <Image
            src={activeBackgroundUrl || "/images/rem_bg.jpg"}
            alt="Chat background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-[2px]" />
        </div>
      )}

      {/* Main Content Area - with dynamic right margin for CharacterPanel */}
      <div
        className="flex-1 flex flex-col transition-[margin-right] duration-300"
        style={{ marginRight: isCharacterPanelOpen && selectedPersona ? CHARACTER_PANEL_WIDTH : 0 }}
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="flex-1">
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
    </>
  )
}

