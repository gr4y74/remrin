# Creator Economy - Parallel Agent Prompts
## Sessions 6-7: Soul Bazaar

**Date:** December 22, 2024  
**Objective:** Implement creator economy with wallets, marketplace, and transactions

---

## ⚙️ Turbo Workflows

| Command | Description |
|---------|-------------|
| `/verify` | TypeScript check + lint |
| `/commit-deploy` | Auto-commit and push |

---

# SESSION 6: Backend Infrastructure

## 🔵 Agent Pi: Wallets & Balance System

```
=== AGENT PI - WALLETS & BALANCE ===
Session: 6
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in financial systems and Supabase.

Objective: Create the wallet system for tracking user balances (Aether credits).

Tasks:

1. Create migration:
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_wallets.sql
   
   ```sql
   CREATE TABLE wallets (
       user_id TEXT PRIMARY KEY,
       balance_aether INTEGER DEFAULT 100 NOT NULL,  -- Starting credits
       balance_brain INTEGER DEFAULT 1000 NOT NULL,  -- LLM usage credits
       is_creator BOOLEAN DEFAULT false,
       total_earned INTEGER DEFAULT 0,
       total_spent INTEGER DEFAULT 0,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   -- RLS
   ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view own wallet"
   ON wallets FOR SELECT USING (user_id = auth.uid()::text);
   
   CREATE POLICY "Users can update own wallet"
   ON wallets FOR UPDATE USING (user_id = auth.uid()::text);
   
   -- Auto-create wallet on user signup
   CREATE OR REPLACE FUNCTION create_wallet_for_user()
   RETURNS TRIGGER AS $$
   BEGIN
       INSERT INTO wallets (user_id) VALUES (NEW.id::text);
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   
   CREATE TRIGGER trigger_create_wallet
       AFTER INSERT ON auth.users FOR EACH ROW
       EXECUTE FUNCTION create_wallet_for_user();
   ```

2. Create wallet API routes:
   /home/gr4y/Data68/remrin/chat/app/api/wallet/route.ts
   - GET: Fetch current user's wallet
   - Returns: { balance_aether, balance_brain, is_creator }

   /home/gr4y/Data68/remrin/chat/app/api/wallet/topup/route.ts
   - POST: Add credits (for Stripe webhook later)
   - Body: { amount, transaction_id }

3. Create wallet utilities:
   /home/gr4y/Data68/remrin/chat/lib/wallet/index.ts
   - getWallet(userId): Fetch wallet
   - hasBalance(userId, amount): Check if user can afford
   - deductBalance(userId, amount): Subtract from wallet
   - addBalance(userId, amount): Add to wallet

When done: Run /verify then /commit-deploy
```

---

## 🟢 Agent Rho: Market Listings

```
=== AGENT RHO - MARKET LISTINGS ===
Session: 6
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in marketplaces.

Objective: Create the marketplace system for listing souls for sale.

Tasks:

1. Create migration:
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_market_listings.sql
   
   ```sql
   CREATE TABLE market_listings (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       seller_id TEXT NOT NULL,
       persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
       price_aether INTEGER NOT NULL CHECK (price_aether > 0),
       is_limited_edition BOOLEAN DEFAULT false,
       quantity_remaining INTEGER,
       total_sales INTEGER DEFAULT 0,
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE(persona_id)  -- One listing per persona
   );
   
   CREATE INDEX idx_listings_active ON market_listings(is_active, created_at DESC);
   CREATE INDEX idx_listings_seller ON market_listings(seller_id);
   
   ALTER TABLE market_listings ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Anyone can view active listings"
   ON market_listings FOR SELECT USING (is_active = true);
   
   CREATE POLICY "Sellers can manage own listings"
   ON market_listings FOR ALL USING (seller_id = auth.uid()::text);
   ```

2. Create API routes:
   /home/gr4y/Data68/remrin/chat/app/api/marketplace/route.ts
   - GET: List all active listings with persona details
   - Query params: ?category=&sort=price|popular
   
   /home/gr4y/Data68/remrin/chat/app/api/marketplace/[id]/route.ts
   - GET: Single listing details
   - DELETE: Remove listing (seller only)
   
   /home/gr4y/Data68/remrin/chat/app/api/marketplace/list/route.ts
   - POST: Create new listing
   - Body: { persona_id, price_aether, is_limited?, quantity? }

3. Create marketplace utilities:
   /home/gr4y/Data68/remrin/chat/lib/marketplace/index.ts
   - getActiveListings(filters)
   - getListingById(id)
   - createListing(data)
   - removeListing(id)

When done: Run /verify then /commit-deploy
```

---

## 🟡 Agent Sigma: Transactions & Purchase Flow

```
=== AGENT SIGMA - TRANSACTIONS ===
Session: 6
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Backend Engineer specializing in payment systems.

Objective: Create atomic transaction system for purchases with 70/30 split.

Tasks:

1. Create migration:
   /home/gr4y/Data68/remrin/chat/supabase/migrations/20241222_add_ledger.sql
   
   ```sql
   CREATE TYPE transaction_type AS ENUM (
       'PURCHASE', 'SALE', 'PLATFORM_FEE', 'TOP_UP', 'REFUND'
   );
   
   CREATE TABLE ledger_transactions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       from_user_id TEXT,
       to_user_id TEXT,
       amount INTEGER NOT NULL,
       type transaction_type NOT NULL,
       reference_id UUID,  -- listing_id or persona_id
       description TEXT,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE INDEX idx_ledger_user FROM ledger_transactions(from_user_id);
   CREATE INDEX idx_ledger_created ON ledger_transactions(created_at DESC);
   
   ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view own transactions"
   ON ledger_transactions FOR SELECT 
   USING (from_user_id = auth.uid()::text OR to_user_id = auth.uid()::text);
   ```

2. Create purchase API:
   /home/gr4y/Data68/remrin/chat/app/api/marketplace/purchase/route.ts
   
   POST: Execute purchase with atomic transaction
   Body: { listing_id }
   
   Business Logic:
   - Check buyer has sufficient balance
   - Calculate split: 70% to seller, 30% to platform
   - Deduct from buyer
   - Add to seller
   - Record in ledger (3 entries: PURCHASE, SALE, PLATFORM_FEE)
   - Clone persona to buyer's library
   - Update listing sales count
   - All in one transaction

3. Create transaction utilities:
   /home/gr4y/Data68/remrin/chat/lib/transactions/index.ts
   - executePurchase(buyerId, listingId): Full atomic flow
   - getTransactionHistory(userId): User's ledger
   - calculateSplit(amount): Returns { seller, platform }

Platform wallet ID: 'PLATFORM_WALLET'

When done: Run /verify then /commit-deploy
```

---

# SESSION 7: Frontend Components

## 🔵 Agent Tau: Wallet Display & TopUp

```
=== AGENT TAU - WALLET UI ===
Session: 7
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in payment UIs.

Objective: Create wallet display and top-up modal components.

Tasks:

1. Create components directory:
   /home/gr4y/Data68/remrin/chat/components/wallet/

2. Build WalletDisplay.tsx:
   - Shows Aether balance with coin icon
   - Compact version for header/sidebar
   - Expanded version with Brain credits too
   - "Add Funds" button
   - Glassmorphism style

3. Build TopUpModal.tsx:
   - Modal for adding credits
   - Package options: 100 ($10), 500 ($40), 1000 ($75)
   - Stripe checkout button (placeholder for now)
   - Secure payment badges
   - Props: { isOpen, onClose, onSuccess }

4. Build TransactionHistory.tsx:
   - List of recent transactions
   - Icons for different types (purchase, sale, etc)
   - Date, amount, description
   - Infinite scroll or pagination

5. Add wallet to header:
   - Find header component
   - Add WalletDisplay (compact) next to user avatar

6. Create wallet hook:
   /home/gr4y/Data68/remrin/chat/hooks/use-wallet.ts
   - Fetches wallet data
   - Provides balance, loading, refetch

When done: Run /verify then /commit-deploy
```

---

## 🟢 Agent Upsilon: Marketplace Page

```
=== AGENT UPSILON - MARKETPLACE PAGE ===
Session: 7
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in e-commerce UIs.

Objective: Create the marketplace browse and purchase experience.

Tasks:

1. Create marketplace components:
   /home/gr4y/Data68/remrin/chat/components/marketplace/

2. Build ListingCard.tsx:
   - Soul portrait image
   - Name and creator
   - Price in Aether with icon
   - "Buy Now" button
   - Sales count badge
   - Limited edition indicator
   - Hover: scale + glow

3. Build MarketplacePage.tsx:
   - Grid of ListingCards
   - Category filter tabs
   - Sort options (price, popular, new)
   - Search bar
   - Empty state for no results

4. Build PurchaseModal.tsx:
   - Confirm purchase dialog
   - Shows soul preview
   - Price breakdown
   - Current balance display
   - "Confirm Purchase" button
   - Success animation

5. Create route:
   /home/gr4y/Data68/remrin/chat/app/[locale]/marketplace/page.tsx
   - Server component wrapper
   - Fetches initial listings

6. Add to sidebar:
   - Add "Marketplace" link with shop icon
   - Position near Discover

When done: Run /verify then /commit-deploy
```

---

## 🟡 Agent Phi: Creator Dashboard

```
=== AGENT PHI - CREATOR DASHBOARD ===
Session: 7
Workspace: /home/gr4y/Data68/remrin/chat

Role: Senior Frontend Engineer specializing in analytics dashboards.

Objective: Create the creator earnings and sales dashboard.

Tasks:

1. Build CreatorDashboard.tsx:
   /home/gr4y/Data68/remrin/chat/components/creator/CreatorDashboard.tsx
   
   - Total earnings card (big number)
   - Sales this month chart (simple bar)
   - Active listings table
   - Recent sales list
   - "Create Listing" CTA button

2. Build ListingManager.tsx:
   - Table of user's listings
   - Edit price button
   - Toggle active/inactive
   - View sales count
   - Delete listing

3. Build CreateListingModal.tsx:
   - Select persona from user's library
   - Set price input
   - Limited edition toggle
   - Quantity input (if limited)
   - Preview card

4. Build EarningsChart.tsx:
   - Simple bar chart of last 7 days
   - Can use recharts or simple CSS bars

5. Create route:
   /home/gr4y/Data68/remrin/chat/app/[locale]/creator/page.tsx
   - Dashboard wrapper
   - Requires is_creator = true or any listings

6. Create hook:
   /home/gr4y/Data68/remrin/chat/hooks/use-creator-stats.ts
   - Fetches earnings, sales, listings

When done: Run /verify then /commit-deploy
```

---

## 📋 Execution Checklist

### Session 6: Backend
| Agent | Focus | Status |
|-------|-------|--------|
| Pi | Wallets & Balance | ⬜ |
| Rho | Market Listings | ⬜ |
| Sigma | Transactions | ⬜ |

### Session 7: Frontend
| Agent | Focus | Status |
|-------|-------|--------|
| Tau | Wallet UI | ⬜ |
| Upsilon | Marketplace | ⬜ |
| Phi | Creator Dashboard | ⬜ |

---

## 📁 Files to Create

```
Session 6 (Backend):
├── supabase/migrations/
│   ├── 20241222_add_wallets.sql
│   ├── 20241222_add_market_listings.sql
│   └── 20241222_add_ledger.sql
├── app/api/
│   ├── wallet/route.ts
│   ├── wallet/topup/route.ts
│   └── marketplace/
│       ├── route.ts
│       ├── [id]/route.ts
│       ├── list/route.ts
│       └── purchase/route.ts
└── lib/
    ├── wallet/index.ts
    ├── marketplace/index.ts
    └── transactions/index.ts

Session 7 (Frontend):
├── components/
│   ├── wallet/
│   │   ├── WalletDisplay.tsx
│   │   ├── TopUpModal.tsx
│   │   └── TransactionHistory.tsx
│   ├── marketplace/
│   │   ├── ListingCard.tsx
│   │   ├── MarketplacePage.tsx
│   │   └── PurchaseModal.tsx
│   └── creator/
│       ├── CreatorDashboard.tsx
│       ├── ListingManager.tsx
│       └── CreateListingModal.tsx
├── app/[locale]/
│   ├── marketplace/page.tsx
│   └── creator/page.tsx
└── hooks/
    ├── use-wallet.ts
    └── use-creator-stats.ts
```
