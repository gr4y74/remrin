---
description: Agent Zeta - Polish & Assets (Sounds, Emoticons, Profile Cards, File Sharing)
---
# Agent Zeta: Polish & Assets

**Recommended LLM**: Gemini 2.5 Pro (Low) - Good for asset integration, simpler UI work, file handling

**MODE**: TURBO - Auto-proceed with all steps. Do NOT ask for confirmation.

## Mission
Add the finishing touches that make the chat experience delightful: sounds, emoticons, file sharing, and polished UI details.

## Context
- Sound files available: `/mnt/Data68/remrin/chat/public/test/win_95_desktop/aol_sounds`
- Icon files available: `/mnt/Data68/win98_icons/windows98-icons/png`
- Design era: Windows XP / AOL 9.0 (early-mid 2000s)

## Tasks

### 1. Organize Sound Assets
// turbo
Copy and organize sound files:
- Move from `/public/test/win_95_desktop/aol_sounds` to `/public/sounds/chat/`
- Rename to clear names:
  - `buddy-online.mp3` (door open)
  - `buddy-offline.mp3` (door close)
  - `im-receive.mp3`
  - `im-send.mp3`
  - `room-enter.mp3`
  - `room-leave.mp3`
  - `typing.mp3` (optional)
  - `error.mp3`

### 2. Create Sound Manager
// turbo
Create `/lib/chat/soundManager.ts`:
```typescript
class ChatSoundManager {
  private sounds: Map<string, HTMLAudioElement>;
  private enabled: boolean = true;
  private volume: number = 0.5;
  
  play(sound: 'buddyOnline' | 'buddyOffline' | 'imReceive' | 'imSend' | 'roomEnter' | 'roomLeave'): void;
  setEnabled(enabled: boolean): void;
  setVolume(volume: number): void;
}

export const chatSounds = new ChatSoundManager();
```

### 3. Integrate Sounds Throughout App
// turbo
Add sound triggers:
- `useBuddyList`: Play on buddy online/offline
- `useDirectMessages`: Play on receive/send
- `useChatRoom`: Play on enter/leave room
- All should respect user's sound preference

### 4. Sound Settings UI
// turbo
Create settings component or integrate into existing settings:
- Enable/disable chat sounds
- Volume slider
- Test sound button

### 5. Emoticon System
// turbo
Create `/lib/chat/emoticons.ts`:
```typescript
const emoticons = {
  ':)': '😊',
  ':-)': '😊',
  ':(': '😞',
  ':D': '😃',
  ';)': '😉',
  ':P': '😛',
  ':O': '😮',
  '<3': '❤️',
  // ... more classic emoticons
};

export function parseEmoticons(text: string): string;
export function EmoticonPicker(): React.FC; // UI component
```

### 6. Emoticon Picker Component
// turbo
Create `/components/aol-chat/EmoticonPicker.tsx`:
- Grid of common emoticons
- Click to insert into message
- Categorized (Smileys, Hearts, Misc)
- Styled to match XP era

### 7. Integrate Emoticons in Chat
// turbo
Update `ChatRoomWindow.tsx` and `IMWindow.tsx`:
- Add emoticon button next to send
- Parse emoticons in outgoing messages
- Display emoticons in chat history

### 8. File Sharing Setup
// turbo
Create file sharing infrastructure:

#### Storage Bucket
Create or configure Supabase Storage bucket:
- Bucket name: `chat-files`
- Max file size: 10MB
- Allowed types: images, PDFs, common docs

#### Upload API
Create `/app/api/chat/upload`:
- POST: Upload file, return URL
- Validate file type and size
- Scan for malware (optional, future)

#### Database
Add to `chat_messages` and `direct_messages`:
```sql
-- Add columns:
-- attachment_url (text, nullable)
-- attachment_type (enum: image, file)
-- attachment_name (text)
-- attachment_size (int)
```

### 9. File Sharing UI
// turbo
Update chat components:
- Add file upload button (📎 icon)
- Drag-and-drop support
- Upload progress indicator
- Display images inline (with lightbox)
- Display files as download links

### 10. Chat Formatting
// turbo
Create basic formatting support:
- Bold: *text* → **text**
- Italic: _text_ → *text*
- Color (optional): {red}text{/red}
- Toolbar buttons for formatting

### 11. Message Context Menu
// turbo
Create context menu on right-click message:
- Copy text
- Reply (quote)
- Report message
- Delete (if own message or mod)

### 12. Notification Sounds Preference Sync
// turbo
Save sound preferences to user profile:
- Add to user settings in database
- Sync across devices

## Resources
- Sounds: `/mnt/Data68/remrin/chat/public/test/win_95_desktop/aol_sounds`
- Icons: `/mnt/Data68/win98_icons/windows98-icons/png`
- Existing upload patterns: Check existing file upload code in the project

## Verification
// turbo
Run `npm run build` after all changes to verify no TypeScript errors.

## Output
When complete, update the walkthrough at:
`/home/sosu/.gemini/antigravity/brain/a2c535fd-6a7b-4bfa-90fd-2d7c9b7551ea/walkthrough.md`
