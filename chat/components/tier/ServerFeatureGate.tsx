import { checkFeature, getUserTier } from '@/lib/server/feature-gates'
import { FeatureGate } from './FeatureGate'
import { ReactNode } from 'react'

interface ServerFeatureGateProps {
    userId: string
    featureKey: string
    featureName: string
    featureDescription?: string
    requiredTier?: string
    children: ReactNode
    fallback?: ReactNode
}

export async function ServerFeatureGate({
    userId,
    featureKey,
    featureName,
    featureDescription,
    requiredTier,
    children,
    fallback
}: ServerFeatureGateProps) {
    const gate = await checkFeature(userId, featureKey)
    const tierInfo = await getUserTier(userId)

    return (
        <FeatureGate
            featureKey={featureKey}
            featureName={featureName}
            featureDescription={featureDescription}
            enabled={gate.enabled}
            requiredTier={requiredTier || tierInfo.tierName}
            fallback={fallback}
        >
            {children}
        </FeatureGate>
    )
}
