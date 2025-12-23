# CTO Agent: UI Redesign Work Assignment

**Project**: 4-Panel Chat Interface Redesign  
**Priority**: High  
**Workspace**: `/home/gr4y/Data68/remrin/chat`

---

## Project Overview

Transform the current single-column chat interface into a modern 4-panel layout:

| Panel | Behavior |
|-------|----------|
| **Icon Sidebar** | 60px collapsed, click to expand |
| **Chat Panel** | Main conversation (always visible) |
| **Canvas/Artifacts** | On-demand like Claude (for code, homework) |
| **Character Panel** | Collapsible hero image + persona info |

### Reference
![Reference Design](/home/gr4y/.gemini/antigravity/brain/a60e5396-e6cc-4a00-9ba5-00ca81ac5e44/reference_design.png)

---

## Color Palette

```css
--almost-black-blue: #030014;
--darker-dark-blue: #181826;
--dark-blue: #212133;
--ram-pink: #de5ba7;
--rem-blue: #236ce1;
--light-purple: #8f46f0;
--dark-purple: #2a0544;
```

---

## Agent Assignments

### 🔴 AGENT 1: Design System & Layout Foundation
**Must complete first - other agents depend on this**

**Objective**: Update CSS variables and create the 4-panel layout skeleton.

**Files to modify**:
- `app/[locale]/globals.css` - Add color palette CSS variables
- `components/ui/dashboard.tsx` - Restructure for 4-panel layout
- `tailwind.config.ts` - Add custom colors if needed

**Deliverables**:
1. CSS variables for Rem/Ram color palette
2. Dark theme updated to use new colors
3. `Dashboard` component with 4 panel slots
4. Panel visibility states: `isSidebarExpanded`, `isCanvasOpen`, `isCharacterPanelOpen`

**Acceptance Criteria**:
- [ ] `npm run build` passes
- [ ] Colors visible in dark mode
- [ ] Layout renders 4 distinct panel areas

---

### 🟡 AGENT 2: Icon Sidebar
**Depends on**: Agent 1 (layout skeleton)

**Objective**: Create thin collapsible icon sidebar.

**Files to create/modify**:
- `components/sidebar/IconSidebar.tsx` [NEW]
- `components/sidebar/sidebar-switcher.tsx` - Reference for icons

**Deliverables**:
1. 60px icon-only sidebar
2. Icons: Chats, Personas, Marketplace, Collection, Settings
3. Click handler to expand full sidebar
4. Smooth slide animation
5. Active state indicator

**Acceptance Criteria**:
- [ ] Sidebar renders at 60px width
- [ ] Click expands to show full sidebar content
- [ ] Navigation icons work correctly

---

### 🟢 AGENT 3: Canvas/Artifacts System
**Can work in parallel with Agent 2 after Agent 1 completes**

**Objective**: Implement Claude-style artifacts panel for code and structured content.

**Files to create/modify**:
- `components/canvas/CanvasPanel.tsx` [NEW]
- `components/canvas/ArtifactTab.tsx` [NEW]
- `components/messages/message.tsx` - Add "Open as Artifact" button
- `context/context.tsx` - Add artifact state

**Deliverables**:
1. `CanvasPanel` component (~450px, right side)
2. Artifact tabs for multiple items
3. Syntax highlighting for code (use existing code block styles)
4. "Open as Artifact" button on code blocks
5. Close/minimize button
6. Copy and download actions

**Key Logic**:
```tsx
// In context
const [artifacts, setArtifacts] = useState<Artifact[]>([])
const [isCanvasOpen, setIsCanvasOpen] = useState(false)

// Artifact type
interface Artifact {
  id: string
  title: string
  content: string
  type: 'code' | 'markdown' | 'math'
  language?: string
}
```

**Acceptance Criteria**:
- [ ] Code blocks have "Open as Artifact" button
- [ ] Clicking opens canvas panel with content
- [ ] Multiple artifacts supported (tabs)
- [ ] Panel can be closed

---

### 🔵 AGENT 4: Character Panel
**Can work in parallel with Agent 2 after Agent 1 completes**

**Objective**: Extract and enhance persona display into collapsible right panel.

**Files to create/modify**:
- `components/character/CharacterPanel.tsx` [NEW]
- `components/chat/chat-ui.tsx` - Remove inline persona header, integrate CharacterPanel

**Deliverables**:
1. `CharacterPanel` component (~300px)
2. Large hero image display
3. Persona name, description, stats
4. Follow button
5. Collapse toggle button
6. Smooth slide animation

**Acceptance Criteria**:
- [ ] Persona image displays prominently
- [ ] Panel can be collapsed
- [ ] Works when no persona selected (hidden or placeholder)

---

## Execution Order

```
┌─────────────────────────────────────────────┐
│ AGENT 1: Design System (START FIRST)        │
│ Duration: ~45 min                           │
└─────────────────────────────────────────────┘
            │
            ▼
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ AGENT 2 │   │ AGENT 3 │   │ AGENT 4 │
│ Sidebar │   │ Canvas  │   │Character│
│ 30 min  │   │ 1 hour  │   │ 30 min  │
└─────────┘   └─────────┘   └─────────┘
    │               │               │
    └───────────────┴───────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │ INTEGRATION (~30 min)│
        │ Run: npm run build   │
        │ Test: npm run dev    │
        └──────────────────────┘
```

---

## Integration Checklist

After all agents complete, verify:
- [ ] `npm run build` passes with no errors
- [ ] Dev server starts: `npm run dev`
- [ ] Sidebar collapses/expands correctly
- [ ] Canvas opens when "Open as Artifact" clicked
- [ ] Character panel shows persona info
- [ ] All panels responsive on resize
- [ ] Dark theme uses new color palette

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `components/ui/dashboard.tsx` | Main layout container |
| `components/chat/chat-ui.tsx` | Chat interface |
| `components/sidebar/sidebar.tsx` | Current full sidebar |
| `context/context.tsx` | Global state |
| `app/[locale]/globals.css` | CSS variables |

---

## Notes for Agents

1. **Run `/verify` before committing** - TypeScript and lint checks
2. **Use existing component patterns** - Check `components/ui/` for examples
3. **Keep state in context** - Use `ChatbotUIContext` pattern
4. **Test dark mode** - All new components must support dark theme
