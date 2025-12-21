"use client"

import { useState } from "react"
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
import { PersonaMetadata, SwagItem } from "../types"
import { IconPlus, IconTrash, IconShoppingBag } from "@tabler/icons-react"

interface StoreTabProps {
    metadata: PersonaMetadata
    updateMetadata: <K extends keyof PersonaMetadata>(field: K, value: PersonaMetadata[K]) => void
}

export function StoreTab({ metadata, updateMetadata }: StoreTabProps) {
    const [newItem, setNewItem] = useState<Partial<SwagItem>>({
        name: '',
        url: '',
        image_url: '',
        type: 'Physical'
    })

    const swagItems = metadata.swag_items || []

    const addSwagItem = () => {
        if (!newItem.name || !newItem.url) return

        updateMetadata('swag_items', [
            ...swagItems,
            {
                name: newItem.name,
                url: newItem.url,
                image_url: newItem.image_url,
                type: newItem.type || 'Physical'
            } as SwagItem
        ])

        setNewItem({ name: '', url: '', image_url: '', type: 'Physical' })
    }

    const removeSwagItem = (index: number) => {
        updateMetadata('swag_items', swagItems.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-6">
            {/* Official Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
                <div>
                    <Label className="text-base">Mark as Official Soul</Label>
                    <p className="text-sm text-zinc-500">
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={metadata.price || ''}
                        onChange={(e) => updateMetadata('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="bg-zinc-900 border-zinc-700 pl-7"
                    />
                </div>
                <p className="text-xs text-zinc-500">
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
                                className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/50 p-3"
                            >
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="size-12 rounded object-cover"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-zinc-500">{item.type}</div>
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
                <div className="space-y-3 rounded-lg border border-dashed border-zinc-700 p-4">
                    <div className="text-sm font-medium text-zinc-400">Add New Item</div>

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            value={newItem.name || ''}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="Item name"
                            className="bg-zinc-900 border-zinc-700"
                        />
                        <Select
                            value={newItem.type || 'Physical'}
                            onValueChange={(value) => setNewItem({ ...newItem, type: value as SwagItem['type'] })}
                        >
                            <SelectTrigger className="bg-zinc-900 border-zinc-700">
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
                        placeholder="Purchase URL (https://...)"
                        className="bg-zinc-900 border-zinc-700"
                    />

                    <Input
                        value={newItem.image_url || ''}
                        onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                        placeholder="Image URL (optional)"
                        className="bg-zinc-900 border-zinc-700"
                    />

                    <Button
                        type="button"
                        onClick={addSwagItem}
                        disabled={!newItem.name || !newItem.url}
                        className="w-full"
                    >
                        <IconPlus size={16} className="mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>
        </div>
    )
}
