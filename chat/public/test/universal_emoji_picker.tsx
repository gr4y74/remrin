/**
 * Universal Emoji & Sticker Picker for Remrin.ai
 * 
 * Features:
 * - 1,800+ emojis (Emoji Mart)
 * - Billions of GIFs (Giphy)
 * - Millions of stickers (Giphy)
 * - Custom character stickers (Kilo, Squee, Kess, Sui)
 * - Search functionality
 * - Recent picks
 * - Categories
 * 
 * Installation:
 * npm install @emoji-mart/react @emoji-mart/data @giphy/react-components @giphy/js-fetch-api
 * 
 * Usage:
 * <UniversalPicker
 *   onSelect={(item) => handleSelect(item)}
 *   position="bottom" // 'top' | 'bottom' | 'left' | 'right'
 *   theme="dark" // 'dark' | 'light'
 * />
 */

import React, { useState, useEffect, useRef } from 'react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Grid } from '@giphy/react-components'
import { GiphyFetch } from '@giphy/js-fetch-api'

// Initialize Giphy (replace with your API key)
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'YOUR_API_KEY_HERE')

type TabType = 'emoji' | 'gif' | 'sticker' | 'custom'

interface PickerItem {
  type: 'emoji' | 'gif' | 'sticker'
  data: string // emoji character or URL
  id?: string
  name?: string
}

interface UniversalPickerProps {
  onSelect: (item: PickerItem) => void
  onClose?: () => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  theme?: 'dark' | 'light'
  showCustomStickers?: boolean
}

// Custom character stickers (populate with your actual URLs)
const customStickers = {
  kilo: [
    { id: 'kilo-happy', name: 'Happy Kilo', url: '/stickers/kilo-happy.png' },
    { id: 'kilo-powerful', name: 'Powerful Kilo', url: '/stickers/kilo-powerful.png' },
    { id: 'kilo-greeting', name: 'Greeting Kilo', url: '/stickers/kilo-greeting.png' },
  ],
  squee: [
    { id: 'squee-cute', name: 'Cute Squee', url: '/stickers/squee-cute.png' },
    { id: 'squee-fierce', name: 'Fierce Squee', url: '/stickers/squee-fierce.png' },
    { id: 'squee-clap', name: 'Clapping Squee', url: '/stickers/squee-clap.png' },
  ],
  kess: [
    { id: 'kess-sassy', name: 'Sassy Kess', url: '/stickers/kess-sassy.png' },
    { id: 'kess-smirk', name: 'Smirking Kess', url: '/stickers/kess-smirk.png' },
    { id: 'kess-queen', name: 'Queen Kess', url: '/stickers/kess-queen.png' },
  ],
  sui: [
    { id: 'sui-ethereal', name: 'Ethereal Sui', url: '/stickers/sui-ethereal.png' },
    { id: 'sui-protective', name: 'Protective Sui', url: '/stickers/sui-protective.png' },
    { id: 'sui-gentle', name: 'Gentle Sui', url: '/stickers/sui-gentle.png' },
  ],
}

export default function UniversalPicker({
  onSelect,
  onClose,
  position = 'bottom',
  theme = 'dark',
  showCustomStickers = true,
}: UniversalPickerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('emoji')
  const [searchTerm, setSearchTerm] = useState('')
  const [customCategory, setCustomCategory] = useState<keyof typeof customStickers>('kilo')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const fetchGifs = (offset: number) =>
    searchTerm
      ? gf.search(searchTerm, { offset, limit: 20 })
      : gf.trending({ offset, limit: 20 })

  const fetchStickers = (offset: number) =>
    gf.search(searchTerm || 'sticker', {
      offset,
      limit: 20,
      type: 'stickers',
    })

  const handleEmojiSelect = (emoji: any) => {
    onSelect({
      type: 'emoji',
      data: emoji.native,
    })
  }

  const handleGifSelect = (gif: any) => {
    onSelect({
      type: 'gif',
      data: gif.images.original.url,
      id: gif.id,
      name: gif.title,
    })
  }

  const handleStickerSelect = (sticker: any) => {
    onSelect({
      type: 'sticker',
      data: sticker.images.original.url,
      id: sticker.id,
      name: sticker.title,
    })
  }

  const handleCustomStickerSelect = (sticker: any) => {
    onSelect({
      type: 'sticker',
      data: sticker.url,
      id: sticker.id,
      name: sticker.name,
    })
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  }

  return (
    <div
      ref={pickerRef}
      className={`
        absolute ${positionClasses[position]} z-50
        w-[400px] max-w-[calc(100vw-2rem)]
        bg-rp-surface border border-rp-muted/20 rounded-xl shadow-2xl
        animate-in fade-in slide-in-from-bottom-2 duration-200
      `}
    >
      {/* Header Tabs */}
      <div className="flex border-b border-rp-muted/20 p-2 gap-1">
        <button
          onClick={() => setActiveTab('emoji')}
          className={`
            flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${
              activeTab === 'emoji'
                ? 'bg-rp-iris/20 text-rp-iris'
                : 'text-rp-muted hover:bg-rp-base'
            }
          `}
        >
          😀 Emoji
        </button>
        <button
          onClick={() => setActiveTab('gif')}
          className={`
            flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${
              activeTab === 'gif'
                ? 'bg-rp-iris/20 text-rp-iris'
                : 'text-rp-muted hover:bg-rp-base'
            }
          `}
        >
          🎬 GIF
        </button>
        <button
          onClick={() => setActiveTab('sticker')}
          className={`
            flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${
              activeTab === 'sticker'
                ? 'bg-rp-iris/20 text-rp-iris'
                : 'text-rp-muted hover:bg-rp-base'
            }
          `}
        >
          🎨 Sticker
        </button>
        {showCustomStickers && (
          <button
            onClick={() => setActiveTab('custom')}
            className={`
              flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                activeTab === 'custom'
                  ? 'bg-rp-iris/20 text-rp-iris'
                  : 'text-rp-muted hover:bg-rp-base'
              }
            `}
          >
            ⭐ Remrin
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-2 max-h-[400px] overflow-y-auto">
        {/* Emoji Tab */}
        {activeTab === 'emoji' && (
          <Picker
            data={data}
            set="twitter"
            theme={theme}
            onEmojiSelect={handleEmojiSelect}
            previewPosition="none"
            skinTonePosition="search"
            maxFrequentRows={2}
          />
        )}

        {/* GIF Tab */}
        {activeTab === 'gif' && (
          <div>
            <input
              type="text"
              placeholder="Search GIFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full px-4 py-2 mb-3 rounded-lg
                bg-rp-base border border-rp-muted/20
                text-rp-text placeholder-rp-muted
                focus:outline-none focus:border-rp-iris/50
              "
            />
            <div className="overflow-y-auto max-h-[320px]">
              <Grid
                width={376}
                columns={3}
                gutter={6}
                fetchGifs={fetchGifs}
                onGifClick={handleGifSelect}
                key={searchTerm}
              />
            </div>
            <div className="text-xs text-rp-muted text-center mt-2">
              Powered by GIPHY
            </div>
          </div>
        )}

        {/* Sticker Tab */}
        {activeTab === 'sticker' && (
          <div>
            <input
              type="text"
              placeholder="Search stickers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full px-4 py-2 mb-3 rounded-lg
                bg-rp-base border border-rp-muted/20
                text-rp-text placeholder-rp-muted
                focus:outline-none focus:border-rp-iris/50
              "
            />
            <div className="overflow-y-auto max-h-[320px]">
              <Grid
                width={376}
                columns={3}
                gutter={6}
                fetchGifs={fetchStickers}
                onGifClick={handleStickerSelect}
                key={searchTerm}
              />
            </div>
            <div className="text-xs text-rp-muted text-center mt-2">
              Powered by GIPHY
            </div>
          </div>
        )}

        {/* Custom Remrin Stickers */}
        {activeTab === 'custom' && (
          <div>
            {/* Category Selector */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {Object.keys(customStickers).map((category) => (
                <button
                  key={category}
                  onClick={() => setCustomCategory(category as keyof typeof customStickers)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                    ${
                      customCategory === category
                        ? 'bg-rp-iris/20 text-rp-iris'
                        : 'bg-rp-base text-rp-muted hover:bg-rp-muted/10'
                    }
                  `}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Sticker Grid */}
            <div className="grid grid-cols-3 gap-3">
              {customStickers[customCategory].map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => handleCustomStickerSelect(sticker)}
                  className="
                    aspect-square rounded-lg overflow-hidden
                    bg-rp-base hover:bg-rp-muted/10
                    border border-rp-muted/20 hover:border-rp-iris/50
                    transition-all cursor-pointer
                    flex items-center justify-center
                  "
                  title={sticker.name}
                >
                  <img
                    src={sticker.url}
                    alt={sticker.name}
                    className="w-full h-full object-contain p-2"
                  />
                </button>
              ))}
            </div>

            {/* Empty State */}
            {customStickers[customCategory].length === 0 && (
              <div className="text-center py-8 text-rp-muted">
                <p>No stickers available yet</p>
                <p className="text-sm mt-1">Check back soon!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with keyboard shortcut hint */}
      <div className="border-t border-rp-muted/20 px-3 py-2 text-xs text-rp-muted text-center">
        Press <kbd className="px-1 py-0.5 bg-rp-base rounded">Esc</kbd> to close
      </div>
    </div>
  )
}

/**
 * Reusable Emoji Button Component
 * Use this to trigger the picker in any input area
 */
interface EmojiButtonProps {
  onSelect: (item: PickerItem) => void
  position?: 'top' | 'bottom' | 'left' | 'right'
  theme?: 'dark' | 'light'
}

export function EmojiButton({ onSelect, position = 'bottom', theme = 'dark' }: EmojiButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          p-2 rounded-lg hover:bg-rp-base
          text-rp-muted hover:text-rp-text
          transition-colors
        "
        title="Add emoji, GIF, or sticker"
        type="button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>

      {isOpen && (
        <UniversalPicker
          onSelect={(item) => {
            onSelect(item)
            setIsOpen(false)
          }}
          onClose={() => setIsOpen(false)}
          position={position}
          theme={theme}
        />
      )}
    </div>
  )
}

/**
 * Helper hook for inserting emojis into text inputs
 */
export function useEmojiInsertion(inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) {
  const insertEmoji = (emoji: string) => {
    const input = inputRef.current
    if (!input) return

    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const text = input.value
    const newText = text.slice(0, start) + emoji + text.slice(end)
    
    input.value = newText
    input.focus()
    input.setSelectionRange(start + emoji.length, start + emoji.length)
    
    // Trigger onChange event
    const event = new Event('input', { bubbles: true })
    input.dispatchEvent(event)
  }

  return { insertEmoji }
}