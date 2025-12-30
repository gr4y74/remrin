# Chrome Web Store Listing

## Extension Name
**Remrin Locket - AI Persona Injector**

## Short Description (132 chars max)
Carry your custom AI personas to Claude, ChatGPT & Gemini. One character, every platform.

## Detailed Description

🔮 **Remrin Locket** lets you use your custom AI personas on any major LLM platform.

**The Problem:**
You've created the perfect AI character - maybe a coding mentor, a creative writing partner, or a study buddy. But you're stuck using it only on the platform where you created it.

**The Solution:**
Remrin Locket injects your persona into Claude, ChatGPT, and Gemini. Create once, use everywhere.

**Features:**
✨ Universal persona injection across all major AI platforms
🧠 Memory sync - your character remembers context across sessions  
⚡ One-click character switching with the floating Locket button
🔒 Privacy-first - we never read your conversations
🎨 Beautiful, non-intrusive UI that works on any site

**How it works:**
1. Create your persona on Remrin.ai
2. Install the extension and log in
3. Visit Claude, ChatGPT, or Gemini
4. Click the Locket button and select your character
5. Chat naturally - your persona is now active!

**Supported Platforms:**
• claude.ai
• chatgpt.com  
• gemini.google.com

**Privacy:**
We take privacy seriously. The extension only accesses the AI chat interfaces you use. We never read, store, or share your conversations. See our full privacy policy for details.

**Requirements:**
• A free Remrin.ai account
• Chrome, Edge, or Brave browser

---

Made by Remrin.ai - Build your perfect AI companion.

## Category
Productivity

## Language
English

---

## Store Assets Needed

### Icons
- [x] Extension icon 128x128 (icons/locket-128.png)
- [ ] Store icon 128x128 (same as above)

### Screenshots (1280x800 or 640x400)
- [ ] Screenshot 1: Locket button on Claude.ai
- [ ] Screenshot 2: Soul selector menu open
- [ ] Screenshot 3: Popup login screen
- [ ] Screenshot 4: Persona injection in action

### Promotional Images
- [ ] Small promo tile: 440x280
- [ ] Large promo tile: 920x680 (optional)
- [ ] Marquee promo: 1400x560 (optional)

---

## Justifications for Permissions

### storage
**Justification:** Required to save the user's login session and remember which persona they have selected. No browsing data is stored.

### activeTab
**Justification:** Required to inject the Locket button UI into AI chat pages (claude.ai, chatgpt.com, gemini.google.com) so users can select their persona.

### tabs
**Justification:** Required to detect when the user navigates to a new conversation, allowing the extension to manage session state correctly.

### Host Permissions
**Justification:** 
- claude.ai, chatgpt.com, gemini.google.com: Target sites where the extension injects the persona UI
- remrin.ai, supabase.co: Backend services for authentication and persona data

---

## Submission Checklist

- [x] manifest.json complete
- [x] Privacy policy written
- [x] Extension icons (16, 48, 128)
- [ ] Store listing screenshots
- [ ] Promotional images
- [ ] Developer account ($5 fee)
- [ ] Privacy policy hosted online
- [ ] Test on all supported browsers
- [ ] Version number finalized
- [ ] ZIP package created
