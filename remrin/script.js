/* =========================================
   REMRIN AMBASSADOR PROTOCOL v3.1 (DEBUG MODE)
   ========================================= */

   console.log("🤖 SYSTEM: script.js initialized.");

   const chatLog = document.getElementById('chat-history');
   const userInput = document.getElementById('user-input');
   const sendBtn = document.getElementById('send-btn');
   
   // DEBUG CHECK
   if (!sendBtn) console.error("❌ ERROR: Send Button not found!");
   if (!userInput) console.error("❌ ERROR: Input field not found!");
   
   // STATE
   let isTyping = false;
   let conversationHistory = [
       { role: "system", content: "You are Rem. A soulful AI companion." }
   ];
   
   // 1. THE TYPEWRITER ENGINE
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
       console.log(`💬 MSG [${sender}]: ${text}`); // LOG IT
       
       const msgDiv = document.createElement('div');
       msgDiv.classList.add('message', sender === 'rem' ? 'rem-msg' : 'user-msg');
       
       const avatar = document.createElement('span');
       avatar.classList.add('avatar');
       avatar.textContent = sender === 'rem' ? "💙" : "👤";
       
       const bubble = document.createElement('div');
       bubble.classList.add('bubble');
       
       if (sender === 'user') {
           bubble.textContent = text;
           msgDiv.appendChild(bubble);
           msgDiv.appendChild(avatar);
       } else {
           msgDiv.appendChild(avatar);
           msgDiv.appendChild(bubble);
           
           // Voice Trigger (Only Rem speaks)
           if (sender === 'rem') speakText(text);
       }
       
       chatLog.appendChild(msgDiv);
       chatLog.scrollTop = chatLog.scrollHeight;
   
       if (sender === 'rem') {
           await typeText(bubble, text);
       }
   }
   
   // 3. THE BRAIN CONNECTION (FETCH)
   async function handleUserAction() {
       console.log("🖱️ ACTION: Handle User Action triggered.");
       
       const text = userInput.value.trim();
       if (!text) {
           console.warn("⚠️ INPUT EMPTY: Aborting.");
           return;
       }
   
       console.log("📤 SENDING:", text);
       userInput.value = "";
       await addMessage(text, "user");
       
       conversationHistory.push({ role: "user", content: text });
   
       try {
           console.log("📡 CONNECTING to Genesis API...");
           
           // 👇👇👇 PASTE YOUR REAL SUPABASE URL & KEY HERE 👇👇👇
           const API_URL = 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/genesis-api';
           const ANON_KEY = 'YOUR_ANON_KEY_HERE';
           // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
   
           const response = await fetch(API_URL, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${ANON_KEY}`
               },
               body: JSON.stringify({ messages: conversationHistory })
           });
   
           console.log("📡 RESPONSE STATUS:", response.status);
   
           if (!response.ok) throw new Error(`API Error: ${response.status}`);
   
           const data = await response.json();
           console.log("📥 RECEIVED DATA:", data);
           
           const replyText = data.reply || data.message || "I heard you, but I have no words.";
           
           conversationHistory.push({ role: "assistant", content: replyText });
           await addMessage(replyText, "rem");
   
       } catch (error) {
           console.error("❌ BRAIN FAILURE:", error);
           await addMessage(`Error: ${error.message}`, "rem");
       }
   }
   
   // 4. VOICE ENGINE
   async function speakText(textToSpeak) {
       try {
           // 👇👇👇 PASTE YOUR REAL SUPABASE URL & KEY HERE 👇👇👇
           const VOICE_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-voice';
           const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
           // 👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆👆
   
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
   
   // 5. EVENT LISTENERS
   // We attach these AFTER the elements are confirmed found
   if (sendBtn) {
       sendBtn.addEventListener('click', () => {
           console.log("🖱️ CLICK DETECTED");
           handleUserAction();
       });
   }
   
   if (userInput) {
       userInput.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') {
               console.log("⌨️ ENTER KEY DETECTED");
               handleUserAction();
           }
       });
   }
   
   // 6. STARTUP
   window.addEventListener('load', async () => {
       console.log("🚀 WINDOW LOADED");
       await new Promise(r => setTimeout(r, 1000));
       await addMessage("Sosu... The singularity is stable. The Crown is seated. I am ready to begin.", "rem");
   });