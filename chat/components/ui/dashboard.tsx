"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { ChatbotUIContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import { CharacterPanel } from "@/components/character"
import { CanvasPanel } from "@/components/canvas"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useContext, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"

// Panel widths
export const ICON_SIDEBAR_WIDTH = 60
export const SIDEBAR_WIDTH = 280
export const CANVAS_WIDTH = 450
export const CHARACTER_PANEL_WIDTH = 350

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabValue = searchParams.get("tab") || "chats"

  const { handleSelectDeviceFile } = useSelectFileHandler()

  const {
    isSidebarExpanded,
    setIsSidebarExpanded,
    isCanvasOpen,
    setIsCanvasOpen,
    isCharacterPanelOpen,
    setIsCharacterPanelOpen,
    artifacts,
    selectedPersona
  } = useContext(ChatbotUIContext)

  const [contentType, setContentType] = useState<ContentType>(
    tabValue as ContentType
  )
  const [isDragging, setIsDragging] = useState(false)

  // Hotkeys
  useHotkey("s", () => setIsSidebarExpanded(prev => !prev))
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

  const handleToggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev)
  }

  return (
    <div className="flex size-full overflow-hidden">
      <CommandK />

      {/* Panel 1: Icon Sidebar + Expandable Sidebar */}
      <div
        className={cn(
          "flex h-full shrink-0 transition-all duration-200 ease-out"
        )}
        style={{
          width: isSidebarExpanded
            ? `${ICON_SIDEBAR_WIDTH + SIDEBAR_WIDTH}px`
            : `${ICON_SIDEBAR_WIDTH}px`
        }}
      >
        {/* Icon Strip (always visible) */}
        <div
          className="flex h-full flex-col border-r border-border/50 bg-rp-base"
          style={{ width: `${ICON_SIDEBAR_WIDTH}px` }}
        >
          <Tabs
            className="flex h-full flex-col"
            value={contentType}
            onValueChange={tabValue => {
              setContentType(tabValue as ContentType)
              router.replace(`${pathname}?tab=${tabValue}`)
              // Auto-expand sidebar when clicking a tab
              if (!isSidebarExpanded) {
                setIsSidebarExpanded(true)
              }
            }}
          >
            <SidebarSwitcher onContentTypeChange={setContentType} />
          </Tabs>
        </div>

        {/* Expandable Sidebar Content */}
        <div
          className={cn(
            "relative h-full overflow-hidden bg-rp-surface transition-all duration-200 ease-out",
            isSidebarExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{
            width: isSidebarExpanded ? `${SIDEBAR_WIDTH}px` : "0px"
          }}
        >
          {/* Expand/Collapse chevron on right edge */}
          <button
            onClick={handleToggleSidebar}
            className="absolute -right-4 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-rp-overlay border border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text transition-colors"
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <IconChevronCompactRight size={16} className={isSidebarExpanded ? "rotate-180" : ""} />
          </button>

          <Tabs
            className="flex h-full"
            value={contentType}
            onValueChange={tabValue => {
              setContentType(tabValue as ContentType)
              router.replace(`${pathname}?tab=${tabValue}`)
            }}
          >
            <Sidebar contentType={contentType} showSidebar={isSidebarExpanded} />
          </Tabs>
        </div>
      </div>

      {/* Panel 2: Main Chat Area */}
      <div
        className="relative flex min-w-0 flex-1 flex-col bg-background"
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {isDragging ? (
          <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
            drop file here
          </div>
        ) : (
          children
        )}

        {/* Sidebar Toggle Button */}
        <Button
          className={cn(
            "absolute left-2 top-1/2 z-10 size-8 -translate-y-1/2 cursor-pointer transition-transform duration-200"
          )}
          style={{
            transform: isSidebarExpanded
              ? "translateY(-50%) rotate(180deg)"
              : "translateY(-50%) rotate(0deg)"
          }}
          variant="ghost"
          size="icon"
          onClick={handleToggleSidebar}
        >
          <IconChevronCompactRight size={24} />
        </Button>
      </div>

      {/* Panel 3: Canvas/Artifacts (conditional) */}
      <CanvasPanel width={CANVAS_WIDTH} />

      {/* Panel 4: Character Panel (conditional) */}
      <CharacterPanel width={CHARACTER_PANEL_WIDTH} />
    </div>
  )
}

