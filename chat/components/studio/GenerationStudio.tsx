"use client"

import { useState, useEffect, useCallback } from "react"
import { StudioControls } from "./StudioControls"
import { StudioPreview } from "./StudioPreview"
import { toast } from "sonner"

interface GenerationStudioProps {
    type?: 'image' | 'video' | 'edit'
}

export function GenerationStudio({ type: initialType = 'image' }: GenerationStudioProps) {
    const [type, setType] = useState(initialType)
    const [models, setModels] = useState<any[]>([])
    const [loadingModels, setLoadingModels] = useState(true)
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle')
    const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null)
    const [outputUrl, setOutputUrl] = useState<string | undefined>()
    const [error, setError] = useState<string | undefined>()

    // Fetch available models
    const fetchModels = useCallback(async () => {
        setLoadingModels(true)
        try {
            const res = await fetch(`/api/v2/studio/models?type=${type}`)
            const data = await res.json()
            if (data.models) {
                setModels(data.models)
                if (!selectedModelId && data.models.length > 0) {
                    setSelectedModelId(data.models[0].id)
                }
            }
        } catch (err) {
            console.error("Failed to fetch models:", err)
            toast.error("Failed to load AI models")
        } finally {
            setLoadingModels(false)
        }
    }, [type, selectedModelId])

    useEffect(() => {
        fetchModels()
    }, [fetchModels])

    // Poll for status
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (status === 'generating' && currentGenerationId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/v2/studio/prediction/${currentGenerationId}`)
                    const data = await res.json()

                    if (data.status === 'completed') {
                        setStatus('completed')
                        setOutputUrl(data.output_url)
                        setIsGenerating(false)
                        clearInterval(interval)
                        toast.success("Generation complete!")
                    } else if (data.status === 'failed' || data.status === 'cancelled') {
                        setStatus('failed')
                        setError(data.error_message || "Generation failed")
                        setIsGenerating(false)
                        clearInterval(interval)
                    }
                } catch (err) {
                    console.error("Polling error:", err)
                }
            }, 2000)
        }
        return () => clearInterval(interval)
    }, [status, currentGenerationId])

    const handleGenerate = async (genData: any) => {
        setIsGenerating(true)
        setStatus('generating')
        setError(undefined)
        setOutputUrl(undefined)

        try {
            const res = await fetch('/api/v2/studio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(genData)
            })

            const data = await res.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setCurrentGenerationId(data.id)
        } catch (err: any) {
            console.error("Generation error:", err)
            setStatus('failed')
            setError(err.message)
            setIsGenerating(false)
            toast.error(err.message || "Failed to start generation")
        }
    }

    const handleReset = () => {
        setStatus('idle')
        setCurrentGenerationId(null)
        setOutputUrl(undefined)
        setError(undefined)
    }

    const selectedModel = models.find(m => m.id === selectedModelId)

    return (
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] h-full overflow-hidden">
            <StudioControls
                type={type}
                models={models}
                selectedModelId={selectedModelId}
                setSelectedModelId={setSelectedModelId}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
            />
            <StudioPreview
                status={status}
                outputUrl={outputUrl}
                previewUrl={selectedModel?.thumbnail_url}
                previewName={selectedModel?.display_name}
                error={error}
                onReset={handleReset}
                onRegenerate={() => currentGenerationId && handleGenerate({})}
            />
        </div>
    )
}
