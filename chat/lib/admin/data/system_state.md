# SYSTEM_STATE.md - Project Sovereignty Remrin Audit

## Executive Summary
This document clusters current technical debt and architectural friction points into "Root Cause Pillars". The goal is to provide a clear roadmap for stabilization before proceeding with any new feature development.

## 1. Root Cause Pillars

### Pillar A: Loose Typed Architecture (The "ChatChunk" Silence)
The most pervasive issue in the codebase is the intermittent/missing type definitions for core streaming primitives like `ChatChunk`. This leads to downstream fragility in every LLM provider implementation.
- **Noise Concentration:** `lib/chat-engine/providers/*`
- **Impact:** High fragility during streaming; difficult to refactor providers without breaking core chat logic.

### Pillar B: Incomplete Gacha/Carrot Integration
Logic for the "Carrot Follow-up Engine" and certain Gacha persona types are referenced in API routes (`v2/chat/route.ts`) but lack corresponding type definitions or interface implementations in the central library.
- **Noise Concentration:** `app/api/v2/chat/route.ts`, `app/api/forge/*`
- **Impact:** Prevents clean builds; buried logic that isn't functionally linked but "ghost-signed".

### Pillar C: Component/Context Sync Friction
The shift to `Chat-V2` has left artifacts in `ChatMessage.tsx` where properties like `selectedVoiceId` and `personaId` are accessed on types that no longer define them. This indicates a mismatch between the global context and component expectations.
- **Noise Concentration:** `components/chat-v2/ChatMessage.tsx`
- **Impact:** Runtime risks and TypeScript noise; features (like voice) might be partially broken due to prop-drilling or context changes.

### Pillar D: UI Redesign "Half-Life"
The 4-Panel Redesign (Wave 7) has introduced significant Tailwind CSS ordering "noise". While not breaking logic, it represents the largest volume of linting warnings (approx. 10k lines of noise). This obscures critical logic errors.
- **Noise Concentration:** `app/[locale]/...`
- **Impact:** Extreme developer friction; "Lint Fatigue" causes one to miss actual bugs.

### Pillar E: Permissive Admin/Auth Layers
Security audits indicate that while most of the platform is secured by Supabase Auth, the Admin Analytics and LLM Config routes have permissive or inconsistent authentication checks (e.g., sessionStorage vs. headers).
- **Noise Concentration:** `app/api/admin/*`, `app/[locale]/admin/*`
- **Impact:** Security risk; inconsistent admin experience (some pages gate by password, others don't).

## 2. Top 5 Architectural Shifts Causing Noise
1. **Chat-V1 to Chat-V2 Migration:** Left dangling imports and mismatched context props.
2. **Provider Modularization:** Decoupling LLM providers without a strict shared interface (Missing `ChatChunk`).
3. **The 4-Panel Redesign Skeleton:** Massive influx of utility-first CSS that hasn't been optimized or ordered.
4. **The Gacha Roll-out:** Introduction of "Carrot" logic into the core chat stream before the library was ready.
5. **Admin Console Expansion:** Rapid expansion of admin features without a unified security wrapper.

## 3. Stabilization Strategy (Audit Directive)
1. **Sync Core Types:** Resolve `ChatChunk` and `CarrotEngine` types.
2. **Clean Pulse:** Automate Tailwind class sorting to remove "The 10k Warning Trap".
3. **Sync Context:** Align `RemrinContext` with `ChatMessage.tsx` requirements.
4. **Hard-Gate Admin:** Unified header-based auth for all admin API routes.
