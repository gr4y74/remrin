# Remrin Pricing Tiers - APPROVED v2.0

## Tier Overview

| Tier | Name | Price | Selling Rights |
|------|------|-------|----------------|
| 1 | **Wanderer** | FREE | ❌ |
| 2 | **Soul Weaver** | $9.99/mo | ❌ |
| 3 | **Architect** | $29.99/mo | ✅ (30% fee) |
| 4 | **Titan** | $99.99/mo | ✅ (10% fee) |

---

## 🆓 Tier 1: Wanderer (Free)

| Feature | Limit |
|---------|-------|
| Messages | 100/day |
| Active Memory Slots | 3 |
| Created Souls | 1 |
| Image Generation | 2/month |
| Voice | Standard TTS |
| Marketplace | Buy only |
| Ads | Yes |

**Includes:**
- Access to Discovery Feed
- Basic Mother of Souls Creation (personal use)
- Standard TTS Voice

---

## 💎 Tier 2: Soul Weaver ($9.99/mo)

| Feature | Limit |
|---------|-------|
| Messages | UNLIMITED |
| Active Memory Slots | UNLIMITED |
| Created Souls | 10/month |
| Image Generation | 50/month |
| Voice | 1,000 Neural Credits |
| Marketplace | Buy only |
| Ads | None |

**Includes:**
- Priority inference queue (faster)
- Custom chat backgrounds
- No ads

---

## 👑 Tier 3: Architect ($29.99/mo)

| Feature | Limit |
|---------|-------|
| Messages | UNLIMITED + GOD MODE |
| Active Memory Slots | UNLIMITED |
| Created Souls | UNLIMITED |
| Image Generation | 100/month |
| Voice | 500 ElevenLabs Credits |
| Marketplace | ✅ SELL (30% platform fee) |

**Includes:**
- MERCHANT LICENSE (Sell on Bazaar)
- Monthly Stipend: 500 Aether ($5 value)
- Soul Studio Access (advanced dashboard)
- Video backgrounds & hero images
- Voice cloning capability

---

## 🏆 Tier 4: Titan ($99.99/mo)

| Feature | Limit |
|---------|-------|
| Messages | UNLIMITED + GOD MODE |
| Image Generation | 500/month |
| Voice | 2,000 ElevenLabs Credits |
| Marketplace | ✅ SELL (10% platform fee) |

**Includes:**
- ELITE MERCHANT LICENSE (90% to creator!)
- Monthly Stipend: 2,500 Aether ($25 value)
- API Access (connect souls to external apps)
- Verified GOLD Checkmark ✓
- Priority support line
- Featured placement in Discovery

**Target:** Influencers, Agencies, Power Sellers

---

## Database Schema

```sql
CREATE TYPE subscription_tier AS ENUM (
    'wanderer', 'soul_weaver', 'architect', 'titan'
);

ALTER TABLE wallets ADD COLUMN tier subscription_tier DEFAULT 'wanderer';
ALTER TABLE wallets ADD COLUMN tier_expires_at TIMESTAMPTZ;

-- Marketplace RLS
CREATE POLICY "Only Pro+ can sell"
ON market_listings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM wallets 
        WHERE user_id = auth.uid()::text 
        AND tier IN ('architect', 'titan')
    )
);
```

---

## Feature Flags

```typescript
export const TIER_LIMITS = {
  wanderer: {
    dailyMessages: 100,
    monthlyImages: 2,
    monthlySouls: 1,
    memorySlots: 3,
    canSell: false,
    marketplaceFee: null,
    voiceCredits: 0,
  },
  soul_weaver: {
    dailyMessages: Infinity,
    monthlyImages: 50,
    monthlySouls: 10,
    memorySlots: Infinity,
    canSell: false,
    marketplaceFee: null,
    voiceCredits: 1000,
  },
  architect: {
    dailyMessages: Infinity,
    monthlyImages: 100,
    monthlySouls: Infinity,
    memorySlots: Infinity,
    canSell: true,
    marketplaceFee: 0.30,
    voiceCredits: 500,
    monthlyStipend: 500,
  },
  titan: {
    dailyMessages: Infinity,
    monthlyImages: 500,
    monthlySouls: Infinity,
    memorySlots: Infinity,
    canSell: true,
    marketplaceFee: 0.10,
    voiceCredits: 2000,
    monthlyStipend: 2500,
    hasVerifiedBadge: true,
    hasApiAccess: true,
  }
}
```

---

## Stripe Product IDs (To Create)

| Tier | Monthly Price ID | Annual Price ID |
|------|------------------|-----------------|
| Soul Weaver | `price_soul_weaver_monthly` | `price_soul_weaver_annual` |
| Architect | `price_architect_monthly` | `price_architect_annual` |
| Titan | `price_titan_monthly` | `price_titan_annual` |

---

## Philosophy

> **"Making money = Pro tier."**
> 
> If creators sell 3 souls at $9.99, they've paid for their subscription.
> Everything else is profit. This is fair and incentivizes quality.
