"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DigitalAssetEdition, EditionType, LicenseType, AssetType } from "../types"
import { IconSparkles, IconInfinity, IconClock, IconDiamond } from "@tabler/icons-react"

interface EditionCreatorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assetType: AssetType
    assetUrl: string
    onSave: (edition: DigitalAssetEdition) => void
}

const EDITION_TYPE_INFO: Record<EditionType, { icon: any, label: string, description: string }> = {
    one_of_one: {
        icon: IconDiamond,
        label: "1 of 1",
        description: "Unique, never to be reproduced"
    },
    limited: {
        icon: IconSparkles,
        label: "Limited Edition",
        description: "Fixed quantity available"
    },
    open: {
        icon: IconInfinity,
        label: "Open Edition",
        description: "Unlimited availability"
    },
    timed: {
        icon: IconClock,
        label: "Timed Edition",
        description: "Available during specific period"
    }
}

const LICENSE_TYPE_INFO: Record<LicenseType, { label: string, description: string }> = {
    personal: {
        label: "Personal Use",
        description: "For personal enjoyment only, no commercial use"
    },
    commercial: {
        label: "Commercial License",
        description: "Can use commercially, creator retains IP"
    },
    full_rights: {
        label: "Full Rights Transfer",
        description: "Complete ownership transfer (like NFT/logo sale)"
    },
    exclusive: {
        label: "Exclusive License",
        description: "Buyer has exclusive rights, creator retains ownership"
    }
}

export function EditionCreator({ open, onOpenChange, assetType, assetUrl, onSave }: EditionCreatorProps) {
    const [edition, setEdition] = useState<Partial<DigitalAssetEdition>>({
        asset_url: assetUrl,
        asset_type: assetType,
        edition_type: 'limited',
        license_type: 'personal',
        total_supply: 10
    })

    const handleSave = () => {
        if (!edition.edition_type || !edition.license_type) return

        const finalEdition: DigitalAssetEdition = {
            asset_url: assetUrl,
            asset_type: assetType,
            edition_type: edition.edition_type,
            license_type: edition.license_type,
            total_supply: edition.edition_type === 'one_of_one' ? 1 :
                edition.edition_type === 'open' ? undefined :
                    edition.total_supply,
            title: edition.title,
            description: edition.description,
            price_usd: edition.price_usd,
            available_from: edition.available_from,
            available_until: edition.available_until,
            minted_count: 0
        }

        onSave(finalEdition)
        onOpenChange(false)

        // Reset form
        setEdition({
            asset_url: '',
            asset_type: assetType,
            edition_type: 'limited',
            license_type: 'personal',
            total_supply: 10
        })
    }

    const isOneOfOne = edition.edition_type === 'one_of_one'
    const isLimited = edition.edition_type === 'limited'
    const isOpen = edition.edition_type === 'open'
    const isTimed = edition.edition_type === 'timed'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Limited Edition</DialogTitle>
                    <DialogDescription>
                        Configure scarcity, licensing, and metadata for this {assetType}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Edition Type */}
                    <div className="space-y-3">
                        <Label>Edition Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(Object.keys(EDITION_TYPE_INFO) as EditionType[]).map((type) => {
                                const info = EDITION_TYPE_INFO[type]
                                const Icon = info.icon
                                const isSelected = edition.edition_type === type

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setEdition({ ...edition, edition_type: type })}
                                        className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all ${isSelected
                                                ? 'border-rp-iris bg-rp-iris/10'
                                                : 'border-rp-highlight-med hover:border-rp-foam'
                                            }`}
                                    >
                                        <Icon size={20} className={isSelected ? 'text-rp-iris' : 'text-rp-muted'} />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{info.label}</div>
                                            <div className="text-xs text-rp-muted">{info.description}</div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Supply (for limited editions) */}
                    {(isLimited || isOneOfOne) && (
                        <div className="space-y-2">
                            <Label htmlFor="supply">
                                {isOneOfOne ? 'Supply (Fixed at 1)' : 'Total Supply'}
                            </Label>
                            <Input
                                id="supply"
                                type="number"
                                min="1"
                                value={isOneOfOne ? 1 : edition.total_supply || ''}
                                onChange={(e) => setEdition({ ...edition, total_supply: parseInt(e.target.value) })}
                                disabled={isOneOfOne}
                                placeholder="e.g., 10, 25, 100"
                                className="border-rp-highlight-med bg-rp-surface"
                            />
                            {!isOneOfOne && (
                                <p className="text-xs text-rp-muted">
                                    How many copies will be available? This cannot be changed later.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Timing (for timed editions) */}
                    {isTimed && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="available_from">Available From</Label>
                                <Input
                                    id="available_from"
                                    type="datetime-local"
                                    value={edition.available_from || ''}
                                    onChange={(e) => setEdition({ ...edition, available_from: e.target.value })}
                                    className="border-rp-highlight-med bg-rp-surface"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="available_until">Available Until</Label>
                                <Input
                                    id="available_until"
                                    type="datetime-local"
                                    value={edition.available_until || ''}
                                    onChange={(e) => setEdition({ ...edition, available_until: e.target.value })}
                                    className="border-rp-highlight-med bg-rp-surface"
                                />
                            </div>
                        </div>
                    )}

                    {/* License Type */}
                    <div className="space-y-2">
                        <Label htmlFor="license">License Type</Label>
                        <Select
                            value={edition.license_type}
                            onValueChange={(value: LicenseType) => setEdition({ ...edition, license_type: value })}
                        >
                            <SelectTrigger className="border-rp-highlight-med bg-rp-surface">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(LICENSE_TYPE_INFO) as LicenseType[]).map((type) => (
                                    <SelectItem key={type} value={type}>
                                        <div>
                                            <div className="font-medium">{LICENSE_TYPE_INFO[type].label}</div>
                                            <div className="text-xs text-rp-muted">{LICENSE_TYPE_INFO[type].description}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title (Optional)</Label>
                        <Input
                            id="title"
                            value={edition.title || ''}
                            onChange={(e) => setEdition({ ...edition, title: e.target.value })}
                            placeholder="e.g., Golden Hero Portrait"
                            className="border-rp-highlight-med bg-rp-surface"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={edition.description || ''}
                            onChange={(e) => setEdition({ ...edition, description: e.target.value })}
                            placeholder="Describe this edition, its rarity, and what makes it special..."
                            className="border-rp-highlight-med bg-rp-surface min-h-20"
                        />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (USD)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-muted">$</span>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={edition.price_usd || ''}
                                onChange={(e) => setEdition({ ...edition, price_usd: parseFloat(e.target.value) })}
                                placeholder="0.00"
                                className="border-rp-highlight-med bg-rp-surface pl-7"
                            />
                        </div>
                    </div>

                    {/* Preview Badge */}
                    <div className="rounded-lg bg-rp-surface/50 p-4">
                        <div className="text-xs font-medium text-rp-subtle mb-2">Preview</div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rp-iris px-3 py-1 text-xs font-medium text-white">
                                {isOneOfOne && '1 of 1'}
                                {isLimited && `Limited ${edition.total_supply || 0}`}
                                {isOpen && 'Open Edition'}
                                {isTimed && 'Timed Edition'}
                            </span>
                            <span className="text-xs text-rp-muted">
                                {LICENSE_TYPE_INFO[edition.license_type || 'personal'].label}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!edition.edition_type || !edition.license_type}
                    >
                        Create Edition
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
