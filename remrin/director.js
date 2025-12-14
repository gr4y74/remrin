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
   
// ==========================================
// 8. STARTUP (THE GLASS VEIL - POLISHED)
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

    if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
    if (userInput) userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserAction(); });
    if (closeVisionBtn) closeVisionBtn.addEventListener('click', () => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); });
    
   // Voice Toggle Logic (Updated)
   if (statusDot) {
    statusDot.style.cursor = "pointer";
    statusDot.addEventListener('click', () => {
        isMuted = !isMuted;
        
        // 1. Change the Dot Color
        statusDot.style.background = isMuted ? "#ff4444" : "#00ff88"; // Red = Muted, Green = On
        statusDot.style.boxShadow = isMuted ? "0 0 10px #ff4444" : "0 0 10px #00ff88";
        
        // 2. Change the Text Label (The Mobile Fix)
        const statusText = document.getElementById('voice-status-text');
        if (statusText) {
            statusText.innerText = isMuted ? "VOICE: HUSH" : "VOICE: ONLINE";
            statusText.style.color = isMuted ? "#ff4444" : "#00ff88"; // Text changes color too!
        }

        if (isMuted && currentAudio) currentAudio.pause();
    });
    
    // OPTIONAL: Make clicking the text also toggle the voice (Better for fat fingers on mobile)
    const statusText = document.getElementById('voice-status-text');
    if (statusText) {
        statusText.addEventListener('click', () => statusDot.click());
    }
}

    const urlParams = new URLSearchParams(window.location.search);
    
    // === CHAT MODE (Normal) ===
    if (urlParams.get('mode') === 'chat') { 
        chatLog.innerHTML += '<div style="text-align:center; color:#666; font-size:12px; margin-top:20px; font-family:monospace;">[ SECURE CONNECTION ESTABLISHED ]</div>'; 
    } 
    // === RITUAL MODE (Onboarding) ===
    else {
        const chatContainer = document.querySelector('.chat-container') || document.body;
        if (chatContainer !== document.body) chatContainer.style.position = 'relative';

        const veil = document.createElement('div');
        veil.id = 'ritual-veil';
        veil.style.cssText = `
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 100;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: inherit;
        `;

        veil.innerHTML = `
            <div style="text-align:center; animation: fadeIn 1s ease-out; display: flex; flex-direction: column; align-items: center;">
                <div style="
                    font-family: sans-serif; 
                    color: rgba(255,255,255,0.7); 
                    letter-spacing: 3px; 
                    font-size: 11px; 
                    margin-bottom: 25px; 
                    text-transform: uppercase;
                ">
                    Soul Forge Detected
                </div>
                <button id="start-btn" style="
                    background: transparent;
                    border: 1px solid #ff00cc;
                    color: #ff00cc;
                    padding: 14px 40px;
                    font-family: sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 20px rgba(255, 0, 204, 0.15);
                    border-radius: 4px;
                    white-space: nowrap;
                    min-width: 180px;
                ">
                    INITIALIZE
                </button>
            </div>
        `;
        
        chatContainer.appendChild(veil);

        const btn = veil.querySelector('#start-btn');
        btn.onmouseover = () => {
            btn.style.background = 'rgba(255, 0, 204, 0.1)';
            btn.style.boxShadow = '0 0 30px rgba(255, 0, 204, 0.4)';
            btn.style.transform = 'translateY(-1px)';
        };
        btn.onmouseout = () => {
            btn.style.background = 'transparent';
            btn.style.boxShadow = '0 0 20px rgba(255, 0, 204, 0.15)';
            btn.style.transform = 'translateY(0)';
        };

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