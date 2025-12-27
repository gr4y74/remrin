import { ContentType } from "@/types"
import {
  IconAdjustmentsHorizontal,
  IconBolt,
  IconBooks,
  IconCards,
  IconChevronDown,
  IconCompass,
  IconDiamond,
  IconFile,
  IconHome,
  IconMessage,
  IconPencil,
  IconPhoto,
  IconRobotFace,
  IconSettings,
  IconShoppingCart,
  IconSparkles,
  IconHeart,
  IconWallet
} from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"
import { FC, useState } from "react"
import { useTheme } from "next-themes"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"
import { cn } from "@/lib/utils"

export const SIDEBAR_ICON_SIZE = 24

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const { theme } = useTheme()

  // CSS animation class for icons
  const iconHoverClass = "transition-all duration-200 hover:scale-110 hover:text-rp-rose"

  return (
    <div className={cn(
      "flex h-full flex-col justify-between pb-5",
      theme === "light" ? "bg-[#f0d7d7]" : "bg-transparent"
    )}>
      <TabsList className="grid h-auto gap-1 bg-transparent p-2">
        {/* Remrin Logo - Home button */}
        <WithTooltip
          display={<div>Home</div>}
          trigger={
            <Link
              href="/"
              className="hover:bg-rp-overlay mx-auto mb-2 flex size-[56px] cursor-pointer items-center justify-center rounded-lg"
            >
              <Image
                src={theme === "light" ? "/logo_dark_sm.svg" : "/logo_sm.svg"}
                alt="Remrin Home"
                width={48}
                height={48}
                className={cn(iconHoverClass, "drop-shadow-[0_0_8px_rgba(235,188,186,0.3)]")}
              />
            </Link>
          }
        />

        {/* Primary: Chats */}
        <div className="mx-auto flex size-[40px] items-center justify-center">
          <SidebarSwitchItem
            icon={
              <div className="flex size-6 items-center justify-center">
                <Image src="/icons/hero_icons/chats.svg" alt="Chats" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            }
            contentType="chats"
            onContentTypeChange={onContentTypeChange}
          />
        </div>

        {/* Discover Link */}
        <WithTooltip
          display={<div>Discover Souls</div>}
          trigger={
            <Link
              href="/discover"
              className="hover:bg-rp-overlay mx-auto flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <div className="flex size-6 items-center justify-center">
                <Image src="/icons/hero_icons/discover.svg" alt="Discover" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          }
        />

        {/* Soul Bazaar */}
        <WithTooltip
          display={<div>Soul Bazaar</div>}
          trigger={
            <Link
              href="/marketplace"
              className="hover:bg-rp-overlay mx-auto flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <div className="flex size-6 items-center justify-center">
                <Image src="/icons/hero_icons/market.svg" alt="Market" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          }
        />

        {/* Moments Gallery */}
        <WithTooltip
          display={<div>Moments Gallery</div>}
          trigger={
            <Link
              href="/moments"
              className="hover:bg-rp-overlay mx-auto flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <div className="flex size-6 items-center justify-center">
                <Image src="/icons/hero_icons/moments.svg" alt="Moments" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          }
        />

        {/* Soul Summons */}
        <WithTooltip
          display={<div style={{ color: '#EA2E20' }}>Soul Summons</div>}
          trigger={
            <Link
              href="/summon"
              className="hover:bg-rp-overlay mx-auto flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <div className="flex size-6 items-center justify-center" style={{ filter: 'brightness(0) saturate(100%) invert(24%) sepia(93%) saturate(3447%) hue-rotate(350deg) brightness(93%) contrast(96%)' }}>
                <Image src="/icons/hero_icons/summon.svg" alt="Summon" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          }
        />

        {/* My Collection */}
        <WithTooltip
          display={<div className="font-tiempos-headline">My Collection</div>}
          trigger={
            <Link
              href="/collection"
              className="hover:bg-rp-overlay mx-auto flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <div className="flex size-6 items-center justify-center">
                <Image src="/icons/hero_icons/collection.svg" alt="Collection" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          }
        />

        {/* Wallet */}
        <WithTooltip
          display={<div className="font-tiempos-headline">Wallet & Aether</div>}
          trigger={
            <Link
              href="/wallet"
              className="hover:bg-rp-overlay mx-auto flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <div className="flex size-6 items-center justify-center">
                <Image src="/icons/hero_icons/wallet.svg" alt="Wallet" width={24} height={24} className="size-6 object-contain" style={{ objectFit: 'contain' }} />
              </div>
            </Link>
          }
        />

        {/* Divider */}
        <div className="bg-rp-highlight-med my-2 h-px" />

        {/* Tools Dropdown */}
        <WithTooltip
          display={<div>Tools & Settings</div>}
          trigger={
            <div className="mx-auto flex size-[40px] items-center justify-center">
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
              >
                <IconSettings size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, isToolsOpen && "rotate-90")} style={{ color: isToolsOpen ? '#DE5BA7' : '#DE5BA7' }} />
              </button>
            </div>
          }
        />

        {/* Tools Submenu */}
        {isToolsOpen && (
          <div className="border-rp-highlight-low animate-fadeIn mt-1 flex flex-col gap-1 border-l-2 pl-1">
            <SidebarSwitchItem
              icon={<IconAdjustmentsHorizontal size={20} className="text-rp-iris" />}
              contentType="presets"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconPencil size={20} className="text-rp-rose" />}
              contentType="prompts"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconSparkles size={20} className="text-rp-gold" />}
              contentType="models"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconFile size={20} className="text-rp-foam" />}
              contentType="files"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconBooks size={20} className="text-rp-pine" />}
              contentType="collections"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconRobotFace size={20} className="text-rp-love" />}
              contentType="assistants"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconBolt size={20} className="text-rp-gold" />}
              contentType="tools"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconHeart size={20} className="text-rp-rose" />}
              contentType="personas"
              onContentTypeChange={onContentTypeChange}
            />
          </div>
        )}
      </TabsList>

      <div className="flex flex-col items-center space-y-4">
        <WithTooltip
          display={<div>Profile Settings</div>}
          trigger={<ProfileSettings />}
        />
      </div>
    </div>
  )
}
