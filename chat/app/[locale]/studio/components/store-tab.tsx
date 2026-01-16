"use client"

import { useState, useRef, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { PersonaMetadata, SwagItem, PersonaConfig, DigitalAssetEdition, AssetType } from "../types"
import { IconPlus, IconTrash, IconShoppingBag, IconUpload, IconLoader2, IconSparkles } from "@tabler/icons-react"
import { SafetyLockToggle } from "./safety-lock-toggle"
import { EditionCreator } from "./edition-creator"
import { EditionBadge } from "./edition-badge"
import Image from "next/image"

interface StoreTabProps {
    metadata: PersonaMetadata
    updateMetadata: <K extends keyof PersonaMetadata>(field: K, value: PersonaMetadata[K]) => void
    config?: PersonaConfig
    updateConfig?: (key: string, value: unknown) => void
    uploadFile: (file: File, bucket: string, folder: string) => Promise<string | null>
    uploading: boolean
}

export function StoreTab({ metadata, updateMetadata, config, updateConfig, uploadFile, uploading }: StoreTabProps) {
    const [newItem, setNewItem] = useState<Partial<SwagItem>>({
        name: '',
        url: '',
        image_url: '',
        type: 'Physical',
        digital_editions: []
    })

    const [editionCreatorOpen, setEditionCreatorOpen] = useState(false)
    const [currentAssetType, setCurrentAssetType] = useState<AssetType>('image')
    const [currentAssetUrl, setCurrentAssetUrl] = useState('')
    const [tempAssetUrl, setTempAssetUrl] = useState('')

    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const audioInputRef = useRef<HTMLInputElement>(null)

    const swagItems = metadata.swag_items || []

    const handleAssetUpload = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement>,
        assetType: AssetType,
        bucket: string
    ) => {
        const file = e.target.files?.[0]
        if (!file) return

        const url = await uploadFile(file, bucket, 'digital')
        if (url) {
            setCurrentAssetUrl(url)
            setCurrentAssetType(assetType)
            setEditionCreatorOpen(true)
        }
    }, [uploadFile])

    const handleAssetUrlAdd = (url: string, assetType: AssetType) => {
        if (!url.trim()) return
        setCurrentAssetUrl(url.trim())
        setCurrentAssetType(assetType)
        setEditionCreatorOpen(true)
        setTempAssetUrl('')
    }

    const handleEditionSave = (edition: DigitalAssetEdition) => {
        setNewItem(prev => ({
            ...prev,
            digital_editions: [...(prev.digital_editions || []), edition]
        }))
    }

    const removeEdition = (index: number) => {
        setNewItem(prev => ({
            ...prev,
            digital_editions: (prev.digital_editions || []).filter((_, i) => i !== index)
        }))
    }

    const addSwagItem = () => {
        if (!newItem.name || !newItem.url) return

        updateMetadata('swag_items', [
            ...swagItems,
            {
                name: newItem.name,
                url: newItem.url,
                image_url: newItem.image_url,
                type: newItem.type || 'Physical',
                digital_editions: newItem.digital_editions
            } as SwagItem
        ])

        setNewItem({
            name: '',
            url: '',
            image_url: '',
            type: 'Physical',
            digital_editions: []
        })
    }

    const removeSwagItem = (index: number) => {
        updateMetadata('swag_items', swagItems.filter((_, i) => i !== index))
    }

    const isDigital = newItem.type === 'Digital'
    const editionCount = newItem.digital_editions?.length || 0

    return (
        <div className="space-y-6">
            {/* IP Safety Lock */}
            {config !== undefined && updateConfig && (
                <SafetyLockToggle
                    config={config || {}}
                    updateConfig={updateConfig}
                />
            )}

            {/* Official Toggle */}
            <div className="flex items-center justify-between rounded-lg bg-rp-surface/50 p-4">
                <div>
                    <Label className="text-base">Mark as Official Soul</Label>
                    <p className="text-sm text-rp-muted">
                        Official Souls are featured in the store and marketplace
                    </p>
                </div>
                <Switch
                    checked={metadata.is_official || false}
                    onCheckedChange={(checked) => updateMetadata('is_official', checked)}
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
                        value={metadata.price || ''}
                        onChange={(e) => updateMetadata('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="border-rp-highlight-med bg-rp-surface pl-7"
                    />
                </div>
                <p className="text-xs text-rp-muted">
                    Set to 0 for free Souls. Premium Souls can be sold in the marketplace.
                </p>
            </div>

            {/* Merch Links */}
            <div className="space-y-4">
                <Label className="flex items-center gap-2">
                    <IconShoppingBag size={16} className="text-pink-400" />
                    Swag & Merchandise
                </Label>

                {/* Existing Items */}
                {swagItems.length > 0 && (
                    <div className="space-y-2">
                        {swagItems.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 rounded-lg bg-rp-surface/50 p-3"
                            >
                                {item.image_url && (
                                    <div className="relative size-12 shrink-0 overflow-hidden rounded">
                                        <Image
                                            src={item.image_url}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-rp-muted">
                                        {item.type}
                                        {item.type === 'Digital' && item.digital_editions && item.digital_editions.length > 0 && (
                                            <span className="ml-2">
                                                • {item.digital_editions.length} edition{item.digital_editions.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-cyan-400 hover:underline"
                                >
                                    View
                                </a>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSwagItem(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <IconTrash size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Item */}
                <div className="space-y-3 rounded-lg border border-dashed border-rp-highlight-med p-4">
                    <div className="text-sm font-medium text-rp-subtle">Add New Item</div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            value={newItem.name || ''}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="Item name"
                            className="border-rp-highlight-med bg-rp-surface"
                        />
                        <Select
                            value={newItem.type || 'Physical'}
                            onValueChange={(value) => setNewItem({ ...newItem, type: value as SwagItem['type'] })}
                        >
                            <SelectTrigger className="border-rp-highlight-med bg-rp-surface">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Physical">Physical</SelectItem>
                                <SelectItem value="Digital">Digital</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Input
                        value={newItem.url || ''}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        placeholder={isDigital ? "Download/Access URL (https://...)" : "Purchase URL (https://...)"}
                        className="border-rp-highlight-med bg-rp-surface"
                    />

                    <Input
                        value={newItem.image_url || ''}
                        onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                        placeholder="Preview image URL (optional)"
                        className="border-rp-highlight-med bg-rp-surface"
                    />

                    {/* Digital Editions Section */}
                    {isDigital && (
                        <div className="space-y-4 rounded-lg bg-rp-iris/5 p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-medium text-rp-iris">Limited Edition Digital Assets</div>
                                <span className="text-xs text-rp-muted">{editionCount} edition{editionCount !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Existing Editions */}
                            {newItem.digital_editions && newItem.digital_editions.length > 0 && (
                                <div className="space-y-2">
                                    {newItem.digital_editions.map((edition, idx) => (
                                        <div key={idx} className="flex items-center gap-2 rounded bg-rp-surface/50 p-2">
                                            <div className="flex-1">
                                                <div className="text-xs font-medium">{edition.title || `${edition.asset_type} Edition`}</div>
                                                <EditionBadge edition={edition} size="sm" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeEdition(idx)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <IconTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Edition Buttons */}
                            <div className="space-y-3">
                                {/* Images */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Add Image Edition</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={uploading}
                                            className="shrink-0"
                                        >
                                            {uploading ? <IconLoader2 size={16} className="mr-2 animate-spin" /> : <IconUpload size={16} className="mr-2" />}
                                            Upload
                                        </Button>
                                        <Input
                                            value={tempAssetUrl}
                                            onChange={(e) => setTempAssetUrl(e.target.value)}
                                            placeholder="Or paste URL"
                                            className="flex-1 border-rp-highlight-med bg-rp-surface text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAssetUrlAdd(tempAssetUrl, 'image')}
                                            disabled={!tempAssetUrl.trim()}
                                        >
                                            <IconSparkles size={16} />
                                        </Button>
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleAssetUpload(e, 'image', 'soul_forge')}
                                        />
                                    </div>
                                </div>

                                {/* Videos */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Add Video Edition</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => videoInputRef.current?.click()}
                                            disabled={uploading}
                                            className="shrink-0"
                                        >
                                            {uploading ? <IconLoader2 size={16} className="mr-2 animate-spin" /> : <IconUpload size={16} className="mr-2" />}
                                            Upload
                                        </Button>
                                        <Input
                                            value={tempAssetUrl}
                                            onChange={(e) => setTempAssetUrl(e.target.value)}
                                            placeholder="Or paste URL"
                                            className="flex-1 border-rp-highlight-med bg-rp-surface text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAssetUrlAdd(tempAssetUrl, 'video')}
                                            disabled={!tempAssetUrl.trim()}
                                        >
                                            <IconSparkles size={16} />
                                        </Button>
                                        <input
                                            ref={videoInputRef}
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={(e) => handleAssetUpload(e, 'video', 'soul_video')}
                                        />
                                    </div>
                                </div>

                                {/* Audio */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Add Audio Edition</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => audioInputRef.current?.click()}
                                            disabled={uploading}
                                            className="shrink-0"
                                        >
                                            {uploading ? <IconLoader2 size={16} className="mr-2 animate-spin" /> : <IconUpload size={16} className="mr-2" />}
                                            Upload
                                        </Button>
                                        <Input
                                            value={tempAssetUrl}
                                            onChange={(e) => setTempAssetUrl(e.target.value)}
                                            placeholder="Or paste URL"
                                            className="flex-1 border-rp-highlight-med bg-rp-surface text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAssetUrlAdd(tempAssetUrl, 'audio')}
                                            disabled={!tempAssetUrl.trim()}
                                        >
                                            <IconSparkles size={16} />
                                        </Button>
                                        <input
                                            ref={audioInputRef}
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={(e) => handleAssetUpload(e, 'audio', 'soul_audio')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-rp-muted">
                                💡 Upload or paste URL, then configure edition type, supply, and licensing
                            </p>
                        </div>
                    )}

                    <Button
                        type="button"
                        onClick={addSwagItem}
                        disabled={!newItem.name || !newItem.url}
                        className="w-full"
                    >
                        <IconPlus size={16} className="mr-2" />
                        Add {isDigital ? 'Digital Package' : 'Physical Item'}
                    </Button>
                </div>
            </div>

            {/* Edition Creator Dialog */}
            <EditionCreator
                open={editionCreatorOpen}
                onOpenChange={setEditionCreatorOpen}
                assetType={currentAssetType}
                assetUrl={currentAssetUrl}
                onSave={handleEditionSave}
            />
        </div>
    )
}
