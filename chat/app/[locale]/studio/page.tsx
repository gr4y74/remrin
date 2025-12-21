"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useStudioPersona } from "./hooks/use-studio-persona"
import { IdentityTab } from "./components/identity-tab"
import { BehaviorTab } from "./components/behavior-tab"
import { VisualsTab } from "./components/visuals-tab"
import { VoiceTab } from "./components/voice-tab"
import { StoreTab } from "./components/store-tab"
import {
    IconUser,
    IconBrain,
    IconPalette,
    IconMicrophone,
    IconShoppingBag,
    IconDeviceFloppy,
    IconRocket,
    IconArrowLeft
} from "@tabler/icons-react"
import Link from "next/link"

export default function StudioPage() {
    const searchParams = useSearchParams()
    const personaId = searchParams.get('persona_id')

    const {
        persona,
        loading,
        saving,
        error,
        loadPersona,
        updateField,
        updateMetadata,
        uploadFile,
        autoCompile,
        saveDraft,
        publish
    } = useStudioPersona()

    // Load existing persona if ID provided
    useEffect(() => {
        if (personaId) {
            loadPersona(personaId)
        }
    }, [personaId, loadPersona])

    const handleSaveDraft = async () => {
        const success = await saveDraft()
        if (success) {
            // Could show toast here
            console.log('Draft saved!')
        }
    }

    const handlePublish = async () => {
        const success = await publish()
        if (success) {
            console.log('Published!')
        }
    }

    return (
        <div className="flex h-screen flex-col bg-zinc-950 text-white">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <IconArrowLeft size={20} />
                        Back
                    </Link>
                    <div className="h-6 w-px bg-zinc-800" />
                    <h1 className="text-xl font-semibold">
                        Soul Studio
                        {persona.id && (
                            <span className="ml-2 text-sm font-normal text-zinc-500">
                                Editing: {persona.name || 'Untitled'}
                            </span>
                        )}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {error && (
                        <span className="text-sm text-red-400">{error}</span>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={saving || !persona.name}
                        className="border-zinc-700"
                    >
                        <IconDeviceFloppy size={18} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    <Button
                        onClick={handlePublish}
                        disabled={saving || !persona.name || !persona.system_prompt}
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400"
                    >
                        <IconRocket size={18} className="mr-2" />
                        Publish to Store
                    </Button>
                </div>
            </header>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-zinc-500">Loading...</div>
                </div>
            )}

            {/* Main Content */}
            {!loading && (
                <main className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-4xl">
                        <Tabs defaultValue="identity" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-5 bg-zinc-900">
                                <TabsTrigger value="identity" className="flex items-center gap-2">
                                    <IconUser size={16} />
                                    <span className="hidden sm:inline">Identity</span>
                                </TabsTrigger>
                                <TabsTrigger value="behavior" className="flex items-center gap-2">
                                    <IconBrain size={16} />
                                    <span className="hidden sm:inline">Behavior</span>
                                </TabsTrigger>
                                <TabsTrigger value="visuals" className="flex items-center gap-2">
                                    <IconPalette size={16} />
                                    <span className="hidden sm:inline">Visuals</span>
                                </TabsTrigger>
                                <TabsTrigger value="voice" className="flex items-center gap-2">
                                    <IconMicrophone size={16} />
                                    <span className="hidden sm:inline">Voice</span>
                                </TabsTrigger>
                                <TabsTrigger value="store" className="flex items-center gap-2">
                                    <IconShoppingBag size={16} />
                                    <span className="hidden sm:inline">Store</span>
                                </TabsTrigger>
                            </TabsList>

                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                                <TabsContent value="identity" className="mt-0">
                                    <IdentityTab
                                        persona={persona}
                                        updateField={updateField}
                                        uploadFile={uploadFile}
                                    />
                                </TabsContent>

                                <TabsContent value="behavior" className="mt-0">
                                    <BehaviorTab
                                        persona={persona}
                                        updateField={updateField}
                                        autoCompile={autoCompile}
                                        loading={loading}
                                    />
                                </TabsContent>

                                <TabsContent value="visuals" className="mt-0">
                                    <VisualsTab
                                        metadata={persona.metadata}
                                        updateMetadata={updateMetadata}
                                        uploadFile={uploadFile}
                                    />
                                </TabsContent>

                                <TabsContent value="voice" className="mt-0">
                                    <VoiceTab
                                        persona={persona}
                                        metadata={persona.metadata}
                                        updateField={updateField}
                                        updateMetadata={updateMetadata}
                                        uploadFile={uploadFile}
                                    />
                                </TabsContent>

                                <TabsContent value="store" className="mt-0">
                                    <StoreTab
                                        metadata={persona.metadata}
                                        updateMetadata={updateMetadata}
                                    />
                                </TabsContent>
                            </div>
                        </Tabs>

                        {/* Status Bar */}
                        <div className="mt-6 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm">
                            <div className="flex items-center gap-4">
                                <span className="text-zinc-500">
                                    Status:{' '}
                                    <span className={persona.visibility === 'PUBLIC' ? 'text-green-400' : 'text-yellow-400'}>
                                        {persona.visibility === 'PUBLIC' ? 'Published' : 'Draft'}
                                    </span>
                                </span>
                                {persona.id && (
                                    <span className="text-zinc-600">
                                        ID: {persona.id}
                                    </span>
                                )}
                            </div>
                            <span className="text-zinc-600">
                                {persona.created_at && `Created: ${new Date(persona.created_at).toLocaleDateString()}`}
                            </span>
                        </div>
                    </div>
                </main>
            )}
        </div>
    )
}
