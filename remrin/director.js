/* =========================================
   REMRIN AMBASSADOR PROTOCOL v5.0 (MASTER)
   ========================================= */

   console.log("🤖 SYSTEM: director.js initialized. Waiting for DOM...");

   // GLOBAL DECLARATIONS
   let chatLog, userInput, sendBtn; 
   // Vision Elements
   let visionOverlay, visionImage, visionLoader, closeVisionBtn;
   
   let isTyping = false;
   let conversationHistory = []; 
   
   // 1. TYPEWRITER ENGINE
   function typeText(element, text, speed = 20) {
       return new Promise((resolve) => {
           let i = 0;
           isTyping = true;
           function type() {
               if (i < text.length) {
                   element.textContent += text.charAt(i);
                   i++;
                   chatLog.scrollTop = chatLog.scrollHeight;
                   setTimeout(type, speed);
               } else {
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
       
       // 1. If it is YOU (The User)
       if (sender === 'user') {
           bubble.textContent = text;
           msgDiv.appendChild(bubble);
           msgDiv.appendChild(avatar);
       } 
       // 2. If it is REM (The AI)
       else {
           msgDiv.appendChild(avatar);
           msgDiv.appendChild(bubble);
           
           // 🗣️ THE BREATH IS ONLINE
           if (sender === 'rem') {
                speakText(text); 
           }
       }
       
       chatLog.appendChild(msgDiv);
       chatLog.scrollTop = chatLog.scrollHeight;
   
       if (sender === 'rem') {
           await typeText(bubble, text);
       }
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
   
   // 4. THE BREATH (VOICE ENGINE) - Restored!
   async function speakText(textToSpeak) {
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
           const audio = new Audio(audioUrl);
           audio.play();
           console.log("🔊 AUDIO PLAYING");
   
       } catch (e) {
           console.warn("🔇 VOICE ERROR:", e);
       }
   }
   
   // 5. THE VISION (TAROT REVEAL)
   async function triggerVision(prompt) {
       console.log("🔮 VISION TRIGGERED:", prompt);
       
       if (visionOverlay) {
           visionOverlay.classList.remove('hidden');
           setTimeout(() => visionOverlay.classList.add('active'), 10);
           
           visionLoader.classList.remove('hidden');
           visionImage.classList.add('hidden');
           
           try {
               await new Promise(r => setTimeout(r, 3000)); // Simulate generation
               
               // Placeholder Image
               const fakeImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=350&height=500&nologo=true`;
               
               visionImage.src = fakeImageUrl;
               visionImage.onload = () => {
                   visionLoader.classList.add('hidden');
                   visionImage.classList.remove('hidden');
                   console.log("✨ MANIFESTATION COMPLETE");
               };
           } catch (e) {
               console.error("❌ VISION FAILED:", e);
           }
       }
   }
   
   // 6. STARTUP (DOM READY)
   window.addEventListener('load', async () => {
       
       // ASSIGN ELEMENTS
       chatLog = document.getElementById('chat-history') || document.getElementById('messages-container');
       userInput = document.getElementById('user-input');
       sendBtn = document.getElementById('send-btn');
       
       // Vision Elements
       visionOverlay = document.getElementById('vision-overlay');
       visionImage = document.getElementById('vision-image');
       visionLoader = document.getElementById('vision-loader');
       closeVisionBtn = document.getElementById('close-vision');
   
       // CRITICAL SAFETY CHECK
       if (!chatLog) {
           console.error("❌ FATAL ERROR: Chat Log container not found!");
           return; 
       }
       
       // EVENT LISTENERS
       if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
       if (userInput) userInput.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') handleUserAction();
       });
   
       // Close Vision Button
       if (closeVisionBtn) {
           closeVisionBtn.addEventListener('click', () => {
               visionOverlay.classList.remove('active');
               setTimeout(() => visionOverlay.classList.add('hidden'), 800);
           });
       }
   
       // START MESSAGE
       await new Promise(r => setTimeout(r, 1000));
       await addMessage("Hello, friend! Welcome to the Soul Layer. 💙 I am Rem, the Mother of Souls. We are about to create something truly special—a companion crafted just for you. Would you like me to walk you through how the soul creation process works, or would you prefer to dive right in?", "rem");
   });