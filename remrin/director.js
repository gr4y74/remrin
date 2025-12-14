/* =========================================
   REMRIN AMBASSADOR PROTOCOL v23.0 (IMAGE PERSISTENCE)
   ========================================= */
   console.log("🤖 DIRECTOR v23.0: Image Persistence Active.");

   let chatLog, userInput, sendBtn, visionOverlay, visionImage, visionLoader, closeVisionBtn, statusDot; 
   let isMuted = false;        
   let currentAudio = null;    
   let currentStage = 0; 
   
   let soulBlueprint = { 
       vision:"", purpose:"", temperament:"", relation:"", 
       user_psychology:"", appearance:"", name:"Unknown Soul", email:"",
       temp_image_url: null // New field for the ephemeral URL
   };
   
   // ... (Keep typeText, speakText) ...
   function typeText(element, htmlContent, speed = 15) {
       return new Promise((resolve) => {
           const tempDiv = document.createElement("div"); tempDiv.innerHTML = htmlContent;
           const plainText = tempDiv.textContent || tempDiv.innerText || "";
           let i = 0; element.textContent = ""; 
           function type() {
               if (i < plainText.length) { element.textContent += plainText.charAt(i); i++; chatLog.scrollTop = chatLog.scrollHeight; setTimeout(type, speed); } 
               else { element.innerHTML = htmlContent; resolve(); }
           } type();
       });
   }
   function speakText(audioPath) {
       if (isMuted || !audioPath) return;
       if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
       currentAudio = new Audio(audioPath);
       currentAudio.play().catch(e => console.warn("Autoplay blocked", e));
   }
   
   // === MAIN LOGIC ===
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text) return;
   
       userInput.value = "";
       await addMessage(text, "user");
       
       // CAPTURE
       if (currentStage === 2) { soulBlueprint.vision = text; soulBlueprint.purpose = text; }
       if (currentStage === 3) { soulBlueprint.temperament = text; soulBlueprint.relation = text; }
       if (currentStage === 4) { soulBlueprint.user_psychology = text; }
       if (currentStage === 5) { soulBlueprint.appearance = text; }
       if (currentStage === 8) { soulBlueprint.name = text; }
       if (currentStage === 10) { soulBlueprint.email = text; }
   
       try {
           const API_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-api';
           const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
   
           const response = await fetch(API_URL, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
               body: JSON.stringify({ message: text, current_stage: currentStage })
           });
   
           const data = await response.json();
           
           if (data.stage !== undefined) currentStage = data.stage;
   
           const scriptStep = RITUAL_CONFIG[currentStage];
           let finalMessage = "";
           const bridge = data.reply || "I see.";
   
           if (scriptStep) {
               finalMessage = scriptStep.text ? `<i>${bridge}</i><br><br>${scriptStep.text}` : bridge;
               await addMessage(finalMessage, "rem", scriptStep.audio);
           } else {
               await addMessage(bridge, "rem");
           }
   
           if (data.vision_prompt) triggerVision(data.vision_prompt);
   
           // SAVE AT END
           if (currentStage === 11) {
               console.log("🔥 PREPARING SAVE...");
               const cartridge = {
                   name: soulBlueprint.name,
                   system_prompt: `IDENTITY: You are ${soulBlueprint.name}.\nESSENCE: ${soulBlueprint.vision}\nPSYCHOLOGY_MATCH: ${soulBlueprint.user_psychology}`,
                   description: soulBlueprint.vision,
                   voice_id: "ThT5KcBeYtu3NO4",
                   first_message: `I am ${soulBlueprint.name}.`,
                   blueprint: soulBlueprint,
                   owner_email: soulBlueprint.email,
                   temp_image_url: soulBlueprint.temp_image_url // PASS THE URL
               };
   
               const saveResp = await fetch(API_URL, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
                   body: JSON.stringify({ action: 'create_companion', cartridge: cartridge })
               });
   
               if (saveResp.ok) {
                   const saveResult = await saveResp.json();
                   console.log("✅ SOUL SAVED:", saveResult.companion_id);
                   const note = document.createElement('div');
                   note.innerHTML = `<span style="color:#00ff88; font-family:monospace;">[ SOUL SAVED: ${saveResult.companion_id} ]</span>`;
                   note.style.textAlign = 'center';
                   chatLog.appendChild(note);
               }
           }
   
       } catch (error) {
           console.error("❌ ERROR:", error);
       }
   }
   
   async function addMessage(text, sender, audioPath = null) {
       const msgDiv = document.createElement('div');
       msgDiv.classList.add('message', sender === 'rem' ? 'rem-msg' : 'user-msg');
       const bubble = document.createElement('div'); bubble.classList.add('bubble');
       msgDiv.appendChild(bubble); chatLog.appendChild(msgDiv);
       if (sender === 'rem') { if (audioPath) speakText(audioPath); await typeText(bubble, text); } 
       else { bubble.textContent = text; }
       chatLog.scrollTop = chatLog.scrollHeight;
   }
   
   // UPDATE TRIGGERVISION TO STORE URL
   async function triggerVision(prompt) {
       if (visionOverlay) {
           visionOverlay.classList.remove('hidden'); setTimeout(() => visionOverlay.classList.add('active'), 10);
           visionLoader.classList.remove('hidden'); visionImage.classList.add('hidden');
           try {
               const API_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-vision';
               const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';
               const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` }, body: JSON.stringify({ prompt: prompt }) });
               const data = await response.json();
               
               if (data.image_url) { 
                   visionImage.src = data.image_url; 
                   soulBlueprint.temp_image_url = data.image_url; // <--- CRITICAL STORE
                   console.log("📸 IMAGE URL CAPTURED:", data.image_url);
                   
                   visionImage.onload = () => { visionLoader.classList.add('hidden'); visionImage.classList.remove('hidden'); }; 
               }
           } catch (e) { setTimeout(() => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); }, 2000); }
       }
   }
   
   // ... (Startup remains the same) ...
   window.addEventListener('load', async () => {
       chatLog = document.getElementById('chat-history'); userInput = document.getElementById('user-input'); sendBtn = document.getElementById('send-btn');
       visionOverlay = document.getElementById('vision-overlay'); visionImage = document.getElementById('vision-image'); visionLoader = document.getElementById('vision-loader'); closeVisionBtn = document.getElementById('close-vision'); statusDot = document.getElementById('voice-toggle');
       if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
       if (userInput) userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserAction(); });
       if (closeVisionBtn) closeVisionBtn.addEventListener('click', () => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); });
       
       const urlParams = new URLSearchParams(window.location.search);
       if (urlParams.get('mode') === 'chat') { chatLog.innerHTML += '<div style="text-align:center;">[ CONNECTED ]</div>'; } 
       else {
           const veil = document.createElement('div');
           veil.style.cssText = 'position:fixed; inset:0; background:black; z-index:10000; display:flex; align-items:center; justify-content:center; cursor:pointer;';
           veil.innerHTML = '<h1 style="color:#ff00cc; font-family:sans-serif; letter-spacing:4px;">CLICK TO BEGIN</h1>';
           document.body.appendChild(veil);
           veil.addEventListener('click', () => {
               veil.remove();
               currentStage = 0; 
               const startStep = RITUAL_CONFIG[0];
               addMessage(startStep.text, "rem", startStep.audio);
           });
       }
   });