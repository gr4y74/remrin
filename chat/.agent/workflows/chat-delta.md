---
description: Agent Delta - Design System (Windows XP / AOL 9.0 Era UI Refresh)
---
# Agent Delta: Design System

**Recommended LLM**: Claude Sonnet 4 - Best for design systems, CSS, and visual consistency

**MODE**: TURBO - Auto-proceed with all steps. Do NOT ask for confirmation.

## Mission
Transform the current Windows 95 aesthetic into a polished Windows XP / AOL 9.0 era design (early-mid 2000s). Clean, modern-retro, and actually usable.

## Design Direction
- **Era**: Windows XP (Luna theme) / AOL 9.0 / AIM 5.x (2001-2005)
- **Key characteristics**:
  - Rounded corners (not boxy)
  - Gradient title bars (blue to lighter blue)
  - Drop shadows
  - Softer, more colorful palette
  - Lucida Sans / Tahoma fonts
  - Translucent/glass effects (subtle)
  - Warmer grays instead of harsh silver

## Tasks

### 1. Remove Desktop Icons
// turbo
Update `/app/[locale]/aol/page.tsx`:
- Remove the DesktopIcon component and all desktop icon rendering
- Remove the teal desktop background
- Create a cleaner, more app-like layout

### 2. Create XP-Era Design Tokens
// turbo
Create `/components/aol-chat/styles/xp-theme.css`:
```css
:root {
  /* XP Luna Blue palette */
  --xp-blue-dark: #0a246a;
  --xp-blue-primary: #0054e3;
  --xp-blue-light: #3a6ea5;
  --xp-blue-highlight: #4a9eff;
  
  /* Window colors */
  --xp-window-bg: #ece9d8;
  --xp-window-border: #0054e3;
  --xp-titlebar-active: linear-gradient(180deg, #0054e3 0%, #0042b0 50%, #0054e3 100%);
  --xp-titlebar-inactive: linear-gradient(180deg, #7f9db9 0%, #6d8cb3 50%, #7f9db9 100%);
  
  /* Button colors */
  --xp-button-bg: linear-gradient(180deg, #fff 0%, #ece9d8 100%);
  --xp-button-border: #003c74;
  --xp-button-hover: linear-gradient(180deg, #fff 0%, #d4d0c8 100%);
  
  /* Text */
  --xp-text-primary: #000;
  --xp-text-secondary: #4a4a4a;
  
  /* AIM-specific */
  --aim-yellow: #ffcc00;
  --aim-orange: #ff6600;
  --aim-buddy-online: #00cc00;
  --aim-buddy-away: #cccc00;
  --aim-buddy-offline: #999999;
}
```

### 3. Redesign Win95Window → XPWindow
// turbo
Create `/components/aol-chat/XPWindow.tsx`:
- Rounded corners (6-8px)
- Gradient blue title bar
- Proper XP-style window buttons (minimize, maximize, close)
- Drop shadow
- Smoother resize handles
- Glass-like effect on borders

### 4. Redesign Buttons
// turbo
Create `/components/aol-chat/XPButton.tsx`:
- Rounded corners (3px)
- Gradient background
- Subtle border
- Hover/active states
- Focus ring

### 5. Redesign Input Fields
// turbo
Create `/components/aol-chat/XPInput.tsx`:
- Rounded corners
- Subtle inset shadow
- Blue focus border
- Proper padding

### 6. Update BuddyListWindow Design
// turbo
Redesign to match AIM 5.x:
- Rounded window
- Yellow/orange gradient header area with AIM branding
- Cleaner buddy list with better spacing
- Smoother expand/collapse animations
- Bottom toolbar with icon buttons

### 7. Update ChatRoomWindow Design
// turbo
Redesign to match AOL 9.0 chat:
- Gradient blue header
- Cleaner message area with alternating row colors
- Better user list styling
- Modern send button
- Emoji/emoticon button

### 8. Update IMWindow Design
// turbo
Redesign to match AIM conversation window:
- Compact title bar
- Chat bubbles with rounded corners
- Typing indicator area
- Format toolbar (bold, italic, color)
- Send button with gradient

### 9. Create New Page Layout
// turbo
Update `/app/[locale]/aol/page.tsx`:
- Remove desktop metaphor
- Create a clean app shell:
  - Left sidebar: Buddy List (collapsible)
  - Center: Active chat/room
  - Optional right sidebar: Room directory or online users
- Add a top toolbar/header with branding

### 10. Fonts & Typography
// turbo
Update globals or create chat-specific styles:
- Primary font: Tahoma, 'Segoe UI', sans-serif
- Monospace for chat: 'Lucida Console', monospace
- Proper font sizes: 11px for UI, 12-13px for chat text

### 11. Add Subtle Animations
// turbo
Add micro-interactions:
- Window open/close fade
- Buddy list expand/collapse slide
- Message send animation
- Typing dots animation

## Resources
- Icons: `/mnt/Data68/win98_icons/windows98-icons/png`
- Reference: Search for "AIM 5.5 interface" and "Windows XP Luna theme" for visual reference
- Existing components: `/components/aol-chat/`

## Verification
// turbo
Run `npm run build` after all changes to verify no TypeScript errors.

## Output
When complete, update the walkthrough at:
`/home/sosu/.gemini/antigravity/brain/a2c535fd-6a7b-4bfa-90fd-2d7c9b7551ea/walkthrough.md`
