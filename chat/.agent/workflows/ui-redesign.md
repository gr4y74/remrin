---
description: Execute the 4-Panel Chat Interface UI Redesign
---

# UI Redesign Workflow

This workflow executes the 4-Panel Chat Interface Redesign as defined in `/docs/UI_REDESIGN_WORK_ASSIGNMENT.md`.

## Reference
- Full spec: [UI_REDESIGN_WORK_ASSIGNMENT.md](file:///home/gr4y/Data68/remrin/chat/docs/UI_REDESIGN_WORK_ASSIGNMENT.md)

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

## Phase 1: Design System & Layout Foundation (AGENT 1)
**Must complete first - other phases depend on this**

### Steps:
1. Update `app/[locale]/globals.css`:
   - Add Rem/Ram color palette CSS variables
   - Update dark theme to use new colors

2. Update `tailwind.config.ts`:
   - Add custom colors matching CSS variables

3. Restructure `components/ui/dashboard.tsx`:
   - Create 4-panel layout skeleton
   - Add state: `isSidebarExpanded`, `isCanvasOpen`, `isCharacterPanelOpen`
   - Layout: IconSidebar (60px) | Chat Panel | Canvas (450px) | Character Panel (300px)

// turbo
4. Run verification:
```bash
npm run build
```

---

## Phase 2: Icon Sidebar (AGENT 2)
**Depends on Phase 1**

### Steps:
1. Create `components/sidebar/IconSidebar.tsx`:
   - 60px width icon-only sidebar
   - Icons: Chats, Personas, Marketplace, Collection, Settings
   - Click handler to expand full sidebar
   - Smooth slide animation (300ms ease)
   - Active state indicator

2. Integrate into Dashboard:
   - Replace current sidebar toggle with IconSidebar
   - Wire up expand/collapse state

// turbo
3. Run verification:
```bash
npm run build
```

---

## Phase 3: Canvas/Artifacts System (AGENT 3)
**Can run parallel with Phase 2 after Phase 1**

### Steps:
1. Add artifact state to `context/context.tsx`:
```tsx
const [artifacts, setArtifacts] = useState<Artifact[]>([])
const [isCanvasOpen, setIsCanvasOpen] = useState(false)

interface Artifact {
  id: string
  title: string
  content: string
  type: 'code' | 'markdown' | 'math'
  language?: string
}
```

2. Create `components/canvas/CanvasPanel.tsx`:
   - ~450px width, right side of chat
   - Artifact tabs for multiple items
   - Close/minimize button
   - Copy and download actions

3. Create `components/canvas/ArtifactTab.tsx`:
   - Tab UI for switching artifacts
   - Syntax highlighting for code

4. Update `components/messages/message.tsx`:
   - Add "Open as Artifact" button on code blocks

// turbo
5. Run verification:
```bash
npm run build
```

---

## Phase 4: Character Panel (AGENT 4)
**Can run parallel with Phase 2 after Phase 1**

### Steps:
1. Create `components/character/CharacterPanel.tsx`:
   - ~300px width, rightmost panel
   - Large hero image display
   - Persona name, description, stats
   - Follow button
   - Collapse toggle button
   - Smooth slide animation

2. Update `components/chat/chat-ui.tsx`:
   - Remove inline persona header
   - Integrate CharacterPanel conditionally

// turbo
3. Run verification:
```bash
npm run build
```

---

## Phase 5: Integration & Testing

### Steps:
// turbo
1. Full build test:
```bash
npm run build
```

// turbo
2. Start dev server and test:
```bash
npm run dev
```

3. Manual verification checklist:
   - [ ] Sidebar collapses/expands correctly
   - [ ] Canvas opens when "Open as Artifact" clicked
   - [ ] Character panel shows persona info
   - [ ] All panels responsive on resize
   - [ ] Dark theme uses new color palette

// turbo
4. Commit and deploy:
```bash
/commit-deploy
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `components/ui/dashboard.tsx` | Main layout container |
| `components/chat/chat-ui.tsx` | Chat interface |
| `components/sidebar/sidebar.tsx` | Current full sidebar |
| `context/context.tsx` | Global state |
| `app/[locale]/globals.css` | CSS variables |
