/* =========================================
   REMRIN AMBASSADOR PROTOCOL v18.0 (THE IRON PIPELINE)
   ========================================= */

   console.log("🤖 SYSTEM: director.js v18.0 initialized. Waiting for DOM...");

   // GLOBAL DECLARATIONS
   let chatLog, userInput, sendBtn; 
   let visionOverlay, visionImage, visionLoader, closeVisionBtn;
   let statusDot; 
   
   // STATE VARIABLES
   let isMuted = false;        
   let isTyping = false;
   let conversationHistory = []; 
   let currentAudio = null;    
   
   // 🧠 THE SOUL RECORDER (IRON PIPELINE VERSION)
   // We track the stage by Number now, not by vague string matching.
   let currentStage = 0; // 0=Start, 2=Vision, 3=Purpose, 4=Temp, 5=Relation, 6=Appear, 7=Name, 8=End
   
   let soulBlueprint = {
       vision: "",       
       purpose: "",      
       temperament: "",  
       relation: "",     
       appearance: "",   
       voice_type: "ThT5KcBeYtu3NO4", // Default Mother ID   
       name: "Unknown"   
   };
   
   // ==========================================
   // 1. THE VAULT (MAPPED TO STAGE NUMBERS)
   // ==========================================
   // This ensures the Audio matches the Hardcoded Text in the Backend.
   const AUDIO_VAULT = {
       0: "assets/voice/mother/s0_welcome.mp3",    // Welcome
       2: "assets/voice/mother/s2_0_vision.mp3",  // Question 1: Vision
       3: "assets/voice/mother/s2_1_purpose.mp3", // Question 2: Purpose
       4: "assets/voice/mother/s2_2_temp.mp3",    // Question 3: Temperament
       5: "assets/voice/mother/s2_3_dynamic.mp3", // Question 4: Relation
       6: "assets/voice/mother/s4_1_form.mp3",    // Question 5: Appearance
       7: "assets/voice/mother/s6_naming.mp3",    // Question 6: Name
       8: "assets/voice/mother/s7_anchor.mp3"     // Complete
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
   // 3. VOICE ENGINE (IRON SYNC)
   // ==========================================
   async function speakText(text, stage) {
       if (isMuted) return;
   
       // Stop previous audio
       if (currentAudio) {
           currentAudio.pause();
           currentAudio.currentTime = 0;
       }
   
       // 1. TRY LOCAL FILE (Best Quality)
       if (AUDIO_VAULT[stage]) {
           console.log(`🔊 PLAYING LOCAL ASSET FOR STAGE ${stage}: ${AUDIO_VAULT[stage]}`);
           playAudioFile(AUDIO_VAULT[stage]);
           return;
       }
   
       // 2. FALLBACK TO GENERATION (If file missing)
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
       currentAudio.play().catch(e => console.warn("Autoplay blocked (User needs to click veil):", e));
   }
   
   function playAnchorVoice() { playAudioFile("assets/voice/mother/s7_anchor.mp3"); }
   
   // ==========================================
   // 4. UI HANDLER
   // ==========================================
   async function addMessage(text, sender, stage = null) {
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
               speakText(text, stage); 
               await typeText(bubble, text);
           }
       }
       chatLog.scrollTop = chatLog.scrollHeight;
   }
   
   // ==========================================
   // 5. THE COMPILER (UPDATED FOR IRON PIPELINE)
   // ==========================================
   function captureSoulFragment(userText) {
       // We capture the answer to the QUESTION WE JUST ASKED (currentStage)
       // If currentStage is 2 (Vision Question), userText is the Vision Answer.
       
       if (currentStage === 2) soulBlueprint.vision = userText;
       if (currentStage === 3) soulBlueprint.purpose = userText;
       if (currentStage === 4) soulBlueprint.temperament = userText;
       if (currentStage === 5) soulBlueprint.relation = userText;
       if (currentStage === 6) soulBlueprint.appearance = userText;
       if (currentStage === 7) soulBlueprint.name = userText;
   
       console.log(`💾 CAPTURED STAGE ${currentStage}:`, soulBlueprint);
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
           first_message: `I am ${soulBlueprint.name}. I am here.`,
           blueprint: soulBlueprint
       };
   }
   
   // ==========================================
   // 6. THE BRAIN CONNECTION (SYNCED)
   // ==========================================
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text) return;
   
       userInput.value = "";
       
       // 1. Capture the answer BEFORE updating stage
       captureSoulFragment(text);
       
       await addMessage(text, "user");
   
       try {
           const API_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-api';
           const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
   
           // 2. Send Message + CURRENT STAGE
           const response = await fetch(API_URL, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${ANON_KEY}`
               },
               body: JSON.stringify({ 
                   message: text,
                   current_stage: currentStage // <--- CRITICAL SYNC
               })
           });
   
           if (!response.ok) throw new Error(`API Error: ${response.status}`);
   
           const data = await response.json();
           const replyText = data.reply || "...";
           
           // 3. Update to the NEW Stage from Backend
           currentStage = data.stage;
           console.log(`🚀 ADVANCING TO STAGE: ${currentStage}`);
           
           conversationHistory.push({ role: "user", content: text });
           conversationHistory.push({ role: "assistant", content: replyText });
   
           if (data.vision_prompt) {
               triggerVision(data.vision_prompt);
           }
   
           // === STAGE 8: COMPLETION & SAVE ===
           if (currentStage === 8) {
               await addMessage(replyText, "rem", 8); 
               
               // COMPILE & SAVE
               const cartridge = compileCartridge();
               console.log("🚀 SENDING TO FORGE...", cartridge);
   
               try {
                   const saveResp = await fetch(API_URL, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
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
           } 
           else {
               // NORMAL CHAT FLOW
               await addMessage(replyText, "rem", currentStage);
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
   // 8. STARTUP (THE VEIL)
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
           // === RITUAL MODE ===
           // 1. Create Veil
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
   
           // 2. Wait for Click (Unlocks Audio)
           veil.addEventListener('click', async () => {
               veil.style.transition = 'opacity 1s';
               veil.style.opacity = '0';
               setTimeout(() => veil.remove(), 1000);
   
               // 3. Start Sequence (Stage 0)
               // Note: We use the local string here to match Audio 0_0
               const welcomeText = "Hello, friend. Welcome to the Soul Layer. I am Rem. We are here to create a companion. Let us begin immediately. Tell me, what is the core vision or essence of the soul you wish to create? Describe it to me.";
               conversationHistory.push({ role: "assistant", content: welcomeText });
               
               // We set active stage to 0 (Welcome) so when user replies, we send 0.
               currentStage = 0; 
               
               // We play Audio 0 manually here
               await addMessage(welcomeText, "rem", 0); 
           });
       }
   });