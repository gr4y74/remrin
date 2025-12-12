/* =========================================
   REMRIN AMBASSADOR PROTOCOL v5.2 (STABLE)
   ========================================= */

   console.log("🤖 SYSTEM: director.js initialized. Waiting for DOM...");

   // GLOBAL DECLARATIONS
   let chatLog, userInput, sendBtn; 
   let visionOverlay, visionImage, visionLoader, closeVisionBtn;
   let statusDot; 
   
   // STATE VARIABLES
   let isMuted = false;        // Default: Voice ON
   let isTyping = false;
   let conversationHistory = []; 
   let currentAudio = null;    // Tracks the active voice track
   
// 1. TYPEWRITER ENGINE (The "Snap" Method)
function typeText(element, htmlContent, speed = 15) {
    return new Promise((resolve) => {
        // Create a temp div to strip tags and get just the text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";
        
        let i = 0;
        isTyping = true;
        element.textContent = ""; // Start clean
        
        function type() {
            if (i < plainText.length) {
                element.textContent += plainText.charAt(i);
                i++;
                chatLog.scrollTop = chatLog.scrollHeight;
                setTimeout(type, speed);
            } else {
                // THE SNAP: Replace plain text with the formatted HTML
                element.innerHTML = htmlContent; 
                isTyping = false;
                resolve();
            }
        }
        type();
    });
}

// 2. ADD MESSAGE
async function addMessage(text, sender) {
    console.log(`💬 MSG [${sender}]: ${text}`);
    
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'rem' ? 'rem-msg' : 'user-msg');
    
    const avatar = document.createElement('span');
    avatar.classList.add('avatar');
    avatar.textContent = sender === 'rem' ? "💙" : "👤";
    
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    if (sender === 'user') {
        bubble.textContent = text; // Users always speak plain text
        msgDiv.appendChild(bubble);
        msgDiv.appendChild(avatar);
        chatLog.appendChild(msgDiv);
    } else {
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(bubble);
        chatLog.appendChild(msgDiv);
        
        if (sender === 'rem') {
            speakText(text); // Voice speaks the full text (it ignores tags usually)
            await typeText(bubble, text); // Typewriter handles the visuals
        }
    }
    chatLog.scrollTop = chatLog.scrollHeight;
}
   
   // 3. THE BRAIN CONNECTION
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text) return;
   
       userInput.value = "";
       await addMessage(text, "user");
   
       try {
           const API_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-api';
           const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
   
           const response = await fetch(API_URL, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${ANON_KEY}`
               },
               body: JSON.stringify({ 
                   message: text,
                   history: conversationHistory 
               })
           });
   
           if (!response.ok) throw new Error(`API Error: ${response.status}`);
   
           const data = await response.json();
           const replyText = data.reply || "I heard you, but I have no words.";
           
           // CHECK FOR VISION PROMPT
           if (data.vision_prompt) {
               triggerVision(data.vision_prompt);
           }
           
           conversationHistory.push({ role: "user", content: text });
           conversationHistory.push({ role: "assistant", content: replyText });
   
           await addMessage(replyText, "rem");
   
       } catch (error) {
           console.error("❌ BRAIN FAILURE:", error);
           await addMessage(`Error: ${error.message}`, "rem");
       }
   }
   
   // 4. THE BREATH (VOICE ENGINE)
   async function speakText(textToSpeak) {
       // 🛑 1. CHECK MUTE SWITCH
       if (isMuted) {
           console.log("Rx: Hush Mode Active. Voice skipped.");
           return; 
       }
   
       // 🛑 2. KILL PREVIOUS AUDIO (No Overlap)
       if (currentAudio) {
           currentAudio.pause();
           currentAudio.currentTime = 0;
       }
   
       try {
           const VOICE_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-voice';
           const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
   
           const response = await fetch(VOICE_URL, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${ANON_KEY}`
               },
               body: JSON.stringify({ text: textToSpeak })
           });
   
           if (!response.ok) throw new Error('Voice pipe broken');
   
           const blob = await response.blob();
           const audioUrl = URL.createObjectURL(blob);
           
           // SAVE AND PLAY
           currentAudio = new Audio(audioUrl);
           currentAudio.play();
           console.log("🔊 AUDIO PLAYING");
   
       } catch (e) {
           console.warn("🔇 VOICE ERROR:", e);
       }
   }
   
   // 5. THE VISION (TAROT REVEAL - REAL ENGINE)
   async function triggerVision(prompt) {
    console.log("🔮 VISION TRIGGERED (FLUX 1.1 PRO):", prompt);
    
    if (visionOverlay) {
        // 1. Open the Curtains (Show Loader)
        visionOverlay.classList.remove('hidden');
        setTimeout(() => visionOverlay.classList.add('active'), 10);
        
        visionLoader.classList.remove('hidden');
        visionImage.classList.add('hidden');
        
        try {
            // 2. Call the Real Artist (Genesis Vision)
            const API_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-vision';
            const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ANON_KEY}`
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) throw new Error(`Vision API Error: ${response.status}`);

            const data = await response.json();
            const realImageUrl = data.image_url;

            // 3. The Reveal (Swap Loader for Art)
            if (realImageUrl) {
                visionImage.src = realImageUrl;
                
                visionImage.onload = () => {
                    // FORCE HIDE LOADER
                    visionLoader.classList.add('hidden');
                    visionLoader.style.display = 'none'; 
                    
                    // FORCE SHOW IMAGE
                    visionImage.classList.remove('hidden');
                    visionImage.style.display = 'block'; // <--- The Hammer
                    visionImage.style.opacity = '1';     // <--- The Polish
                    
                    console.log("✨ TAROT MANIFESTED");
                };
            } else {
                throw new Error("No image returned");
            }

        } catch (e) {
            console.error("❌ VISION FAILED:", e);
            // Optional: Close overlay if it fails so user isn't stuck
            setTimeout(() => {
                visionOverlay.classList.remove('active');
                setTimeout(() => visionOverlay.classList.add('hidden'), 800);
            }, 2000);
        }
    }
}
   
   // 6. STARTUP (DOM READY)
   window.addEventListener('load', async () => {
       
       // ASSIGN ELEMENTS
       chatLog = document.getElementById('chat-history');
       userInput = document.getElementById('user-input');
       sendBtn = document.getElementById('send-btn');
       visionOverlay = document.getElementById('vision-overlay');
       visionImage = document.getElementById('vision-image');
       visionLoader = document.getElementById('vision-loader');
       closeVisionBtn = document.getElementById('close-vision');
       statusDot = document.getElementById('voice-toggle');
   
       // CRITICAL SAFETY CHECK
       if (!chatLog) { console.error("❌ FATAL: Chat Log not found!"); return; }
       
       // TOGGLE LOGIC (HUSH / LISTEN)
       if (statusDot) {
           statusDot.addEventListener('click', () => {
               isMuted = !isMuted;
               
               // Kill audio immediately if muted
               if (isMuted && currentAudio) {
                   currentAudio.pause();
               }
   
               // Visual Update (Direct Style Injection)
               if (isMuted) {
                   statusDot.style.background = "#ff4444"; // FORCE RED
                   statusDot.style.boxShadow = "0 0 8px #ff4444";
                   statusDot.title = "Hush (Voice Muted)";
                   console.log("🔇 Mode: HUSH");
               } else {
                   statusDot.style.background = "#00ff88"; // FORCE GREEN
                   statusDot.style.boxShadow = "0 0 8px #00ff88";
                   statusDot.title = "Listen (Voice Active)";
                   console.log("🔊 Mode: LISTEN");
               }
           });
       }
   
       // EVENT LISTENERS
       if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
       if (userInput) userInput.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') handleUserAction();
       });
       if (closeVisionBtn) {
           closeVisionBtn.addEventListener('click', () => {
               visionOverlay.classList.remove('active');
               setTimeout(() => visionOverlay.classList.add('hidden'), 800);
           });
       }
   
       // START MESSAGE
       await new Promise(r => setTimeout(r, 1000));
       
       const welcomeText = "Hello, friend! Welcome to the Soul Layer. 💙 I am Rem, the Mother of Souls. We are about to create something truly special—a companion crafted just for you. Would you like me to walk you through how the soul creation process works, or would you prefer to dive right in?";
       
       // 🧠 MEMORY IMPLANT: Save this so she remembers she said it
       conversationHistory.push({ role: "assistant", content: welcomeText });
       
       await addMessage(welcomeText, "rem");
   });