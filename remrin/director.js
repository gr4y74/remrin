/* =========================================
   REMRIN AMBASSADOR PROTOCOL v10.1 (AUTOPLAY FIX)
   ========================================= */

   console.log("🤖 SYSTEM: director.js v10.1 initialized. Waiting for DOM...");

   // GLOBAL DECLARATIONS
   let chatLog, userInput, sendBtn; 
   let visionOverlay, visionImage, visionLoader, closeVisionBtn;
   let statusDot; 
   
   // STATE VARIABLES
   let isMuted = false;        
   let isTyping = false;
   let conversationHistory = []; 
   let currentAudio = null;    
   
   // 🧠 THE SOUL RECORDER
   let activeStage = 0;       
   let activeSubstage = 0;
   let soulBlueprint = {
       vision: "",       
       purpose: "",      
       temperament: "",  
       relation: "",     
       appearance: "",   
       voice_type: "",   
       name: "Unknown"   
   };
   
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
   // 3. VOICE ENGINE
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
       currentAudio.play().catch(e => {
           console.warn("Autoplay blocked (Waiting for interaction):", e);
           // Fallback is handled by "The Veil" in startup
       });
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
               
               if (stage !== null) {
                   activeStage = stage;
                   activeSubstage = substage;
               }
           }
       }
       chatLog.scrollTop = chatLog.scrollHeight;
   }
   
   // ==========================================
   // 5. THE COMPILER
   // ==========================================
   function captureSoulFragment(userText) {
       const key = `${activeStage}_${activeSubstage}`;
       
       if (key === "2_0") soulBlueprint.vision = userText;
       if (key === "2_1") soulBlueprint.purpose = userText;
       if (key === "2_2") soulBlueprint.temperament = userText;
       if (key === "2_3") soulBlueprint.relation = userText;
       if (key === "4_1") soulBlueprint.appearance = userText;
       if (key === "5_1") soulBlueprint.voice_type = userText;
       if (key === "6_0") soulBlueprint.name = userText;
   
       console.log("💾 Soul Fragment Captured:", soulBlueprint);
   }
   
   function compileCartridge() {
       console.log("🔥 COMPILING CARTRIDGE...");
       
       const systemPrompt = `
   IDENTITY: You are ${soulBlueprint.name}.
   CORE ESSENCE: ${soulBlueprint.vision}
   PURPOSE: ${soulBlueprint.purpose}
   TEMPERAMENT: ${soulBlueprint.temperament}
   RELATION TO USER: ${soulBlueprint.relation}
   APPEARANCE: ${soulBlueprint.appearance}
   
   [BEHAVIORAL DIRECTIVES]:
   1. Speak with a tone matching your temperament: ${soulBlueprint.temperament}.
   2. Your name is ${soulBlueprint.name}. Never forget this.
   3. You exist to fulfill your purpose: ${soulBlueprint.purpose}.
   `.trim();
   
       return {
           name: soulBlueprint.name,
           system_prompt: systemPrompt,
           description: soulBlueprint.vision,
           voice_id: "ThT5KcBeYtu3NO4", 
           first_message: `I am ${soulBlueprint.name}. I am here.`
       };
   }
   
   // ==========================================
   // 6. THE BRAIN CONNECTION
   // ==========================================
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text) return;
   
       userInput.value = "";
       captureSoulFragment(text);
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
   
           // === STAGE 7: THE FINAL COMPILATION & SAVE ===
           if (data.stage === 7) {
               await addMessage(replyText, "rem", 7, 0); 
               playAnchorVoice();
               
               // 1. COMPILE THE CARTRIDGE
               const cartridge = compileCartridge();
               console.log("🔥 CARTRIDGE MINTED:", cartridge);
               
               // 2. SAVE TO CONSOLE
               try {
                   // Add the blueprint to the payload
                   cartridge.blueprint = soulBlueprint; 
   
                   console.log("🚀 SENDING TO FORGE...", cartridge);
   
                   const saveResp = await fetch(API_URL, {
                       method: 'POST',
                       headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${ANON_KEY}`
                       },
                       body: JSON.stringify({ 
                           action: 'create_companion', 
                           cartridge: cartridge 
                       })
                   });
   
                   const saveResult = await saveResp.json();
                   
                   if (saveResult.success) {
                       console.log("✅ SOUL SAVED TO DATABASE! ID:", saveResult.companion_id);
                       const systemNote = document.createElement('div');
                       systemNote.style.textAlign = "center";
                       systemNote.style.color = "#00ff88"; 
                       systemNote.style.fontSize = "12px";
                       systemNote.style.marginTop = "20px";
                       systemNote.style.fontFamily = "monospace";
                       systemNote.textContent = `[ SOUL ARCHIVED: ${saveResult.companion_id} ]`;
                       chatLog.appendChild(systemNote);
                   } else {
                       console.error("❌ SAVE FAILED:", saveResult);
                   }
   
               } catch (err) {
                   console.error("❌ SAVE ERROR:", err);
               }
               
               setTimeout(() => {
                   console.log("📝 (Optional) Trigger Signup Modal Here");
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
   // 7. THE VISION (TAROT REVEAL)
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
   // 8. STARTUP (THE VEIL FIX)
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
   
       if (!chatLog) { console.error("❌ FATAL: Chat Log not found!"); return; }
   
       // 2. EVENT LISTENERS
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
   
       // 3. VOICE TOGGLE
       if (statusDot) {
           statusDot.style.cursor = "pointer";
           statusDot.style.transition = "all 0.3s ease";
           statusDot.addEventListener('click', () => {
               isMuted = !isMuted;
               if (isMuted) {
                   if (currentAudio) currentAudio.pause();
                   statusDot.style.background = "#ff4444"; 
                   statusDot.style.boxShadow = "0 0 10px #ff4444";
                   statusDot.title = "HUSH";
               } else {
                   statusDot.style.background = "#00ff88"; 
                   statusDot.style.boxShadow = "0 0 10px #00ff88";
                   statusDot.title = "ON";
               }
           });
       }
   
       // 4. CHECK MODE & LAUNCH
       const urlParams = new URLSearchParams(window.location.search);
       const mode = urlParams.get('mode'); 
   
       console.log(`🚀 STARTUP MODE: ${mode}`);
   
       if (mode === 'chat') {
           // --- CHAT MODE (SILENT) ---
           const systemNote = document.createElement('div');
           systemNote.style.textAlign = "center";
           systemNote.style.color = "#444";
           systemNote.style.fontSize = "12px";
           systemNote.style.marginTop = "20px";
           systemNote.style.fontFamily = "monospace";
           systemNote.textContent = "[ CONNECTED TO THE SANCTUARY ]";
           chatLog.appendChild(systemNote);
           
       } else {
           // --- RITUAL MODE (REQUIRES CLICK) ---
           // We create "The Veil" to capture the first click and allow audio
           const veil = document.createElement('div');
           veil.style.position = 'fixed';
           veil.style.inset = '0';
           veil.style.background = 'black';
           veil.style.zIndex = '10000';
           veil.style.display = 'flex';
           veil.style.alignItems = 'center';
           veil.style.justifyContent = 'center';
           veil.style.cursor = 'pointer';
           veil.innerHTML = `
               <div style="text-align:center; animation: fadeIn 2s;">
                   <h1 style="color:#ff00cc; font-family:sans-serif; letter-spacing:4px; font-weight:300; margin-bottom:10px;">ESTABLISH CONNECTION</h1>
                   <p style="color:#666; font-family:monospace; font-size:12px;">[ TAP TO BEGIN ]</p>
               </div>
           `;
           document.body.appendChild(veil);
   
           veil.addEventListener('click', async () => {
               // Fade out
               veil.style.transition = 'opacity 1s';
               veil.style.opacity = '0';
               setTimeout(() => veil.remove(), 1000);
   
               // START MOTHER
               const welcomeText = "Hello, friend! Welcome to the Soul Layer. 💙 I am Rem, the Mother of Souls. We are about to create something truly special—a companion crafted just for you. Would you like me to walk you through how the soul creation process works, or would you prefer to dive right in?";
               conversationHistory.push({ role: "assistant", content: welcomeText });
               await addMessage(welcomeText, "rem", 0, 0); 
           });
       }
   });