"use client"

import * as React from "react"
import { AudioStudioLayout } from "@/components/studio/AudioStudioLayout"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Mic2, Settings, Wand2, PlayCircle, BarChart3, Upload } from "lucide-react"
import { VoicePreview } from "@/components/audio/VoicePreview"
import { VoiceSelector } from "@/components/audio/VoiceSelector"
import { Voice } from "@/lib/audio/providers/AudioProvider.interface"

// Mock stats for dashboard
const MOCK_STATS = [
    { label: "Generated Audio", value: "245", trend: "+12%", icon: PlayCircle },
    { label: "Active Voices", value: "12", trend: "0", icon: Mic2 },
    { label: "Storage Used", value: "1.2 GB", trend: "+5%", icon: Settings },
    { label: "Cache Hit Rate", value: "94%", trend: "+2%", icon: BarChart3 },
]

export default function AudioStudioPage() {
    const [selectedVoice, setSelectedVoice] = React.useState<string>("en-US-AriaNeural")
    const [voices, setVoices] = React.useState<Voice[]>([])

    // Fetch voices on mount (simulated)
    React.useEffect(() => {
        fetch('/api/audio/voices?provider=edge')
            .then(res => res.json())
            .then(data => setVoices(data))
            .catch(err => console.error("Failed to load voices", err))
    }, [])

    return (
        <AudioStudioLayout>
            <div className="flex h-full">
                {/* Sidebar / Navigation */}
                <div className="w-64 border-r bg-muted/10 p-4 hidden md:block overflow-y-auto">
                    <nav className="space-y-2">
                        <Button variant="secondary" className="w-full justify-start gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Overview
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Mic2 className="h-4 w-4" />
                            Voice Library
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Wand2 className="h-4 w-4" />
                            Voice Lab (Cloning)
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Upload className="h-4 w-4" />
                            Uploads
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </nav>

                    <div className="mt-8">
                        <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Quick Actions
                        </h3>
                        <div className="space-y-1">
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                                New Generation
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                                Clear Cache
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-5xl space-y-8">

                        {/* Stats Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {MOCK_STATS.map((stat) => (
                                <Card key={stat.label}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {stat.label}
                                        </CardTitle>
                                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {stat.trend} from last month
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Recent Activity / Playground */}
                        <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Voice Playground</CardTitle>
                                    <CardDescription>
                                        Test and generate audio with your configured voices.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Voice</label>
                                        <div className="w-full max-w-sm">
                                            {/* Simplified selector for demo */}
                                            <select
                                                className="w-full p-2 rounded-md border bg-background"
                                                value={selectedVoice}
                                                onChange={(e) => setSelectedVoice(e.target.value)}
                                            >
                                                {voices.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.name} ({v.locale})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Text</label>
                                        <textarea
                                            className="w-full min-h-[120px] p-3 rounded-md border bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="Enter text to generate speech..."
                                            defaultValue="Welcome to the Audio Studio. This is a place where you can manage your AI voices."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary">Listen Preview</Button>
                                        <Button>Generate & Save</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Recent Generations</CardTitle>
                                    <CardDescription>
                                        Latest audio files generated across the platform.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-4 rounded-md border p-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                                                    <PlayCircle className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium leading-none">
                                                        Welcome Message {i}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Edge TTS • 2h ago
                                                    </p>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    12s
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AudioStudioLayout>
    )
}
