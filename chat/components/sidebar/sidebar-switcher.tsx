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
  IconHeart
} from "@tabler/icons-react"
import Link from "next/link"
import { FC, useState } from "react"
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

  // CSS animation class for icons
  const iconHoverClass = "transition-all duration-200 hover:scale-110 hover:text-rp-rose"

  return (
    <div className="border-rp-highlight-med flex flex-col justify-between border-r pb-5">
      <TabsList className="grid h-auto gap-1 bg-transparent p-2">
        {/* Primary: Chats */}
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} className={iconHoverClass} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
        />

        {/* Discover Link */}
        <WithTooltip
          display={<div>Discover Souls</div>}
          trigger={
            <Link
              href="/discover"
              className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <IconCompass size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, "text-rp-foam")} />
            </Link>
          }
        />

        {/* Soul Bazaar */}
        <WithTooltip
          display={<div>Soul Bazaar</div>}
          trigger={
            <Link
              href="/marketplace"
              className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <IconShoppingCart size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, "text-rp-gold")} />
            </Link>
          }
        />

        {/* Moments Gallery */}
        <WithTooltip
          display={<div>Moments Gallery</div>}
          trigger={
            <Link
              href="/moments"
              className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <IconPhoto size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, "text-rp-iris")} />
            </Link>
          }
        />

        {/* Soul Summons */}
        <WithTooltip
          display={<div>Soul Summons</div>}
          trigger={
            <Link
              href="/summon"
              className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <IconDiamond size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, "text-rp-rose")} />
            </Link>
          }
        />

        {/* My Collection */}
        <WithTooltip
          display={<div>My Collection</div>}
          trigger={
            <Link
              href="/collection"
              className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <IconCards size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, "text-rp-pine")} />
            </Link>
          }
        />

        {/* Divider */}
        <div className="bg-rp-highlight-med my-2 h-px" />

        {/* Tools Dropdown */}
        <WithTooltip
          display={<div>Tools & Settings</div>}
          trigger={
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="hover:bg-rp-overlay flex size-[40px] cursor-pointer items-center justify-center rounded-lg"
            >
              <IconSettings size={SIDEBAR_ICON_SIZE} className={cn(iconHoverClass, isToolsOpen && "text-rp-rose rotate-90")} />
            </button>
          }
        />

        {/* Tools Submenu */}
        {isToolsOpen && (
          <div className="border-rp-highlight-med animate-fadeIn mt-1 flex flex-col gap-1 border-l-2 pl-1">
            <SidebarSwitchItem
              icon={<IconAdjustmentsHorizontal size={20} className={iconHoverClass} />}
              contentType="presets"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconPencil size={20} className={iconHoverClass} />}
              contentType="prompts"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconSparkles size={20} className={iconHoverClass} />}
              contentType="models"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconFile size={20} className={iconHoverClass} />}
              contentType="files"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconBooks size={20} className={iconHoverClass} />}
              contentType="collections"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconRobotFace size={20} className={iconHoverClass} />}
              contentType="assistants"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconBolt size={20} className={iconHoverClass} />}
              contentType="tools"
              onContentTypeChange={onContentTypeChange}
            />
            <SidebarSwitchItem
              icon={<IconHeart size={20} className={iconHoverClass} />}
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
