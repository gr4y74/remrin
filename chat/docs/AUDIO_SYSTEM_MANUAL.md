# 🎵 Remrin Audio System: User Manual & Guide

## 1. What We Accomplished 🏆

We have built a **Production-Grade Hybrid Audio Engine**. This isn't just a simple text-to-speech feature; it is a sophisticated system designed to balance **Quality**, **Cost**, and **Speed**.

### Key Achievements:
*   **Hybrid Voice Engine:** The system seamlessly switches between three different voice technologies:
    *   **Edge TTS:** Free, fast, and standard quality (for free users).
    *   **Kokoro:** High-quality AI voice running on your own servers (for Pro users).
    *   **ElevenLabs:** Ultra-realistic, emotional voices from the industry leader (for VIP users).
*   **Smart "Memory" (Caching):** The system remembers everything it says. If a character says "Hello, how are you?" once, we save that audio. The next time *anyone* triggers that phrase, it plays instantly for free. This saves huge amounts of money and makes the app feel instant.
*   **Audio Studio:** A professional dashboard (like Photoshop for audio) where you can test voices, experiment with settings, and manage your library.
*   **Voice Cloning:** The ability to take a 30-second audio clip of someone and "clone" their voice so a character can speak just like them.
*   **Business Logic:** A built-in "cash register" that automatically handles usage limits, subscription tiers, and access control.

---

## 2. How Everything Works ⚙️

Think of the Audio System like a high-end restaurant kitchen.

### The Components:
1.  **The Maître D' (AudioService):**
    *   When a user asks for audio (e.g., a character speaks), this service catches the request.
    *   It checks your ID: "Are you a subscriber?"
    *   It checks the menu: "Are you allowed to order the expensive steak (ElevenLabs) or just the salad (Edge)?"
    *   It checks the freezer (Cache): "Have we already cooked this exact meal?"

2.  **The Chefs (Providers):**
    *   **Chef Edge:** Fast line cook. Makes decent food instantly for free.
    *   **Chef Kokoro:** Gourmet chef in-house. Taking a bit more resources but produces excellent results without buying expensive ingredients.
    *   **Chef Eleven:** World-famous guest chef. Expensive to hire per minute, but makes the best food in the world.

3.  **The Freezer (Storage & Database):**
    *   We use **Supabase Storage** to keep MP3 files of everything ever generated.
    *   We use the **Database** to track exactly how many characters ("ingredients") each user has consumed this month.

### The Flow:
1.  **User types a message.**
2.  **System checks permissions:** "Is this user a VIP?"
3.  **System checks Cache:** "Do we have this audio file already?" -> If yes, Play it (0.1ms).
4.  **If No Cache:** System sends text to the appropriate "Chef" (Edge/Kokoro/ElevenLabs).
5.  **Audio is generated**, played to the user, AND saved to the "Freezer" for next time.

---

## 3. How to Use the New Features 🎮

### 🅰️ For Regular Users (Chatting)
*   **Just Chat:** As you chat with characters, if they have a voice assigned, they will speak automatically.
*   **Welcome Messages:** Go to a Character's Profile page. You will see a "Play Welcome Message" button near their avatar. This is their signature greeting.

### 🅱️ For Creators & Admins (The Audio Studio)
Navigate to: `/studio/audio` (or click "Audio Studio" in the admin panel).

#### 1. The Voice Lab (Testing)
*   Type any text into the box.
*   Select a provider (Edge, Kokoro, ElevenLabs) from the cards.
*   Pick a specific voice (e.g., "Nicole - American Female").
*   Click **Generate**. You can listen immediately.

#### 2. Assigning Voices to Characters
*   Go to **Voice Library**.
*   Find a voice you like.
*   Click "Assign to Character".
*   Select your character (e.g., "Remrin").
*   Now, whenever Remrin speaks in chat, she will use that voice!

#### 3. Voice Cloning (Premium Feature)
*   Go to **Voice Lab** -> **Clone Voice**.
*   **Upload:** Drop a clean MP3 file (about 30-60 seconds) of the person you want to clone.
*   **Name:** Give it a name (e.g., "My Custom Narrator").
*   **Clone:** Click the button. In a few seconds, that voice is now available in your library to use for any character!
*   *Note: This feature is only available to Architect and Titan tiers.*

---

## 4. Troubleshooting & Tips 💡

*   **"Quota Exceeded":** If you see this, you (or your user) have generated too much audio this month. Upgrade the tier or wait for next month.
*   **"Provider Unavailable":** Sometimes the external service (ElevenLabs) might be down, or your local Kokoro server might be offline. The system will automatically switch to "Edge" (Free) voices so the app never breaks.
*   **Latency:** Edge is fastest. ElevenLabs takes longest (but sounds best). Use Caching (repeating common phrases) to make everything feel instant.
