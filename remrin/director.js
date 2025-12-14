/* =========================================
   REMRIN AMBASSADOR PROTOCOL v24.0 (MASTER BUILD)
   Includes: Image Persistence, Voice Widget, Card Reveal, Hush Toggle
   ========================================= */
   console.log("🤖 DIRECTOR v24.0: Master Protocol Active.");

   let chatLog, userInput, sendBtn, visionOverlay, visionImage, visionLoader, closeVisionBtn, statusDot; 
   let isMuted = false;        
   let currentAudio = null;    
   let currentStage = 0; 
   
   let soulBlueprint = { 
       vision:"", purpose:"", temperament:"", relation:"", 
       user_psychology:"", appearance:"", name:"Unknown Soul", email:"",
       voice_id: null,
       temp_image_url: null 
   };
   
   // =========================================
   // 1. HELPER FUNCTIONS
   // =========================================
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
   
   async function addMessage(text, sender, audioPath = null) {
       const msgDiv = document.createElement('div');
       msgDiv.classList.add('message', sender === 'rem' ? 'rem-msg' : 'user-msg');
       const bubble = document.createElement('div'); bubble.classList.add('bubble');
       msgDiv.appendChild(bubble); chatLog.appendChild(msgDiv);
       if (sender === 'rem') { if (audioPath) speakText(audioPath); await typeText(bubble, text); } 
       else { bubble.textContent = text; }
       chatLog.scrollTop = chatLog.scrollHeight;
   }
   
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
                   soulBlueprint.temp_image_url = data.image_url; // Store URL
                   console.log("📸 IMAGE URL CAPTURED:", data.image_url);
                   visionImage.onload = () => { visionLoader.classList.add('hidden'); visionImage.classList.remove('hidden'); }; 
               }
           } catch (e) { setTimeout(() => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); }, 2000); }
       }
   }
   
   // =========================================
   // 2. MAIN ENGINE (Handle User Action)
   // =========================================
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text) return;
   
       userInput.value = "";
       await addMessage(text, "user");
       
       // CAPTURE DATA
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
           const bridge = data.reply || "I see.";
   
           if (data.vision_prompt) triggerVision(data.vision_prompt);
   
           // --- STAGE LOGIC INTERCEPTORS ---
   
           // SPECIAL: STAGE 7 (Voice Selection)
           if (currentStage === 7) {
               await addMessage(scriptStep.text, "rem", scriptStep.audio);
               setTimeout(() => { renderVoiceChoices(); }, 1000);
           }
           // SPECIAL: STAGE 9 (Card Reveal)
           else if (currentStage === 9) {
               await addMessage(scriptStep.text, "rem", scriptStep.audio);
               setTimeout(() => { showCardReveal(); }, 3000);
           }
           // NORMAL STAGES
           else if (scriptStep) {
               let finalMessage = scriptStep.text ? `<i>${bridge}</i><br><br>${scriptStep.text}` : bridge;
               await addMessage(finalMessage, "rem", scriptStep.audio);
           } 
           else {
               await addMessage(bridge, "rem");
           }
   
           // --- SAVE LOGIC (Stage 11) ---
           if (currentStage === 11) {
               console.log("🔥 PREPARING SAVE...");
               const cartridge = {
                   name: soulBlueprint.name,
                   system_prompt: `IDENTITY: You are ${soulBlueprint.name}.\nESSENCE: ${soulBlueprint.vision}\nPSYCHOLOGY_MATCH: ${soulBlueprint.user_psychology}`,
                   description: soulBlueprint.vision,
                   voice_id: soulBlueprint.voice_id || "ThT5KcBeYtu3NO4",
                   first_message: `I am ${soulBlueprint.name}.`,
                   blueprint: soulBlueprint,
                   owner_email: soulBlueprint.email,
                   temp_image_url: soulBlueprint.temp_image_url
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
   
   // =========================================
   // 3. UI WIDGETS (Voice & Card)
   // =========================================
   
   function renderVoiceChoices() {
       const voiceOptions = [
           { id: 'ThT5KcBeYtu3NO4', label: 'Ethereal', sample: 'assets/voice/samples/ethereal.mp3' },
           { id: 'MF3mGyEYCl7XYWbV9V6O', label: 'Warm', sample: 'assets/voice/samples/warm.mp3' },
           { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Deep', sample: 'assets/voice/samples/deep.mp3' }
       ];
   
       const container = document.createElement('div');
       container.className = 'voice-widget';
       container.style.cssText = `
           background: rgba(0, 255, 136, 0.05);
           border: 1px solid rgba(0, 255, 136, 0.2);
           border-radius: 12px; padding: 15px; margin-top: 10px;
           display: flex; flex-direction: column; gap: 10px; animation: fadeIn 0.5s ease;
       `;
   
       voiceOptions.forEach(v => {
           const row = document.createElement('div');
           row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 10px;";
           
           const playBtn = document.createElement('button');
           playBtn.innerHTML = "▶ " + v.label;
           playBtn.style.cssText = `flex: 1; background: #111; border: 1px solid #333; color: #fff; padding: 8px; border-radius: 6px; cursor: pointer; text-align: left; font-family: monospace; font-size: 12px; transition: all 0.2s;`;
           playBtn.onclick = () => {
               document.querySelectorAll('audio').forEach(a => a.pause());
               const audio = new Audio(v.sample);
               audio.play().catch(e => console.log("Sample missing (expected)"));
               playBtn.style.borderColor = "#00ff88"; playBtn.style.color = "#00ff88";
               setTimeout(() => { playBtn.style.borderColor = "#333"; playBtn.style.color = "#fff"; }, 2000);
           };
   
           const selBtn = document.createElement('button');
           selBtn.innerHTML = "SELECT";
           selBtn.style.cssText = `
            background: #00ff88; 
            color: #000; 
            border: none;
            padding: 0 20px;       /* More breathing room */
            height: 32px;          /* Fixed height */
            border-radius: 6px; 
            cursor: pointer;
            font-weight: 800;      /* Extra bold */
            font-family: sans-serif;
            font-size: 11px; 
            letter-spacing: 1px;
            white-space: nowrap;   /* Never wrap text */
            min-width: 80px;       /* STOP SQUASHING */
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,255,136,0.2);
        `;
           selBtn.onclick = () => {
               soulBlueprint.voice_id = v.id;
               console.log("🎤 Voice Selected:", v.id);
               container.remove();
               userInput.value = `I choose the ${v.label} voice.`;
               handleUserAction();
           };
   
           row.appendChild(playBtn); row.appendChild(selBtn);
           container.appendChild(row);
       });
       chatLog.appendChild(container); chatLog.scrollTop = chatLog.scrollHeight;
   }
   
   function showCardReveal() {
       const overlay = document.getElementById('card-overlay');
       const card = document.getElementById('final-soul-card');
       
       // INJECT DATA
       document.getElementById('card-name').innerText = soulBlueprint.name || "UNKNOWN SOUL";
       document.getElementById('card-sync').innerText = Math.floor(Math.random() * (99 - 85) + 85) + "%";
       
       const imgEl = document.getElementById('card-image');
       if (soulBlueprint.temp_image_url) { imgEl.src = soulBlueprint.temp_image_url; } 
       else { imgEl.src = "assets/default_card.png"; }
   
       document.getElementById('card-type').innerText = "Companion • " + (soulBlueprint.vision ? soulBlueprint.vision.substring(0, 20) + "..." : "Mystery");
       document.getElementById('card-bio').innerText = `"${soulBlueprint.purpose || 'A loyal companion forged in starlight.'}"`;
   
       const traitsContainer = document.getElementById('card-traits');
       traitsContainer.innerHTML = "";
       const traits = [ soulBlueprint.temperament ? soulBlueprint.temperament.split(' ')[0] : "Loyal", "Genesis V1", "AI Soul" ];
       traits.forEach(t => {
           const span = document.createElement('span'); span.className = 'trait-pill';
           span.innerText = t.toUpperCase(); traitsContainer.appendChild(span);
       });
   
       // SHOW OVERLAY
       overlay.classList.remove('hidden');
       setTimeout(() => overlay.classList.add('active'), 10);
   
       // 3D TILT
       overlay.addEventListener('mousemove', (e) => {
           const x = (window.innerWidth / 2 - e.pageX) / 25;
           const y = (window.innerHeight / 2 - e.pageY) / 25;
           card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
       });
   
       // BUTTONS
       document.getElementById('confirm-card-btn').onclick = () => {
           overlay.classList.remove('active');
           setTimeout(() => overlay.classList.add('hidden'), 800);
           userInput.value = "Yes, they are perfect.";
           handleUserAction();
       };
   
       document.getElementById('download-card-btn').onclick = () => {
           const btn = document.getElementById('download-card-btn');
           const oldText = btn.innerText;
           btn.innerText = "CAPTURING...";
           html2canvas(document.querySelector("#final-soul-card"), { backgroundColor: null, scale: 2 }).then(canvas => {
               const link = document.createElement('a');
               link.download = `${soulBlueprint.name}_SoulCard.png`;
               link.href = canvas.toDataURL("image/png");
               link.click();
               btn.innerText = oldText;
           });
       };
   }
   
   // =========================================
   // 4. STARTUP (Glass Veil & Listeners)
   // =========================================
   window.addEventListener('load', async () => {
       chatLog = document.getElementById('chat-history');
       userInput = document.getElementById('user-input');
       sendBtn = document.getElementById('send-btn');
       visionOverlay = document.getElementById('vision-overlay');
       visionImage = document.getElementById('vision-image');
       visionLoader = document.getElementById('vision-loader');
       closeVisionBtn = document.getElementById('close-vision');
       statusDot = document.getElementById('voice-toggle');
   
       if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
       if (userInput) userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserAction(); });
       if (closeVisionBtn) closeVisionBtn.addEventListener('click', () => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); });
       
       // Voice Toggle Logic (HUSH)
       if (statusDot) {
           statusDot.style.cursor = "pointer";
           statusDot.addEventListener('click', () => {
               isMuted = !isMuted;
               statusDot.style.background = isMuted ? "#ff4444" : "#00ff88"; 
               statusDot.style.boxShadow = isMuted ? "0 0 10px #ff4444" : "0 0 10px #00ff88";
               
               const statusText = document.getElementById('voice-status-text');
               if (statusText) {
                   statusText.innerText = isMuted ? "VOICE: HUSH" : "VOICE: ONLINE";
                   statusText.style.color = isMuted ? "#ff4444" : "#00ff88"; 
               }
               if (isMuted && currentAudio) currentAudio.pause();
           });
           const statusText = document.getElementById('voice-status-text');
           if (statusText) statusText.addEventListener('click', () => statusDot.click());
       }
   
       const urlParams = new URLSearchParams(window.location.search);
       
       if (urlParams.get('mode') === 'chat') { 
           chatLog.innerHTML += '<div style="text-align:center; color:#666; font-size:12px; margin-top:20px; font-family:monospace;">[ SECURE CONNECTION ESTABLISHED ]</div>'; 
       } 
       else {
           const chatContainer = document.querySelector('.chat-container') || document.body;
           if (chatContainer !== document.body) chatContainer.style.position = 'relative';
   
           const veil = document.createElement('div');
           veil.id = 'ritual-veil';
           veil.style.cssText = `position: absolute; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: inherit;`;
   
           veil.innerHTML = `
               <div style="text-align:center; animation: fadeIn 1s ease-out; display: flex; flex-direction: column; align-items: center;">
                   <div style="font-family: sans-serif; color: rgba(255,255,255,0.7); letter-spacing: 3px; font-size: 11px; margin-bottom: 25px; text-transform: uppercase;">Soul Forge Detected</div>
                   <button id="start-btn" style="background: transparent; border: 1px solid #ff00cc; color: #ff00cc; padding: 14px 40px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 3px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(255, 0, 204, 0.15); border-radius: 4px; white-space: nowrap; min-width: 180px;">INITIALIZE</button>
               </div>
           `;
           
           chatContainer.appendChild(veil);
   
           const btn = veil.querySelector('#start-btn');
           btn.onmouseover = () => { btn.style.background = 'rgba(255, 0, 204, 0.1)'; btn.style.boxShadow = '0 0 30px rgba(255, 0, 204, 0.4)'; btn.style.transform = 'translateY(-1px)'; };
           btn.onmouseout = () => { btn.style.background = 'transparent'; btn.style.boxShadow = '0 0 20px rgba(255, 0, 204, 0.15)'; btn.style.transform = 'translateY(0)'; };
   
           btn.addEventListener('click', () => {
               veil.style.transition = 'opacity 0.6s ease';
               veil.style.opacity = '0';
               setTimeout(() => veil.remove(), 600);
               currentStage = 0; 
               const startStep = RITUAL_CONFIG[0];
               addMessage(startStep.text, "rem", startStep.audio);
           });
       }
   });