let currentPersonaId = null;
let currentLegacyPersona = null;
let currentVoiceId = "21m00Tcm4TlvDq8ikWAM";
let isSidebarOpen = false; // START CLOSED
let deferredPrompt; 

// --- UI FUNCTIONS ---
function addMessage(role, text, isLoading = false) {
    const div = document.createElement('div');
    div.className = `message ${role} ${isLoading ? 'loading-msg' : ''}`;
    div.innerHTML = text.replace(/\n/g, "<br>");
    if (role === 'ai' && !isLoading) {
        const btn = document.createElement('button');
        btn.className = 'speak-btn';
        btn.innerText = '🔊';
        btn.onclick = () => speakText(text);
        div.appendChild(btn);
    }
    document.getElementById('messages').appendChild(div);
    div.scrollIntoView({ behavior: 'smooth' });
}

// --- ORB INTERACTION ---
const orbBtn = document.getElementById('orb-btn');
const statusText = document.getElementById('voice-status');

// Mouse/Touch Down
if (orbBtn) {
    orbBtn.addEventListener('mousedown', startListening);
    orbBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startListening(); });
    // Mouse/Touch Up
    orbBtn.addEventListener('mouseup', stopListening);
    orbBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopListening(); });
}

function startListening() {
    orbBtn.classList.add('active'); // Turn Pink
    statusText.innerText = "LISTENING...";
    statusText.style.color = "#de5ba7"; // Pink text
}

function stopListening() {
    orbBtn.classList.remove('active'); // Revert
    statusText.innerText = "SENT!";
    statusText.style.color = "#00ff88"; // Green text
    
    // Demo Action: Simulate sending "Hello"
    setTimeout(() => {
        sendMessage(true); 
        // Reset text after sending
        setTimeout(() => {
            statusText.innerText = "HOLD TO SPEAK";
            statusText.style.color = "rgba(255, 255, 255, 0.6)";
        }, 2000);
    }, 500);
}

function toggleMobileMode(mode) {
    const chatContainer = document.querySelector('.main-container');
    const voiceInterface = document.getElementById('mobile-voice-interface');
    const toggleBtn = document.getElementById('mobile-toggle-btn');
    
    if (mode === 'chat') {
        chatContainer.classList.remove('voice-mode');
        voiceInterface.style.display = 'none';
        if(toggleBtn) toggleBtn.style.display = 'flex'; // Show Menu Button in Chat
    } else {
        chatContainer.classList.add('voice-mode');
        voiceInterface.style.display = 'flex';
        if(toggleBtn) toggleBtn.style.display = 'flex'; // Keep Menu Button in Voice
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('mobile-toggle-btn');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
        
        // Rotate the arrow
        if (sidebar.classList.contains('active')) {
            btn.innerHTML = '«'; // Point back (Close)
            btn.style.zIndex = '3001'; // Ensure it stays on top
        } else {
            btn.innerHTML = '»'; // Point forward (Open)
        }
    } else {
        // Desktop Logic
        isSidebarOpen = !isSidebarOpen;
        if (isSidebarOpen) {
            sidebar.classList.remove('collapsed');
        } else {
            sidebar.classList.add('collapsed');
        }
    }
}

function initMobileUI() {
    if (window.innerWidth <= 768) {
        // Only default to voice on FRESH load
        if (!document.querySelector('.voice-mode')) {
            toggleMobileMode('voice'); 
        }
    }
}

// --- PWA INSTALL MAGIC ---
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // SHOW TOAST (With Flex Display)
    const toast = document.getElementById('install-toast');
    toast.style.display = 'flex';
    
    // Also show button in settings
    document.getElementById('install-btn').style.display = 'block';
});

async function triggerInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User installed: ${outcome}`);
        deferredPrompt = null;
        document.getElementById('install-btn').style.display = 'none';
        document.getElementById('install-toast').style.display = 'none';
    }
}

function dismissToast() {
    document.getElementById('install-toast').style.display = 'none';
    // Optional: You could save to localStorage that user dismissed it
}

// --- KEYBOARD RESIZE FIX (VISUAL VIEWPORT) ---
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        // If keyboard opens (viewport gets smaller) and an input is focused
        if (window.visualViewport.height < window.innerHeight && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            // Scroll to bottom of messages
            const messages = document.getElementById('messages');
            messages.scrollTop = messages.scrollHeight;
            // Ensure the input area is visible
            document.getElementById('input-area').scrollIntoView({ behavior: "smooth", block: "end" });
        }
    });
}

async function speakText(text) {
    const key = localStorage.getItem('eleven_key');
    if (!key) return;
    let voiceId = currentVoiceId;
    if (!voiceId || voiceId === "PLACEHOLDER") voiceId = "21m00Tcm4TlvDq8ikWAM"; 
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.5 } })
        });
        if(!response.ok) throw new Error("Voice Error");
        const blob = await response.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
    } catch (e) { console.error(e); }
}

function handleEnter(e) { if(e.key === 'Enter') sendMessage(); }
function openSettings() { 
    document.getElementById('api-modal').style.display = 'block'; 
    document.getElementById('overlay-modal').style.display = 'block'; 
    if(localStorage.getItem('gemini_key')) document.getElementById('gemini-key').value = localStorage.getItem('gemini_key');
    if(localStorage.getItem('eleven_key')) document.getElementById('eleven-key').value = localStorage.getItem('eleven_key');
}
function closeSettings() { document.getElementById('api-modal').style.display = 'none'; document.getElementById('overlay-modal').style.display = 'none'; }
function saveKeys() {
    localStorage.setItem('gemini_key', document.getElementById('gemini-key').value);
    localStorage.setItem('eleven_key', document.getElementById('eleven-key').value);
    localStorage.setItem('gemini_model', document.getElementById('model-selector').value);
    closeSettings();
    alert("Keys Saved!");
}

window.onload = () => {
    const list = document.getElementById('roster-list');
    characters.forEach(char => {
        const div = document.createElement('div');
        div.className = 'character-card';
        div.id = `card-${char.id}`; // Added ID for easier lookup
        div.onclick = () => loadCharacter(char);
        div.innerHTML = `<img src="${char.avatar}" class="avatar-small"><div class="char-info"><h4>${char.name}</h4></div>`;
        list.appendChild(div);
    });
    const mainChat = document.getElementById('main-chat');
    
    // USE THE NEW GRADIENT FOR WAITING ROOM (Check if variable exists, otherwise default)
    if (typeof DEFAULT_BG_STYLE !== 'undefined') {
        mainChat.style.background = DEFAULT_BG_STYLE;
    } else {
        mainChat.style.background = "#0f111a";
    }
    
    // Add subtle particle effect (Pseudo-code via simple gradient hack)
    mainChat.style.backgroundImage = "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)";
    mainChat.style.backgroundSize = "50px 50px, 100px 100px";
    mainChat.style.backgroundPosition = "0 0, 25px 25px";
    
    initMobileUI();
};

// --- THE REPAIRED LOAD CHARACTER FUNCTION ---
async function loadCharacter(char) {
    // --- 1. SIDEBAR HIGHLIGHT LOGIC (CRASH FIX) ---
    // We clear all active classes first
    document.querySelectorAll('.character-card').forEach(c => c.classList.remove('active'));

    // SAFETY CHECK: Only try to highlight the clicked card if 'event' actually exists!
    if (typeof event !== 'undefined' && event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // Fallback: Try to find card by ID
        const autoCard = document.getElementById(`card-${char.id}`);
        if (autoCard) autoCard.classList.add('active');
    }

    // --- 2. UPDATE CORE IDENTITY ---
    currentPersonaId = char.id;
    currentVoiceId = char.voice;
    
    document.getElementById('char-name').innerText = char.name;
    document.getElementById('current-hero-img').src = char.avatar;
    document.getElementById('current-hero-img').style.display = 'block';
    document.getElementById('messages').innerHTML = ''; 
    
    // --- 3. GRAB ELEMENTS ---
    const mainChat = document.getElementById('main-chat');
    const heroImg = document.getElementById('hero-standing');
    const bgVideo = document.getElementById('bg-video');

    // --- 4. THE BACKGROUND LOGIC (Video vs Hero) ---
    if (char.hero_standing) {
        // [SCENARIO A] STANDING HERO (Priority 1)
        
        // Kill Video
        if(bgVideo) {
            bgVideo.classList.remove('active');
            bgVideo.pause();
        }

        // Set Gradient & Show Hero
        mainChat.style.backgroundImage = `none`; 
        mainChat.style.background = `linear-gradient(to bottom, #1a1a2e, #16213e)`;
        
        heroImg.src = char.hero_standing;
        heroImg.style.display = 'block';

    } else {
        // [SCENARIO B & C] NO STANDING HERO
        heroImg.style.display = 'none'; 

        // Check for VIDEO
        if (char.bg && (char.bg.endsWith('.mp4') || char.bg.endsWith('.webm'))) {


// [SCENARIO B] VIDEO MODE
        if (char.bg && (char.bg.endsWith('.mp4') || char.bg.endsWith('.webm'))) {
            console.log("🎬 Loading Video Mode: " + char.name);

            // 1. ROLL UP THE RUG (Clear Background Colors)
            // We need to make the body transparent so the video (z-index: -1) shows through
            document.body.style.backgroundColor = 'transparent'; 
            document.body.style.backgroundImage = 'none';
            mainChat.style.background = 'transparent'; 
            
            // 2. PLAY THE VIDEO
            if(bgVideo) {
                bgVideo.src = char.bg;
                bgVideo.classList.add('active');
                bgVideo.play().catch(e => console.warn("Autoplay blocked:", e));
            }

        } else {
            // [SCENARIO C] IMAGE MODE / DEFAULT
            
            // 1. PUT THE RUG BACK (Restore Void Color)
            // If we don't do this, the background might stay white/transparent!
            document.body.style.backgroundColor = '#0f111a'; 

            if(bgVideo) {
                bgVideo.classList.remove('active');
                setTimeout(() => bgVideo.pause(), 500);
            }
            
            const bgUrl = char.bg || (typeof DEFAULT_BG_URL !== 'undefined' ? DEFAULT_BG_URL : '');
            mainChat.style.backgroundImage = `url('${bgUrl}')`;
            mainChat.style.backgroundPosition = 'center top'; 
            mainChat.style.backgroundSize = 'cover';
        }

            
    // --- 5. OPENING MESSAGE LOGIC (This was missing!) ---
    if (typeof SOUL_CARTRIDGES !== 'undefined' && SOUL_CARTRIDGES[char.id]) {
        const soul = SOUL_CARTRIDGES[char.id];
        currentLegacyPersona = null;
        document.getElementById('char-tagline').innerText = soul.TAGLINE;
        setTimeout(() => addMessage('ai', soul.OPENING), 500);
    } else {
        try {
            const response = await fetch(`content/characters/${char.file}`);
            if(!response.ok) throw new Error("JSON not found");
            const data = await response.json();
            currentLegacyPersona = data; 
            document.getElementById('char-tagline').innerText = currentLegacyPersona.CORE_IDENTITY.Tagline;
            setTimeout(() => {
                const opening = currentLegacyPersona.BEHAVIORAL_DIRECTIVES["1_OPENING_HOOK"] || "Hello!";
                addMessage('ai', opening); 
            }, 500);
        } catch (e) { 
            console.error(e);
            addMessage('ai', 'Error loading Soul file'); 
        }
    }

    // --- 6. MOBILE LOGIC ---
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active'); // Force Close
        const btn = document.querySelector('.mobile-nav-toggle');
        if(btn) btn.innerHTML = '»';
        toggleMobileMode('voice'); // Auto-switch to voice on char select
    }
}

function generateSystemPrompt(characterKey) {
    const soul = SOUL_CARTRIDGES[characterKey];
    // Ensure UNIVERSAL_SOUL_ENGINE_V7_2 is available
    const engine = (typeof UNIVERSAL_SOUL_ENGINE_V7_2 !== 'undefined') ? UNIVERSAL_SOUL_ENGINE_V7_2 : {};
    const fullSystem = { "ENGINE": engine, "ACTIVE_SOUL": soul };
    return JSON.stringify(fullSystem, null, 2);
}

async function sendMessage(isDemoTrigger = false) {
    const input = document.getElementById('user-input');
    const text = isDemoTrigger ? "Hello" : input.value;
    
    if (!text) return;
    if (!isDemoTrigger) addMessage('user', text);
    input.value = '';
    
    const geminiKey = localStorage.getItem('gemini_key');
    const selectedModel = document.getElementById('model-selector').value || 'gemini-2.0-flash-001';
    if (!geminiKey) { addMessage('ai', '⚠️ Set API Key'); return; }
    if (!isDemoTrigger) addMessage('ai', '...', true); 

    try {
        if(!currentPersonaId) throw new Error("Select a character");
        let systemInstructionText;
        if (SOUL_CARTRIDGES[currentPersonaId]) {
            systemInstructionText = generateSystemPrompt(currentPersonaId);
        } else if (currentLegacyPersona) {
            systemInstructionText = `You are ${currentLegacyPersona.CORE_IDENTITY.Name}. TONE: ${currentLegacyPersona.TONE_AND_VOICE_RULES.Speech_Pattern}.`;
        } else { throw new Error("No Data"); }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstructionText }] },
                contents: [ { role: "user", parts: [{ text: text }] } ]
            })
        });
        const data = await response.json();
        const loader = document.querySelector('.loading-msg');
        if(loader) loader.remove();
        
        if(data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text;
            addMessage('ai', reply);
            speakText(reply);
        }
    } catch (e) { 
        if(document.querySelector('.loading-msg')) document.querySelector('.loading-msg').remove();
        addMessage('ai', 'Error'); 
    }
}
