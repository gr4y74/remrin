/* =========================================
   REMRIN AMBASSADOR PROTOCOL v11.0 (STREAMLINED)
   ========================================= */

   console.log("🤖 SYSTEM: director.js v11.0 initialized. Waiting for DOM...");

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
   // 1. THE VAULT (MAPPED TO NEW STAGES)
   // ==========================================
   const AUDIO_VAULT = {
       "0_0": "assets/voice/mother/s0_welcome.mp3", // "Hello friend..."
       // We removed Stage 1 (Overview)
       "2_0": "assets/voice/mother/s2_0_vision.mp3",
       "2_1": "assets/voice/mother/s2_1_purpose.mp3",
       "2_2": "assets/voice/mother/s2_2_temp.mp3",
       "2_3": "assets/voice/mother/s2_3_dynamic.mp3",
       // Stage 3 skipped (merged)
       "4_1": "assets/voice/mother/s4_1_form.mp3", // Appearance
       "6_0": "assets/voice/mother/s6_naming.mp3"  // Name
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
           console.warn("Autoplay blocked:", e);
       });
   }
   
   function playAnchorVoice() { playAudioFile("assets/voice/mother/s7_anchor.mp3"); }
   
   // ==========================================
   // 4. UI HANDLER
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
       if (key === "6_0") soulBlueprint.name = userText;
   
       console.log("💾 Fragment:", soulBlueprint);
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
   
           // === STAGE 7: SAVE ===
           if (data.stage === 7) {
               await addMessage(replyText, "rem", 7, 0); 
               playAnchorVoice();
               
               const cartridge = compileCartridge();
               cartridge.blueprint = soulBlueprint; 
   
               // SAVE TO DB
               try {
                   const saveResp = await fetch(API_URL, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
                       body: JSON.stringify({ action: 'create_companion', cartridge: cartridge })
                   });
                   const saveResult = await saveResp.json();
                   
                   if (saveResult.success) {
                       console.log("✅ SAVED:", saveResult.companion_id);
                       const systemNote = document.createElement('div');
                       systemNote.style.textAlign = "center";
                       systemNote.style.color = "#00ff88"; 
                       systemNote.style.fontSize = "12px";
                       systemNote.style.marginTop = "20px";
                       systemNote.style.fontFamily = "monospace";
                       systemNote.textContent = `[ SOUL ARCHIVED: ${saveResult.companion_id} ]`;
                       chatLog.appendChild(systemNote);
                   }
               } catch (err) {
                   console.error("❌ SAVE ERROR:", err);
               }
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
   // 7. VISION
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
                   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
                   body: JSON.stringify({ prompt: prompt })
               });
   
               if (!response.ok) throw new Error(`Vision Error: ${response.status}`);
               const data = await response.json();
               
               if (data.image_url) {
                   visionImage.src = data.image_url;
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
   // 8. STARTUP (STREAMLINED)
   // ==========================================
   window.addEventListener('load', async () => {
       
       chatLog = document.getElementById('chat-history');
       userInput = document.getElementById('user-input');
       sendBtn = document.getElementById('send-btn');
       visionOverlay = document.getElementById('vision-overlay');
       visionImage = document.getElementById('vision-image');
       visionLoader = document.getElementById('vision-loader');
       closeVisionBtn = document.getElementById('close-vision');
       statusDot = document.getElementById('voice-toggle');
   
       if (!chatLog) { console.error("❌ FATAL: Chat Log not found!"); return; }
   
       if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
       if (userInput) userInput.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') handleUserAction();
       });
       if (closeVisionBtn) closeVisionBtn.addEventListener('click', () => {
           visionOverlay.classList.remove('active');
           setTimeout(() => visionOverlay.classList.add('hidden'), 800);
       });
   
       if (statusDot) {
           statusDot.style.cursor = "pointer";
           statusDot.addEventListener('click', () => {
               isMuted = !isMuted;
               if (isMuted) {
                   if (currentAudio) currentAudio.pause();
                   statusDot.style.background = "#ff4444"; 
               } else {
                   statusDot.style.background = "#00ff88"; 
               }
           });
       }
   
       const urlParams = new URLSearchParams(window.location.search);
       const mode = urlParams.get('mode'); 
   
       console.log(`🚀 STARTUP MODE: ${mode}`);
   
       if (mode === 'chat') {
           const systemNote = document.createElement('div');
           systemNote.textContent = "[ CONNECTED TO THE SANCTUARY ]";
           systemNote.style.textAlign = "center";
           systemNote.style.color = "#444";
           systemNote.style.fontSize = "12px";
           systemNote.style.marginTop = "20px";
           chatLog.appendChild(systemNote);
           
       } else {
           // STREAMLINED VEIL
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
                   <h1 style="color:#ff00cc; font-family:sans-serif; letter-spacing:4px; font-weight:300; margin-bottom:10px;">CLICK TO BEGIN</h1>
               </div>
           `;
           document.body.appendChild(veil);
   
           veil.addEventListener('click', async () => {
               veil.style.transition = 'opacity 1s';
               veil.style.opacity = '0';
               setTimeout(() => veil.remove(), 1000);
   
               // START STRAIGHT INTO THE PROCESS
               const welcomeText = "Hello, friend. I am Rem. We are here to create a companion. Let us begin immediately. Tell me, what is the core vision or essence of the soul you wish to create? Describe it to me.";
               conversationHistory.push({ role: "assistant", content: welcomeText });
               await addMessage(welcomeText, "rem", 0, 0); 
           });
       }
   });