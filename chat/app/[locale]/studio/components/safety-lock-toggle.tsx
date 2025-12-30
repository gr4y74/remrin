"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { IconLock, IconLockOpen, IconShieldLock } from "@tabler/icons-react"

interface SafetyLockToggleProps {
    config: {
        safety_lock?: boolean
        [key: string]: unknown
    }
    updateConfig: (key: string, value: unknown) => void
}

export function SafetyLockToggle({ config, updateConfig }: SafetyLockToggleProps) {
    const isLocked = config.safety_lock || false

    const handleToggle = (checked: boolean) => {
        updateConfig("safety_lock", checked)
    }

    return (
        <div className={`rounded-lg border p-4 transition-all ${isLocked
                ? 'border-rp-gold/40 bg-rp-gold/10'
                : 'border-rp-highlight-med bg-rp-overlay'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${isLocked
                            ? 'bg-rp-gold/20'
                            : 'bg-rp-overlay'
                        }`}>
                        {isLocked ? (
                            <IconShieldLock size={20} className="text-rp-gold" />
                        ) : (
                            <IconLockOpen size={20} className="text-rp-muted" />
                        )}
                    </div>
                    <div>
                        <Label className="text-base font-medium">IP Safety Lock</Label>
                        <p className="text-sm text-rp-subtle">
                            {isLocked
                                ? 'System prompt is hidden from buyers'
                                : 'Buyers can view your system prompt'}
                        </p>
                    </div>
                </div>

                <Switch
                    checked={isLocked}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-rp-gold"
                />
            </div>

            {isLocked && (
                <div className="mt-4 rounded-md border border-rp-gold/30 bg-rp-gold/5 p-3">
                    <p className="flex items-center gap-2 text-sm text-rp-gold">
                        <IconLock size={16} />
                        <span><strong>Protected</strong> — Your Soul&apos;s &quot;cartridge&quot; is encrypted</span>
                    </p>
                    <p className="mt-1 text-xs text-rp-subtle">
                        When listed on the marketplace, buyers can chat with your Soul but cannot see or copy the system prompt.
                        Only the Edge Function can access it during inference.
                    </p>
                </div>
            )}
        </div>
    )
}
