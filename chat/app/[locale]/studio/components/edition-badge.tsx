"use client"

import { DigitalAssetEdition } from "../types"
import { IconDiamond, IconSparkles, IconInfinity, IconClock, IconLock, IconBriefcase, IconKey, IconStar } from "@tabler/icons-react"

interface EditionBadgeProps {
    edition: DigitalAssetEdition
    showLicense?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function EditionBadge({ edition, showLicense = true, size = 'md' }: EditionBadgeProps) {
    const isSoldOut = edition.total_supply !== undefined &&
        edition.minted_count !== undefined &&
        edition.minted_count >= edition.total_supply

    const available = edition.total_supply !== undefined && edition.minted_count !== undefined
        ? edition.total_supply - edition.minted_count
        : null

    // Edition type styling
    const getEditionBadge = () => {
        switch (edition.edition_type) {
            case 'one_of_one':
                return {
                    icon: IconDiamond,
                    text: '1 of 1',
                    className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                }
            case 'limited':
                return {
                    icon: IconSparkles,
                    text: isSoldOut ? 'Sold Out' : available !== null ? `${available}/${edition.total_supply} Available` : `Limited ${edition.total_supply}`,
                    className: isSoldOut ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-rp-iris text-white'
                }
            case 'open':
                return {
                    icon: IconInfinity,
                    text: 'Open Edition',
                    className: 'bg-rp-foam/20 text-rp-foam border border-rp-foam/50'
                }
            case 'timed':
                return {
                    icon: IconClock,
                    text: 'Timed Edition',
                    className: 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                }
        }
    }

    // License type icon
    const getLicenseIcon = () => {
        switch (edition.license_type) {
            case 'personal':
                return { icon: IconLock, label: 'Personal Use', color: 'text-gray-400' }
            case 'commercial':
                return { icon: IconBriefcase, label: 'Commercial', color: 'text-blue-400' }
            case 'full_rights':
                return { icon: IconKey, label: 'Full Rights', color: 'text-yellow-400' }
            case 'exclusive':
                return { icon: IconStar, label: 'Exclusive', color: 'text-purple-400' }
        }
    }

    const editionBadge = getEditionBadge()
    const licenseInfo = getLicenseIcon()
    const EditionIcon = editionBadge.icon
    const LicenseIcon = licenseInfo.icon

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5'
    }

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 16
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Edition Badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${editionBadge.className} ${sizeClasses[size]}`}>
                <EditionIcon size={iconSizes[size]} />
                {editionBadge.text}
            </span>

            {/* License Badge */}
            {showLicense && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-rp-surface/50 border border-rp-highlight-med ${sizeClasses[size]}`}>
                    <LicenseIcon size={iconSizes[size]} className={licenseInfo.color} />
                    <span className="text-rp-text">{licenseInfo.label}</span>
                </span>
            )}

            {/* Price */}
            {edition.price_usd !== undefined && edition.price_usd > 0 && (
                <span className={`inline-flex items-center rounded-full bg-green-500/20 text-green-400 border border-green-500/50 ${sizeClasses[size]}`}>
                    ${edition.price_usd.toFixed(2)}
                </span>
            )}
        </div>
    )
}
