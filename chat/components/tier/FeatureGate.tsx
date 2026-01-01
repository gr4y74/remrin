'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLock, IconSparkles } from '@tabler/icons-react'
import Link from 'next/link'

interface FeatureGateProps {
    featureKey: string
    featureName: string
    featureDescription?: string
    enabled: boolean
    requiredTier?: string
    children: ReactNode
    fallback?: ReactNode
}

export function FeatureGate({
    featureKey,
    featureName,
    featureDescription,
    enabled,
    requiredTier = 'Soul Weaver',
    children,
    fallback
}: FeatureGateProps) {
    if (enabled) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    return (
        <Card className="border-rp-iris/50 bg-rp-iris/5">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <IconLock size={20} className="text-rp-iris" />
                        <CardTitle>{featureName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-rp-iris px-2 py-1 text-xs text-white">
                        <IconSparkles size={12} />
                        {requiredTier}
                    </div>
                </div>
                {featureDescription && (
                    <CardDescription>{featureDescription}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-rp-subtle">
                        Upgrade to unlock this feature
                    </p>
                    <Button asChild className="bg-rp-iris hover:bg-rp-iris/90">
                        <Link href="/pricing">
                            Upgrade Now
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
