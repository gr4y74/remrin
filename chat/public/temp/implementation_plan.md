# Remrin API — Standalone Licensable Product Blueprint

The goal is to take the R.E.M. Engine, Unimatric, and all related infrastructure
currently embedded in the Remrin.ai monorepo and deliver it as a fully isolated,
licensable product with a Developer Portal, SDK, and Browser Extension.

---

## Estimated Timeline

| Phase | Name | Estimated Time |
| :--- | :--- | :--- |
| 1 | Fix & Stabilize (current monorepo) | **2–3 days** |
| 2 | Complete the Developer Portal | **1–2 weeks** |
| 3 | Unimatric Dashboard & Spark UI | **1 week** |
| 4 | Browser Extension | **2–3 weeks** |
| 5 | API Vault Extraction (new repo) | **1–2 weeks** |
| 6 | SDK Packaging & NPM Publish | **3–5 days** |
| 7 | Licensing Infrastructure (Stripe) | **1 week** |

**Total realistic estimate: 8–12 weeks of focused agent sessions.**

> [!IMPORTANT]
> Phases 1–4 happen inside the CURRENT monorepo.
> Phase 5 is the extraction event — after that, all future API work
> happens in the new isolated repo.

---

## Open Questions Before Starting

> [!IMPORTANT]
> **Browser Extension — What does it DO?**
> This is greenfield. We need to decide its core purpose before building:
> - Option A: A **companion overlay** — injects Rem into any webpage as a chat bubble.
> - Option B: A **developer tool** — shows API key status, Spark scores, and live token usage.
> - Option C: Both — a "switchable" extension with a user mode and a dev mode.
>
> **Please decide this before we start Phase 4.**

> [!IMPORTANT]
> **Licensing Model — How do you want to charge?**
> The Stripe schema is already in the monorepo. We need to decide:
> - Per-seat (pay per API licensee organization)?
> - Usage-based (pay per 1,000 API calls)?
> - Tiered plans (Sandbox free, Pro $X/mo, Enterprise custom)?
>
> This decision shapes the entire Phase 7 build.

---

## Phase 1: Fix & Stabilize (Current Monorepo)
*Estimated: 2–3 days*

These are known broken items that must be fixed before anything else.

### 1A — Sandbox Provisioning DB Error
#### [MODIFY] `app/api/v1/sandbox/provision/route.ts`
- The anonymous fallback `owner_user_id` is hardcoded to a specific user UUID.
- Fix: Query a `system_accounts` table or use the authenticated user reliably.
- Verify the full provision flow works end-to-end (tenant created → key generated → persona seeded → success response).

### 1B — Developer Portal Routing
#### [MODIFY] `app/developers/layout.tsx` + `middleware.ts`
- The `/developers` route has had persistent redirect loop issues.
- Fix: Harden the middleware exclusion so `/developers` is never caught by i18n or auth redirects.
- Verify at `http://localhost:3000/developers` with no sidebar bleed.

### 1C — Unimatric Verification
#### [VERIFY] `lib/ai/unimatric/scorer.ts`
- The `ALTER TABLE` fix for `BIT(50) → TEXT` has been applied.
- Must verify: Trigger a real chat turn and confirm rows appear in `unimatric_states`, `unimatric_metrics`, and `unimatric_ledger`.

---

## Phase 2: Developer Portal — Full Implementation
*Estimated: 1–2 weeks*

The current portal is a static landing page with a broken sandbox button.
A real developer portal needs a full dashboard experience.

### 2A — Landing Page (Public, No Auth Required)
#### [MODIFY] `app/developers/page.tsx`
- Premium "Stripe-level" marketing page with:
  - Hero: "The Headless AI Relationship Engine"
  - Feature grid: Memory, Multi-tenant, Unimatric, Relational Graph
  - "Provision Sandbox" CTA (must work)
  - Quick Start `curl` example
  - SDK code snippet
  - Pricing tiers preview
  - Link to Dashboard (requires login)

### 2B — Developer Dashboard (Auth Required)
#### [NEW] `app/developers/dashboard/page.tsx`
- Requires Remrin.ai login to access.
- Shows:
  - All API keys (sandbox and production)
  - Key creation / revocation UI
  - Per-key usage stats (API calls this month)
  - Tenant info (slug, plan, expiry)
  - Link to OpenAPI docs

### 2C — API Documentation Page
#### [NEW] `app/developers/docs/page.tsx`
- Render the existing `docs/openapi.yaml` using a Swagger/Scalar/Redoc component.
- Sections: Authentication, Chat Completions, Memory, Lockets, Relationships, Sandbox.

### 2D — Sandbox Flow Completion
#### [MODIFY] `components/developers/SandboxGenerator.tsx`
- On success: show the full key, persona ID, and tenant slug in a copy-ready card.
- Add a live test button: sends a real `curl`-equivalent POST using the new key and shows the streamed response in the UI.
- Add expiry countdown (30 days).

---

## Phase 3: Unimatric Dashboard & Spark UI
*Estimated: 1 week*

The Unimatric Engine is scoring every turn but the data goes nowhere visible.
This phase surfaces it to the user.

### 3A — Spark Status API Endpoint
#### [NEW] `app/api/unimatric/status/route.ts`
- Returns the current `unimatric_states` row for a given `session_id`.
- Returns: spark balance, unlocked node count, unlocked mask, exposure mode.
- Auth: session cookie (user can only see their own sessions).

### 3B — Unimatric Status Component
#### [NEW] `components/chat/UnimatricStatus.tsx`
- Small, non-intrusive overlay inside the chat UI.
- In `silent` mode: invisible (engine runs hidden).
- In `easter_egg` mode: shows a subtle pulsing icon. Hovering shows "???" tooltip.
- In `companion` mode: shows a 50-node grid with unlocked/locked indicators.

### 3C — Exposure Mode Toggle (Admin / Creator)
#### [MODIFY] Cockpit or Admin panel
- Allow the persona creator to set `exposure_mode` for their persona's sessions.
- Options: `silent`, `easter_egg`, `companion`.

---

## Phase 4: Browser Extension
*Estimated: 2–3 weeks*

This is a greenfield project. Architecture decision required before starting (see Open Questions).

### Assumed Scope (pending your decision): Option A — Companion Overlay

#### [NEW] `/browser-extension/` — Standalone directory at repo root
This is NOT a Next.js app. It is a Chrome Extension (Manifest V3).

```
/browser-extension/
  manifest.json         ← Extension config, permissions
  /src/
    background.ts       ← Service worker: auth token management
    content.ts          ← Injected into every page: renders the bubble
    popup.tsx           ← The 400x600px panel the user sees on click
    /components/
      ChatBubble.tsx    ← Floating button on the page
      ChatPanel.tsx     ← The slide-in panel with Rem
      AuthFlow.tsx      ← Login with Remrin API key
  /styles/
    panel.css           ← Isolated CSS (shadow DOM to prevent bleed)
  /public/
    icon-16.png
    icon-48.png
    icon-128.png
```

**Authentication**: The extension authenticates using a `rmrn_pk_` production key
that the user pastes in on first launch. It stores this key securely using
`chrome.storage.local` (encrypted at rest by Chrome).

**Communication**: The extension POSTs to `https://api.remrin.ai/v1/chat/completions`
using SSE streaming, exactly as any other API consumer would.

**Build Tool**: Vite + React (lightweight, fast builds, Manifest V3 compatible).

---

## Phase 5: API Vault Extraction
*Estimated: 1–2 weeks*

This is the physical isolation event. After this phase, the API has its own home.

### 5A — New GitHub Repository
- Create: `github.com/[your-org]/remrin-api` (private)
- Initialize as a standalone **Next.js** app (or consider **Hono** for a lighter pure-API server).

### 5B — Files to Copy into the New Repo

| Source (monorepo) | Destination (new repo) | Notes |
| :--- | :--- | :--- |
| `lib/rem-engine/` | `lib/rem-engine/` | Core engine, verbatim |
| `lib/ai/unimatric/` | `lib/ai/unimatric/` | Scoring engine |
| `lib/sdk/` | `lib/sdk/` | Client SDK |
| `lib/api/auth-middleware.ts` | `lib/api/auth-middleware.ts` | B2B auth |
| `app/api/v1/` | `app/api/v1/` | All v1 routes |
| `app/api/v2/` | `app/api/v2/` | All v2 routes |
| `app/developers/` | `app/developers/` | Developer portal |
| `supabase/migrations/20260429*` | `supabase/migrations/` | API-specific migrations only |
| `docs/openapi.yaml` | `docs/openapi.yaml` | API spec |

### 5C — New Supabase Project
- Create a **second Supabase project**: `remrin-api` (isolated from the main platform).
- Run only the API-specific migrations (the `20260429_*` series + Unimatric migration).
- The platform's social features, gacha, audio, etc. stay in the original Supabase project.

### 5D — DNS Setup
- Point `api.remrin.ai` at the new Vercel/server deployment.
- Platform continues to call `api.remrin.ai` for its own AI features (now consuming its own API like any other licensee).

### 5E — API Route Inventory (What Stays, What Goes)

**ENGINE routes (go to new repo):**
`/api/v1/chat/completions`, `/api/v1/locket/*`, `/api/v1/memories/*`,
`/api/v1/persona/*`, `/api/v1/relationships/*`, `/api/v1/sandbox/*`,
`/api/v2/chat`, `/api/v2/knowledge/*`, `/api/v2/locket`, `/api/v2/memories/*`,
`/api/v2/persona/*`, `/api/v2/personas/*`, `/api/v2/search`, `/api/v2/studio/*`

**PLATFORM routes (stay in monorepo):**
`/api/admin/*`, `/api/audio/*`, `/api/chat/*`, `/api/editions/*`,
`/api/gacha/*`, `/api/game/*`, `/api/moments/*`, `/api/posts/*`,
`/api/profile/*`, `/api/spark/*`, `/api/stripe/*`, `/api/sudodo/*`,
`/api/wallet/*`, `/api/notifications/*`, `/api/forge/*`

---

## Phase 6: SDK Packaging & NPM Publish
*Estimated: 3–5 days*

### 6A — Package Setup
#### [NEW] `packages/remrin-sdk/package.json`
```json
{
  "name": "@remrin/sdk",
  "version": "1.0.0",
  "description": "Official JavaScript SDK for the Remrin AI Relationship Engine API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "license": "MIT"
}
```

### 6B — Build Pipeline
- Use `tsup` to bundle `lib/sdk/remrin-client.ts` into CJS + ESM + `.d.ts` types.
- Output: `dist/` folder.

### 6C — Documentation
- `README.md` with installation, authentication, and quick-start examples.
- Full TypeScript type exports so licensees get autocomplete.

### 6D — Publish
- `npm publish --access=public` (or `--access=restricted` for private licensees).

---

## Phase 7: Licensing Infrastructure
*Estimated: 1 week*

### 7A — Stripe Integration
#### [MODIFY] `app/developers/dashboard/page.tsx`
- "Upgrade to Production" button → Stripe Checkout for monthly plan.
- Plans: Sandbox (free), Developer ($X/mo), Enterprise (custom).

### 7B — Tenant Provisioning on Payment
#### [MODIFY] `app/api/webhooks/stripe/route.ts`
- On `checkout.session.completed`: automatically upgrade tenant `plan` from `sandbox` to `developer`.
- Generate a `rmrn_pk_` production key and email it to the purchaser.

### 7C — Usage Metering
#### [NEW] `lib/api/usage-tracking.ts`
- Increment a `usage_count` on `tenant_api_keys` on every API call.
- Expose this count in the developer dashboard.
- Optionally: hard-enforce daily rate limits based on plan tier.

---

## Verification Plan

### After Phase 1
- `POST /api/v1/sandbox/provision` returns a valid key with no 500 error.
- `GET http://localhost:3000/developers` shows the portal with no redirect or UI bleed.

### After Phase 2
- A non-technical person can visit `/developers`, click "Provision", get a key, and run the `curl` example successfully.

### After Phase 3
- Open a chat with any persona. After the first message, query `unimatric_states`. A row should exist with `current_spark_balance > 0`.

### After Phase 4
- Load the browser extension in Chrome Developer Mode.
- Paste an API key. Send a message. Receive a streamed response from the Remrin API.

### After Phase 5
- `https://api.remrin.ai/v1/chat/completions` returns a valid SSE stream.
- The main Remrin.ai platform still works, now calling the isolated API.
- The monorepo no longer contains `lib/rem-engine/`.

### After Phase 6
- `npm install @remrin/sdk` works.
- The Quick Start example in the SDK README works with a sandbox key.

### After Phase 7
- Completing a Stripe checkout upgrades a sandbox tenant to production.
- The production key is delivered and works with no sandbox restrictions.
