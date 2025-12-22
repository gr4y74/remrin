import { ContentType } from "@/types"
import {
  IconAdjustmentsHorizontal,
  IconBolt,
  IconBooks,
  IconCards,
  IconCompass,
  IconDiamond,
  IconFile,
  IconHeart,
  IconMessage,
  IconPencil,
  IconPhoto,
  IconRobotFace,
  IconShoppingCart,
  IconSparkles
} from "@tabler/icons-react"
import Link from "next/link"
import { FC } from "react"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"

export const SIDEBAR_ICON_SIZE = 28

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange
}) => {
  return (
    <div className="flex flex-col justify-between border-r-2 pb-5">
      <TabsList className="bg-background grid h-[540px] grid-rows-10">
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconAdjustmentsHorizontal size={SIDEBAR_ICON_SIZE} />}
          contentType="presets"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconPencil size={SIDEBAR_ICON_SIZE} />}
          contentType="prompts"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconSparkles size={SIDEBAR_ICON_SIZE} />}
          contentType="models"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconFile size={SIDEBAR_ICON_SIZE} />}
          contentType="files"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconBooks size={SIDEBAR_ICON_SIZE} />}
          contentType="collections"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconRobotFace size={SIDEBAR_ICON_SIZE} />}
          contentType="assistants"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconBolt size={SIDEBAR_ICON_SIZE} />}
          contentType="tools"
          onContentTypeChange={onContentTypeChange}
        />

        <SidebarSwitchItem
          icon={<IconHeart size={SIDEBAR_ICON_SIZE} />}
          contentType="personas"
          onContentTypeChange={onContentTypeChange}
        />

        {/* Discover Link - Navigate to discover page */}
        <WithTooltip
          display={<div>Discover Souls</div>}
          trigger={
            <Link
              href="/discover"
              className="flex size-[40px] cursor-pointer items-center justify-center rounded hover:bg-accent hover:opacity-50"
            >
              <IconCompass size={SIDEBAR_ICON_SIZE} className="text-cyan-400" />
            </Link>
          }
        />

        {/* Marketplace Link - Soul Bazaar */}
        <WithTooltip
          display={<div>Soul Bazaar</div>}
          trigger={
            <Link
              href="/marketplace"
              className="flex size-[40px] cursor-pointer items-center justify-center rounded hover:bg-accent hover:opacity-50"
            >
              <IconShoppingCart size={SIDEBAR_ICON_SIZE} className="text-amber-400" />
            </Link>
          }
        />

        {/* Moments Link - Navigate to moments gallery */}
        <WithTooltip
          display={<div>Moments Gallery</div>}
          trigger={
            <Link
              href="/moments"
              className="flex size-[40px] cursor-pointer items-center justify-center rounded hover:bg-accent hover:opacity-50"
            >
              <IconPhoto size={SIDEBAR_ICON_SIZE} className="text-purple-400" />
            </Link>
          }
        />

        {/* Soul Summons - Gacha */}
        <WithTooltip
          display={<div>Soul Summons</div>}
          trigger={
            <Link
              href="/summon"
              className="flex size-[40px] cursor-pointer items-center justify-center rounded hover:bg-accent hover:opacity-50"
            >
              <IconDiamond size={SIDEBAR_ICON_SIZE} className="text-pink-400" />
            </Link>
          }
        />

        {/* Collection - My Souls */}
        <WithTooltip
          display={<div>My Collection</div>}
          trigger={
            <Link
              href="/collection"
              className="flex size-[40px] cursor-pointer items-center justify-center rounded hover:bg-accent hover:opacity-50"
            >
              <IconCards size={SIDEBAR_ICON_SIZE} className="text-emerald-400" />
            </Link>
          }
        />
      </TabsList>

      <div className="flex flex-col items-center space-y-4">
        {/* TODO */}
        {/* <WithTooltip display={<div>Import</div>} trigger={<Import />} /> */}

        {/* TODO */}
        {/* <Alerts /> */}

        <WithTooltip
          display={<div>Profile Settings</div>}
          trigger={<ProfileSettings />}
        />
      </div>
    </div>
  )
}
