# Session 9: Monetization (Stripe Integration)

**Date:** December 22, 2024
**Objective:** Implement Stripe checkout, webhooks, and subscription management for the 4-tier pricing model.

---

## ⚙️ Turbo Workflows

| Command | Description |
|---------|-------------|
| `/verify` | TypeScript check + lint |
| `/commit-deploy` | Auto-commit and push |

---

## 🔵 Agent 25 (Alpha): Stripe Setup & API Routes

```
=== AGENT 25 (ALPHA) - STRIPE SETUP ===
Session: 9
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in Stripe integration.

Objective: Set up Stripe SDK, checkout sessions, and webhook infrastructure.

Tasks:

1. Install Stripe:
   Run: `npm install stripe @stripe/stripe-js`

2. Create Stripe Utility:
   /home/gr4y/Data68/remrin/chat/lib/stripe/index.ts
   - Initialize Stripe server-side client
   - Helper to get/create Stripe Customer ID for a user
   - Helper to create Checkout Session (Subscription vs One-time)
   - Helper to create Customer Portal session

3. Create API Routes:
   
   A. Checkout:
   /home/gr4y/Data68/remrin/chat/app/api/stripe/checkout/route.ts
   - POST body: { priceId, isSubscription }
   - Creates checkout session
   - Returns { sessionId, url }
   
   B. Portal:
   /home/gr4y/Data68/remrin/chat/app/api/stripe/portal/route.ts
   - POST
   - Returns URL to Stripe Customer Portal (for managing sub)

   C. Webhook Endpoint (Skeleton):
   /home/gr4y/Data68/remrin/chat/app/api/stripe/webhook/route.ts
   - Verify signature
   - Switch case for events (checkout.session.completed, invoice.payment_succeeded)
   - (Logic will be filled by Agent Beta)

4. Env Vars (Document in README later):
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET

When done: Run /verify then /commit-deploy
```

---

## 🟢 Agent 26 (Beta): Database & Webhook Logic

```
=== AGENT 26 (BETA) - DB & WEBHOOKS ===
Session: 9
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in data integrity and webhooks.

Objective: connect Stripe events to database updates (provisioning tiers and credits).

Tasks:

1. Update Migrations (Schema):
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_subscriptions.sql
   
   - Table: subscriptions (mirror Stripe data)
     - id (text, primary key)
     - user_id (ref auth.users)
     - status (active, incomplete, canceled, etc)
     - price_id (text)
     - current_period_end (timestamptz)
     - created_at
   
   - Update `wallets` table:
     - Ensure `stripe_customer_id` column exists

2. Implement Webhook Logic:
   Update /home/gr4y/Data68/remrin/chat/app/api/stripe/webhook/route.ts
   
   - Handle `checkout.session.completed`:
     - Retrieve `customer_id` and `client_reference_id` (userId)
     - Update user's wallet with `stripe_customer_id`
     - If mode='payment' (Aether Credit Pack):
       - Parse metadata (e.g., credit_amount)
       - Call `wallet.addBalance(userId, amount, 'aether')`
   
   - Handle `customer.subscription.created` / `updated` / `deleted`:
     - Upsert `subscriptions` table
     - Update `wallets.tier` based on price_id
     - Update `wallets.tier_expires_at`

   - Handle `invoice.payment_succeeded`:
     - (Optional) Provision monthly stipend credits if relevant

3. Create Subscription Manager Utility:
   /home/gr4y/Data68/remrin/chat/lib/stripe/subscription.ts
   - syncSubscriptionStatus(userId, subscriptionId)
   - mapPriceIdToTier(priceId) -> 'wanderer' | 'soul_weaver' | 'architect' | 'titan'

When done: Run /verify then /commit-deploy
```

---

## 🟡 Agent 27 (Gamma): Pricing UI & Modals

```
=== AGENT 27 (GAMMA) - FRONTEND UI ===
Session: 9
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in conversion optimization.

Objective: Build the Pricing page and "Buy Credits" interface.

Tasks:

1. Create Pricing Components:
   /home/gr4y/Data68/remrin/chat/components/pricing/
   - PricingCard.tsx (Tier display, features list, "Subscribe" button)
   - CreditPackCard.tsx (Aether packs)
   
2. Create Pricing Page:
   /home/gr4y/Data68/remrin/chat/app/[locale]/pricing/page.tsx
   - Display the 4 tiers (Wanderer, Soul Weaver, Architect, Titan)
   - Highlight "Architect" as Most Popular
   - Toggle for Monthly/Annual (UI only logic for now if just doing monthly)
   
3. Create "Buy Aether" Modal:
   - Accessible from WalletDisplay
   - Shows credit packs ($4.99, $9.99, $24.99)
   - "Buy" button triggers checkout session

4. Hook up Buttons:
   - Use `loadStripe` from `@stripe/stripe-js`
   - Call `/api/stripe/checkout`
   - Redirect to returned URL

5. Update Sidebar/Settings:
   - Add "Billing" link to Settings
   - If subscribed, show "Manage Subscription" (link to Portal) instead of "Upgrade"

When done: Run /verify then /commit-deploy
```
