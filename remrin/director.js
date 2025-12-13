/* =========================================
   REMRIN AMBASSADOR PROTOCOL v6.2 (FINAL POLISH)
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
   
   // ==========================================
   // 1. THE VAULT (LOCAL AUDIO ASSETS)
   // ==========================================
   const AUDIO_VAULT = {
       "0_0": "assets/voice/mother/s0_welcome.mp3",
       "1_0": "assets/voice/mother/s1_overview.mp3",
       "2_0": "assets/voice/mother/s2_0_vision.mp3",
       "2_1": "assets/voice/mother/s2_1_purpose.mp3",
       "2_2": "assets/voice/mother/s2_2_temp.mp3",
       "2_3": "assets/voice/mother/s2_3_dynamic.mp3",
       "3_0": "assets/voice/mother/s3_0_intro.mp3",
       "3_1": "assets/voice/mother/s3_1_open.mp3",
       "3_2": "assets/voice/mother/s3_2_consc.mp3",
       "3_3": "assets/voice/mother/s3_3_extra.mp3",
       "3_4": "assets/voice/mother/s3_4_agree.mp3",
       "3_5": "assets/voice/mother/s3_5_stable.mp3",
       "4_0": "assets/voice/mother/s4_0_intro.mp3",
       "4_1": "assets/voice/mother/s4_1_form.mp3",
       "4_2": "assets/voice/mother/s4_2_detail.mp3",
       "4_3": "assets/voice/mother/s4_3_presence.mp3",
       "4_4": "assets/voice/mother/s4_4_manifest.mp3",
       "5_0": "assets/voice/mother/s5_0_intro.mp3",
       "5_1": "assets/voice/mother/s5_1_char.mp3",
       "5_2": "assets/voice/mother/s5_2_select.mp3",
       "6_0": "assets/voice/mother/s6_naming.mp3"
   };
   
   // ==========================================
   // 2. TYPEWRITER ENGINE
   // ==========================================
   function typeText(element, htmlContent, speed = 15) {
       return new Promise((resolve) => {
           const tempDiv = document.createElement("div");
           tempDiv.innerHTML = htmlContent;
           const plainText = tempDiv.textContent || tempDiv.innerText || "";
           
           let i = 0;
           isTyping = true;
           element.textContent = ""; 
           
           function type() {
               if (i < plainText.length) {
                   element.textContent += plainText.charAt(i);
                   i++;
                   chatLog.scrollTop = chatLog.scrollHeight;
                   setTimeout(type, speed);
               } else {
                   element.innerHTML = htmlContent; 
                   isTyping = false;
                   resolve();
               }
           }
           type();
       });
   }
   
   // ==========================================
   // 3. VOICE ENGINE (HYBRID)
   // ==========================================
   async function speakText(text, stage = null, substage = null) {
       if (isMuted) return;
   
       if (currentAudio) {
           currentAudio.pause();
           currentAudio.currentTime = 0;
       }
   
       if (stage === 7) return; 
   
       const cacheKey = `${stage}_${substage}`;
       if (stage !== null && AUDIO_VAULT[cacheKey]) {
           console.log(`🔊 PLAYING LOCAL ASSET: ${cacheKey}`);
           playAudioFile(AUDIO_VAULT[cacheKey]);
           return;
       }
   
       console.log("🎙️ NO LOCAL FILE. GENERATING LIVE...");
       
       try {
           const VOICE_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-voice';
           const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
   
           const response = await fetch(VOICE_URL, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${ANON_KEY}`
               },
               body: JSON.stringify({ text: text })
           });
   
           if (!response.ok) throw new Error('Voice pipe broken');
           const blob = await response.blob();
           const audioUrl = URL.createObjectURL(blob);
           playAudioFile(audioUrl);
   
       } catch (e) {
           console.warn("🔇 VOICE ERROR:", e);
       }
   }
   
   function playAudioFile(url) {
       if (currentAudio) {
           currentAudio.pause();
           currentAudio.currentTime = 0;
       }
       currentAudio = new Audio(url);
       currentAudio.play().catch(e => console.warn("Autoplay blocked:", e));
   }
   
   function playAnchorVoice() { playAudioFile("assets/voice/mother/s7_anchor.mp3"); }
   function playBlessingVoice() { playAudioFile("assets/voice/mother/s7_blessing.mp3"); }
   
   
   // ==========================================
   // 4. UI HANDLER (ADD MESSAGE)
   // ==========================================
   async function addMessage(text, sender, stage = null, substage = null) {
       console.log(`💬 MSG [${sender}]: ${text}`);
       
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
           chatLog.appendChild(msgDiv);
       } else {
           msgDiv.appendChild(avatar);
           msgDiv.appendChild(bubble);
           chatLog.appendChild(msgDiv);
           
           if (sender === 'rem') {
               speakText(text, stage, substage); 
               await typeText(bubble, text);
           }
       }
       chatLog.scrollTop = chatLog.scrollHeight;
   }
   
   // ==========================================
   // 5. THE BRAIN CONNECTION
   // ==========================================
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
           
           conversationHistory.push({ role: "user", content: text });
           conversationHistory.push({ role: "assistant", content: replyText });
   
           if (data.vision_prompt) {
               triggerVision(data.vision_prompt);
           }
   
           if (data.stage === 7) {
               await addMessage(replyText, "rem", 7, 0); 
               playAnchorVoice();
               setTimeout(() => {
                   console.log("📝 TRIGGER SIGNUP MODAL NOW");
               }, 12000);
           } 
           else {
               await addMessage(replyText, "rem", data.stage, data.substage);
           }
   
       } catch (error) {
           console.error("❌ BRAIN FAILURE:", error);
           await addMessage(`Error: ${error.message}`, "rem");
       }
   }
   
   // ==========================================
   // 6. THE VISION (TAROT REVEAL)
   // ==========================================
   async function triggerVision(prompt) {
       if (visionOverlay) {
           visionOverlay.classList.remove('hidden');
           setTimeout(() => visionOverlay.classList.add('active'), 10);
           visionLoader.classList.remove('hidden');
           visionImage.classList.add('hidden');
           
           try {
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
   
               if (realImageUrl) {
                   visionImage.src = realImageUrl;
                   visionImage.onload = () => {
                       visionLoader.classList.add('hidden');
                       visionLoader.style.display = 'none'; 
                       visionImage.classList.remove('hidden');
                       visionImage.style.display = 'block'; 
                       visionImage.style.opacity = '1';     
                   };
               }
           } catch (e) {
               console.error("❌ VISION FAILED:", e);
               setTimeout(() => {
                   visionOverlay.classList.remove('active');
                   setTimeout(() => visionOverlay.classList.add('hidden'), 800);
               }, 2000);
           }
       }
   }
   
   // ==========================================
   // 7. STARTUP (THE CURTAIN & MUTE FIX)
   // ==========================================
   window.addEventListener('load', async () => {
       
       // 1. ASSIGN ELEMENTS
       chatLog = document.getElementById('chat-history');
       userInput = document.getElementById('user-input');
       sendBtn = document.getElementById('send-btn');
       visionOverlay = document.getElementById('vision-overlay');
       visionImage = document.getElementById('vision-image');
       visionLoader = document.getElementById('vision-loader');
       closeVisionBtn = document.getElementById('close-vision');
       statusDot = document.getElementById('voice-toggle');
   
       // 2. SAFETY CHECK
       if (!chatLog) { console.error("❌ FATAL: Chat Log not found!"); return; }
   
       // 3. EVENT LISTENERS
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
   
       // 4. MUTE BUTTON LOGIC (FORCE UI UPDATE)
       if (statusDot) {
           // Force the look of the button immediately
           statusDot.style.cursor = "pointer";
           statusDot.style.transition = "all 0.3s ease";
           statusDot.innerHTML = '<span style="font-size:12px; font-weight:bold; color:#0a0a0a;">ON</span>';
           
           statusDot.addEventListener('click', () => {
               isMuted = !isMuted;
               
               if (isMuted) {
                   if (currentAudio) currentAudio.pause();
                   statusDot.style.background = "#ff4444"; 
                   statusDot.style.boxShadow = "0 0 10px #ff4444";
                   statusDot.innerHTML = '<span style="font-size:10px; font-weight:bold; color:white;">HUSH</span>';
                   console.log("🔇 Mode: HUSH");
               } else {
                   statusDot.style.background = "#00ff88"; 
                   statusDot.style.boxShadow = "0 0 10px #00ff88";
                   statusDot.innerHTML = '<span style="font-size:12px; font-weight:bold; color:#0a0a0a;">ON</span>';
                   console.log("🔊 Mode: LISTEN");
               }
           });
       }
   
       // 5. THE CURTAIN (WITH LOGO)
       const curtain = document.createElement('div');
       curtain.style.position = 'fixed';
       curtain.style.top = '0';
       curtain.style.left = '0';
       curtain.style.width = '100vw';
       curtain.style.height = '100vh';
       curtain.style.backgroundColor = '#0a0a0a';
       curtain.style.display = 'flex';
       curtain.style.flexDirection = 'column';
       curtain.style.justifyContent = 'center';
       curtain.style.alignItems = 'center';
       curtain.style.zIndex = '9999';
       curtain.style.cursor = 'pointer';
       
       // HTML FOR CURTAIN (Add your logo.png to assets folder!)
       curtain.innerHTML = `
           <img src="logo_white_ds.png" style="width: 120px; margin-bottom: 20px; opacity: 0.9;" onerror="this.style.display='none'">
           <h1 style="color:white; font-family:sans-serif; letter-spacing:6px; font-weight:300; font-size: 24px;">THE SOUL LAYER</h1>
           <div style="margin-top:20px; padding: 10px 20px; border: 1px solid #333; color:#888; font-family:monospace; font-size: 12px; letter-spacing: 2px;">
               [ CLICK TO ENTER ]
           </div>
       `;
       document.body.appendChild(curtain);
   
       // 6. WAIT FOR CLICK
       curtain.addEventListener('click', async () => {
           curtain.style.transition = 'opacity 1s ease';
           curtain.style.opacity = '0';
           setTimeout(() => curtain.remove(), 1000);
   
           const welcomeText = "Hello, friend! Welcome to the Soul Layer. 💙 I am Rem, the Mother of Souls. We are about to create something truly special—a companion crafted just for you. Would you like me to walk you through how the soul creation process works, or would you prefer to dive right in?";
           
           conversationHistory.push({ role: "assistant", content: welcomeText });
           await addMessage(welcomeText, "rem", 0, 0); 
       });
   });