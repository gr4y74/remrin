import { SubscriptionTier } from "@/lib/server/feature-gates";

export type FeatureKey =
  | "soul_count"
  | "animated_avatar"
  | "audio_upload"
  | "custom_voice"
  | "advanced_tuning"
  | "store_tab"
  | "analytics_tab"
  | "marketplace_sell"
  | "voice_mode_limit";

export interface Permission {
  enabled: boolean;
  limit?: number;
}

export const TIER_PERMISSIONS: Record<SubscriptionTier, Record<FeatureKey, Permission>> = {
  wanderer: {
    soul_count: { enabled: true, limit: 1 },
    animated_avatar: { enabled: false },
    audio_upload: { enabled: false },
    custom_voice: { enabled: false },
    advanced_tuning: { enabled: false },
    store_tab: { enabled: false },
    analytics_tab: { enabled: false },
    marketplace_sell: { enabled: false },
    voice_mode_limit: { enabled: true, limit: 10 },
  },
  soul_weaver: {
    soul_count: { enabled: true, limit: 5 },
    animated_avatar: { enabled: true },
    audio_upload: { enabled: true },
    custom_voice: { enabled: true },
    advanced_tuning: { enabled: true },
    store_tab: { enabled: false },
    analytics_tab: { enabled: false },
    marketplace_sell: { enabled: false },
    voice_mode_limit: { enabled: true, limit: Infinity },
  },
  architect: {
    soul_count: { enabled: true, limit: Infinity },
    animated_avatar: { enabled: true },
    audio_upload: { enabled: true },
    custom_voice: { enabled: true },
    advanced_tuning: { enabled: true },
    store_tab: { enabled: true },
    analytics_tab: { enabled: true },
    marketplace_sell: { enabled: true },
    voice_mode_limit: { enabled: true, limit: Infinity },
  },
  titan: {
    soul_count: { enabled: true, limit: Infinity },
    animated_avatar: { enabled: true },
    audio_upload: { enabled: true },
    custom_voice: { enabled: true },
    advanced_tuning: { enabled: true },
    store_tab: { enabled: true },
    analytics_tab: { enabled: true },
    marketplace_sell: { enabled: true },
    voice_mode_limit: { enabled: true, limit: Infinity },
  },
};

export const TIER_METADATA: Record<SubscriptionTier, { name: string; price: string; color: string }> = {
  wanderer: { name: "Wanderer", price: "Free", color: "text-rp-subtle" },
  soul_weaver: { name: "Soul Weaver", price: "$9.99", color: "text-rp-foam" },
  architect: { name: "Architect", price: "$19.99", color: "text-rp-iris" },
  titan: { name: "Titan", price: "$49.99", color: "text-rp-love" },
};

/**
 * Check if a tier has access to a specific feature
 */
export function hasPermission(tier: SubscriptionTier, feature: FeatureKey): boolean {
  return TIER_PERMISSIONS[tier]?.[feature]?.enabled ?? false;
}

/**
 * Get the limit for a numeric feature
 */
export function getFeatureLimit(tier: SubscriptionTier, feature: FeatureKey): number {
  return TIER_PERMISSIONS[tier]?.[feature]?.limit ?? 0;
}

/**
 * Check if a value is within the limit for a tier
 */
export function isWithinLimit(tier: SubscriptionTier, feature: FeatureKey, currentCount: number): boolean {
  const limit = getFeatureLimit(tier, feature);
  return currentCount < limit;
}
