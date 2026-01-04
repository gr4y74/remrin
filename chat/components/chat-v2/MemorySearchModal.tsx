"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconSearch, IconX, IconFileText, IconLoader2, IconCheck } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useChatEngine } from './ChatEngine'

interface MemoryItem {
    id: string
    file_name: string
    file_type: string
    content: string
    created_at: string
}

interface MemorySearchModalProps {
    isOpen: boolean
    onClose: () => void
    initialQuery?: string
}

export function MemorySearchModal({
    isOpen,
    onClose,
    initialQuery = ''
}: MemorySearchModalProps) {
    const [query, setQuery] = useState(initialQuery)
    const [results, setResults] = useState<MemoryItem[]>([])
    const [loading, setLoading] = useState(false)
    const { addSystemMessage, personaId } = useChatEngine()

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) return
        setLoading(true)
        try {
            const res = await fetch('/api/v2/knowledge/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    personaId: personaId
                })
            })
            if (!res.ok) throw new Error('Search failed')
            const data = await res.json()
            setResults(data)
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Failed to search memories')
        } finally {
            setLoading(false)
        }
    }, [personaId])

    useEffect(() => {
        if (isOpen) {
            setQuery(initialQuery)
            if (initialQuery) {
                handleSearch(initialQuery)
            } else {
                setResults([])
            }
        }
    }, [isOpen, initialQuery, handleSearch])

    const handleSelect = (memory: MemoryItem) => {
        const contextMsg = `[Memory Retrieval: ${memory.file_name}]\n\n${memory.content}`
        addSystemMessage(contextMsg)
        toast.success(`Added ${memory.file_name} to context`)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-rp-base/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-rp-overlay bg-rp-surface shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-rp-overlay/50 px-6 py-4">
                            <h2 className="text-xl font-bold text-rp-text flex items-center gap-2">
                                <IconSearch size={22} className="text-rp-iris" />
                                Search Memories
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-rp-muted hover:bg-rp-overlay hover:text-rp-text transition-colors"
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-6 pb-0">
                            <div className="relative">
                                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-rp-subtle" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search your knowledge vault..."
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value)
                                        // Simple debounce could be added here
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch(query)
                                    }}
                                    className="w-full rounded-2xl border border-rp-overlay bg-rp-base/50 py-3.5 pl-12 pr-4 text-base text-rp-text placeholder-rp-subtle focus:border-rp-iris/50 focus:bg-rp-base focus:outline-none transition-all"
                                />
                                {loading && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <IconLoader2 size={18} className="animate-spin text-rp-iris" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[400px] overflow-y-auto p-6 pt-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-rp-muted/20">
                            {results.length > 0 ? (
                                <div className="grid gap-3">
                                    {results.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="flex items-center justify-between rounded-2xl border border-rp-overlay/50 bg-rp-base/30 p-4 text-left hover:border-rp-iris/40 hover:bg-rp-surface transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rp-iris/10 text-rp-iris group-hover:bg-rp-iris group-hover:text-rp-base transition-colors">
                                                    <IconFileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-rp-text">{item.file_name}</p>
                                                    <p className="text-xs text-rp-subtle uppercase">{item.file_type} • {new Date(item.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <IconCheck size={18} className="text-rp-iris" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : query && !loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-rp-subtle italic">No memories found for &quot;{query}&quot;</p>
                                </div>
                            ) : !loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-rp-muted">
                                    <IconSearch size={40} className="mb-3 opacity-20" />
                                    <p className="text-sm">Type to search through your uploaded files</p>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
