"use client"

import React, { ReactNode } from "react"
import { useSubscription } from "@/hooks/useSubscription"
import { SubscriptionTier } from "@/lib/server/feature-gates"
import { TIER_METADATA, FeatureKey, hasPermission } from "@/src/lib/permissions"
import { Button } from "@/components/ui/button"
import { IconLock, IconRocket } from "@tabler/icons-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TierGateProps {
  requiredTier: SubscriptionTier
  feature: string
  children: ReactNode
  mode?: "hide" | "lock" | "blur"
  className?: string
}

export function TierGate({
  requiredTier,
  feature,
  children,
  mode = "lock",
  className
}: TierGateProps) {
  const { subscription, loading } = useSubscription()
  
  // Default to wanderer if loading or no subscription
  const currentTier: SubscriptionTier = subscription?.tier || "wanderer"
  
  // If user has permission, just render children
  // We use a helper here because some tiers might have higher permissions
  // but the prop only specifies the *minimum* required tier.
  // Actually, hasPermission(currentTier, featureKey) is better, but TierGate
  // currently takes a requiredTier name.
  
  // Let's implement a tier hierarchy comparison
  const tiers: SubscriptionTier[] = ["wanderer", "soul_weaver", "architect", "titan"]
  const currentTierIndex = tiers.indexOf(currentTier)
  const requiredTierIndex = tiers.indexOf(requiredTier)
  
  const hasAccess = currentTierIndex >= requiredTierIndex

  if (loading) {
    return <div className="animate-pulse bg-rp-overlay/20 rounded-xl h-20 w-full" />
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (mode === "hide") {
    return null
  }

  const meta = TIER_METADATA[requiredTier]

  if (mode === "blur") {
    return (
      <div className={cn("relative group overflow-hidden rounded-xl", className)}>
        <div className="blur-md pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-rp-base/40 p-4 text-center backdrop-blur-[2px]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rp-surface border border-rp-highlight-med shadow-xl">
            <IconLock size={24} className={meta.color} />
          </div>
          <p className="text-sm font-bold text-white mb-1">
            Ascend to {meta.name}
          </p>
          <p className="text-xs text-rp-subtle mb-4 px-4 max-w-[200px]">
            Unlock {feature} and more.
          </p>
          <Link href="/pricing">
            <Button size="sm" className="bg-gradient-to-r from-rp-iris to-rp-love text-white font-bold h-9">
              {meta.price}/mo — Upgrade Now
              <IconRocket size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Default: mode === "lock"
  return (
    <div className={cn("relative rounded-xl border border-dashed border-rp-highlight-med bg-rp-overlay/30 p-8 text-center", className)}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rp-surface border border-rp-highlight-med shadow-2xl">
        <IconLock size={32} className={meta.color} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">
        This feature requires {meta.name}
      </h3>
      <p className="text-sm text-rp-subtle mb-6">
        Ascend to {meta.name} to unlock {feature} and premium creation tools.
      </p>
      <Link href="/pricing">
        <Button className="bg-rp-iris hover:bg-rp-iris/90 text-white font-bold px-8">
          {meta.price}/month — Upgrade Now →
        </Button>
      </Link>
    </div>
  )
}
