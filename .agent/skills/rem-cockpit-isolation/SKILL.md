---
name: Rem Cockpit Isolation
description: Ensure /rem is treated as a standalone entity, independent of the main Remrin platform aesthetics and navigation.
---

# Rem Cockpit Isolation Skill

Use this skill when modifying the `/rem` route or its associated components. This route is a **standalone unit** and must remain visually and architecturally isolated from the rest of the Remrin platform.

## Core Philosophy

The Rem Cockpit is a high-precision "Pilot Cockpit" for interacting with Rem Rin. Unlike the Discover or Feed pages, it is **not a social platform**. It is a focused, professional tool.

## Isolation Rules

### 1. Route Standalone Status
Architecture for isolation is defined in [RootLayoutContainer.tsx](file:///mnt/Data68/remrin/chat/components/layout/RootLayoutContainer.tsx).
- **No Global Sidebar**: The main platform sidebar must NOT render on `/rem`.
- **No Global Header**: The `FrontPageHeader` and `FloatingPillNav` must NOT render.
- **Standalone Layout**: The Cockpit must provide its own navigation and sidebar logic.

### 2. Aesthetic Isolation (Theme Romrin)
The Cockpit uses the `.theme-romrin` class to override global Rosé Pine variables.
- **Background**: Always use deep black/grey (`#121113`) instead of the purple `bg-rp-base`.
- **Accents**: Primary color is Peach/Orange (`#e78a53`). Secondary is Teal (`#5f8787`).
- **Typography**: 
    - Display/UI: **Outfit**
    - Messages/Content: **Merriweather** (High-contrast serif for reading)
    - Code/Data: **JetBrains Mono**
- **Waves**: Global geode wave backgrounds must NEVER leak into the Cockpit. It must have a clean, focused dark background.

### 3. Component Hierarchy
Only use Cockpit-specific components to maintain look-and-feel:
- Sidebar: `ChatSoloSidebar`
- Input: `ChatSoloInput` (with gradient-glow border)
- Message: `ChatSoloMessage` (centered, professional)
- Panels: `ArtifactsPanel` for slide-in code/preview views.

### 4. Data Isolation
- **Solo Workspace**: All interactions must target the "Solo Workspace" data layer.
- **Memory Persistence**: Use the V3 Memory stack (Locket, User Profile Graph) specifically for Rem.

## Developer Guidelines

> [!IMPORTANT]
> Never apply platform-wide CSS tricks (like geode waves or glassmorphism banners) to the Cockpit unless specifically asked for high-fidelity refinement within the Romrin theme.

- **DO** use `cn("theme-romrin dark", ...)` on outer containers to activate isolation.
- **DO** use **Merriweather** for long-form agent responses to maintain the "high-precision" feel.
- **DO NOT** use `PageTemplate` with default backgrounds; the Cockpit should be its own root-level UI.
- **DO NOT** use brand purple colors (`rp-iris`, `rp-love`) within the Cockpit unless they match the Romrin palette.

## Checklist for Cockpit Changes
- [ ] Outer wrapper has `.theme-romrin` and `.dark` classes.
- [ ] No global platform elements are visible (Sidebar/Header).
- [ ] Typography uses Merriweather for messages.
- [ ] Accents are Peach (#e78a53) and Teal (#5f8787).
- [ ] Data persistence targets solo-specific tables/logic.
