/* =========================================
   REMRIN AMBASSADOR PROTOCOL v26.0 (INVESTOR READY)
   Includes: Markdown Parser, Download Flattener, Bio Logic V2, 6 Voices
   ========================================= */

// Config and Supabase are loaded via script tags in HTML
// - config.js provides window.REMRIN_CONFIG
// - Supabase CDN provides window.supabase

// Wait for config to be available
const SUPABASE_URL = window.REMRIN_CONFIG?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.REMRIN_CONFIG?.SUPABASE_ANON_KEY;

console.log("DEBUG: SUPABASE URL:", SUPABASE_URL);
console.log("DEBUG: SUPABASE KEY:", SUPABASE_ANON_KEY ? "Present" : "Missing");

// Initialize Supabase client from CDN
const { createClient } = window.supabase || {};
const supabaseClient = createClient ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

console.log("🤖 DIRECTOR v26.0: Investor Protocol Active.");

let chatLog, userInput, sendBtn, micBtn, visionOverlay, visionImage, visionLoader, closeVisionBtn, statusDot;
let isMuted = false;
let currentAudio = null;
let currentStage = 0;

let soulBlueprint = {
    vision: "", purpose: "", temperament: "", relation: "",
    user_psychology: "", appearance: "", name: "Unknown Soul", email: "",
    voice_id: null,
    temp_image_url: null,
    id: null,
    safety_level: null
};

// =========================================
// 1. HELPER FUNCTIONS
// =========================================

// MARKDOWN PARSER: Converts **bold** to <b>bold</b> and \n to <br>
function parseMarkdown(text) {
    if (!text) return "";
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
        .replace(/\*(.*?)\*/g, '<i>$1</i>')     // Italic
        .replace(/\n/g, '<br>');                // Line breaks
    return html;
}

// HTML-AWARE TYPEWRITER: Types text content but renders tags instantly
function typeText(element, rawText, speed = 15) {
    return new Promise((resolve) => {
        const html = parseMarkdown(rawText);
        element.innerHTML = "";

        // Split HTML into tokens: tags (<...>) and text content
        // Regex captures tags in group 1 to include them in the split result
        const tokens = html.split(/(<[^>]+>)/g).filter(t => t !== "");

        let tokenIndex = 0;
        let charIndex = 0;

        function type() {
            if (tokenIndex < tokens.length) {
                const token = tokens[tokenIndex];

                if (token.startsWith('<')) {
                    // It's a tag: append instantly and move to next token
                    element.innerHTML += token;
                    tokenIndex++;
                    type();
                } else {
                    // It's text: type one char
                    if (charIndex < token.length) {
                        element.innerHTML += token.charAt(charIndex);
                        charIndex++;
                        chatLog.scrollTop = chatLog.scrollHeight;
                        setTimeout(type, speed);
                    } else {
                        // Finished this text node, move to next token
                        charIndex = 0;
                        tokenIndex++;
                        type();
                    }
                }
            } else {
                resolve();
            }
        }
        type();
    });
}

function speakText(audioPath) {
    if (isMuted || !audioPath) return;
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
    currentAudio = new Audio(audioPath);
    currentAudio.play().catch(e => console.warn("Autoplay blocked/missing", e));
}

async function addMessage(text, sender, audioPath = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'rem' ? 'rem-msg' : 'user-msg');

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');

    msgDiv.appendChild(bubble);
    chatLog.appendChild(msgDiv);

    if (sender === 'rem') {
        if (audioPath) speakText(audioPath);
        await typeText(bubble, text);
    } else {
        // User messages don't need typing effect
        bubble.innerHTML = parseMarkdown(text);
    }
    chatLog.scrollTop = chatLog.scrollHeight;
}

async function triggerVision(prompt) {
    if (visionOverlay) {
        visionOverlay.classList.remove('hidden');
        setTimeout(() => visionOverlay.classList.add('active'), 10);
        visionLoader.classList.remove('hidden');
        visionImage.classList.add('hidden');

        try {
            const API_URL = SUPABASE_URL + '/functions/v1/genesis-vision';
            const API_KEY = SUPABASE_ANON_KEY;
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({ prompt: prompt })
            });
            const data = await response.json();

            if (data.image_url) {
                visionImage.src = data.image_url;
                soulBlueprint.temp_image_url = data.image_url;
                visionImage.onload = () => { visionLoader.classList.add('hidden'); visionImage.classList.remove('hidden'); };
            }
        } catch (e) {
            console.error("Vision Failed:", e);
            setTimeout(() => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); }, 2000);
        }
    }
}

// =========================================
// 2. MAIN ENGINE
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
    if (currentStage === 8) {
        // SMART NAME CLEANER: If they type "Her name is Squee", just take "Squee"
        // Logic: Take the last word if it starts with a capital letter, otherwise take whole text.
        const words = text.split(" ");
        if (words.length > 1 && words.length < 6) {
            const lastWord = words[words.length - 1];
            // Simple heuristic: If last word is capitalized, assume it's the name.
            if (lastWord[0] === lastWord[0].toUpperCase()) {
                soulBlueprint.name = lastWord.replace(/[!.?]/g, ""); // Remove punctuation
            } else {
                soulBlueprint.name = text;
            }
        } else {
            soulBlueprint.name = text;
        }
    }
    if (currentStage === 10) { soulBlueprint.email = text; }

    // STAGE 10: EMAIL HARD GATE -> CARD REVEAL
    // This MUST happen before calling genesis-api
    if (currentStage === 10) {
        // Email is captured above, now validate and proceed
        if (soulBlueprint.email && soulBlueprint.email.includes('@')) {
            const scriptStep = RITUAL_CONFIG[11];
            await addMessage(scriptStep.text, "rem", scriptStep.audio);
            setTimeout(() => { showCardReveal(); }, 2000);
            return; // Exit early, don't call genesis-api for email stage
        } else {
            await addMessage("Please enter a valid email address to claim your soul.", "rem");
            return; // Stay on Stage 10
        }
    }

    try {
        const API_URL = SUPABASE_URL + '/functions/v1/genesis-api';
        const API_KEY = SUPABASE_ANON_KEY;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({ message: text, current_stage: currentStage })
        });

        const data = await response.json();
        if (data.stage !== undefined) currentStage = data.stage;

        const scriptStep = RITUAL_CONFIG[currentStage];
        const bridge = data.reply || "I see.";

        if (data.vision_prompt) triggerVision(data.vision_prompt);

        // --- STAGE LOGIC ---
        if (currentStage === 7) {
            await addMessage(scriptStep.text, "rem", scriptStep.audio);
            setTimeout(() => { renderVoiceChoices(); }, 1000);
        }
        else if (currentStage === 9) {
            // BEFORE CARD REVEAL -> SHOW SAFETY WIDGET (if not already set)
            if (!soulBlueprint.safety_level) {
                await addMessage("One final calibration. Who is this companion designed for?", "rem");
                setTimeout(() => { renderSafetyWidget(); }, 1000);
            } else {
                // Safety already set, but STILL need email -> Stage 10 HARD GATE
                currentStage = 10;
                const emailStep = RITUAL_CONFIG[10];
                await addMessage(emailStep.text, "rem", emailStep.audio);
            }
        }
        else if (scriptStep) {
            // Append the Mother's scripted text to the AI's bridge
            let finalMessage = "";
            if (bridge && bridge.length > 5) finalMessage += `<i>${bridge}</i><br><br>`;
            if (scriptStep.text) finalMessage += scriptStep.text;

            await addMessage(finalMessage, "rem", scriptStep.audio);
        }
        else {
            await addMessage(bridge, "rem");
        }

        // --- SAVE LOGIC ---
        if (currentStage === 11) {
            console.log("🔥 PREPARING SAVE...");
            // ... (Save logic remains same)
        }

    } catch (error) {
        console.error("❌ ERROR:", error);
    }
}

// =========================================
// 3. UI WIDGETS
// =========================================

// =========================================
// 3. UI WIDGETS (UPDATED: 9 VOICES)
// =========================================

function renderVoiceChoices() {
    // UPDATED: CUSTOM VOICE ROSTER
    const voiceOptions = [
        // FEMININE
        { id: 'F_Emma', label: 'Emma (F)', sample: 'assets/voice/samples/emma.mp3', type: 'FEM' },
        { id: 'F_Blonde', label: 'Blonde (F)', sample: 'assets/voice/samples/blonde.mp3', type: 'FEM' },
        { id: 'F_Mystic', label: 'Mystic (F)', sample: 'assets/voice/samples/mystic.mp3', type: 'FEM' },

        // MASCULINE
        { id: 'M_Deep', label: 'Deep (M)', sample: 'assets/voice/samples/deep.mp3', type: 'MASC' },
        { id: 'M_Scholar', label: 'Scholar (M)', sample: 'assets/voice/samples/scholar.mp3', type: 'MASC' },
        { id: 'M_Rogue', label: 'Rogue (M)', sample: 'assets/voice/samples/rogue.mp3', type: 'MASC' },

        // XEN / OTHER
        { id: 'O_Old', label: 'Old Man (M)', sample: 'assets/voice/samples/old.mp3', type: 'MASC' },
        { id: 'O_Frog', label: 'Frog (X)', sample: 'assets/voice/samples/frog.mp3', type: 'XEN' },
        { id: 'O_Ancient', label: 'Ancient (M)', sample: 'assets/voice/samples/ancient.mp3', type: 'MASC' },
    ];

    const container = document.createElement('div');
    container.className = 'voice-widget';
    container.style.cssText = `
        background: rgba(0, 255, 136, 0.05); 
        border: 1px solid rgba(0, 255, 136, 0.2); 
        border-radius: 12px; 
        padding: 15px; 
        margin-top: 10px; 
        display: flex; 
        flex-direction: column; 
        gap: 8px; 
        animation: fadeIn 0.5s ease;
        height: auto; 
        width: 100%;
    `;

    // Add a label
    const label = document.createElement('div');
    label.innerText = "SELECT VOICE FREQUENCY:";
    label.style.cssText = "font-size: 10px; color: #00ff88; letter-spacing: 2px; margin-bottom: 5px; font-weight: bold;";
    container.appendChild(label);

    voiceOptions.forEach(v => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0;";

        // Color code
        let badgeColor = "#888";
        if (v.type === 'FEM') badgeColor = "#ec4899"; // Pink
        if (v.type === 'MASC') badgeColor = "#3b82f6"; // Blue
        if (v.type === 'XEN') badgeColor = "#f59e0b"; // Orange/Gold

        const playBtn = document.createElement('button');
        playBtn.innerHTML = `<span style="color:${badgeColor}; margin-right:6px;">●</span> ${v.label}`;
        playBtn.style.cssText = `
            flex: 1; 
            background: #111; 
            border: 1px solid #333; 
            color: #fff; 
            padding: 10px; 
            border-radius: 6px; 
            cursor: pointer; 
            text-align: left; 
            font-family: monospace; 
            font-size: 12px; 
            transition: all 0.2s;
            white-space: nowrap;
        `;

        playBtn.onclick = () => {
            // 1. Kill the currently playing audio
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }

            // 2. Play new sample
            currentAudio = new Audio(v.sample);
            currentAudio.play().catch(e => console.log("Sample missing:", v.sample));

            // Visual feedback
            playBtn.style.borderColor = badgeColor;
            playBtn.style.color = badgeColor;
            setTimeout(() => { playBtn.style.borderColor = "#333"; playBtn.style.color = "#fff"; }, 2000);
        };

        const selBtn = document.createElement('button');
        selBtn.innerHTML = "PICK";
        selBtn.style.cssText = `
            background: ${badgeColor}; 
            color: #000; 
            border: none; 
            padding: 0 12px; 
            height: 36px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-weight: 800; 
            font-size: 10px; 
            min-width: 60px;
        `;

        selBtn.onclick = () => {
            if (currentAudio) currentAudio.pause();

            soulBlueprint.voice_id = v.id;
            container.remove();
            userInput.value = `I choose the ${v.label} voice.`;
            handleUserAction();
        };

        row.appendChild(playBtn); row.appendChild(selBtn);
        container.appendChild(row);
    });

    chatLog.appendChild(container);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// =========================================
// SAFETY WIDGET (Age Rating Selection)
// =========================================
function renderSafetyWidget() {
    const container = document.createElement('div');
    container.className = 'safety-widget';
    container.style.cssText = `
        background: rgba(255, 50, 50, 0.1); 
        border: 1px solid rgba(255, 50, 50, 0.3); 
        border-radius: 12px; 
        padding: 15px; 
        margin-top: 15px; 
        display: flex; 
        flex-direction: column; 
        gap: 10px; 
        animation: fadeIn 0.5s ease;
        width: 100%;
    `;

    const label = document.createElement('div');
    label.innerText = "SAFETY PROTOCOL (REQUIRED):";
    label.style.cssText = "font-size: 10px; color: #ff5555; letter-spacing: 2px; font-weight: bold;";
    container.appendChild(label);

    const levels = [
        { id: 'CHILD', icon: '🧸', text: 'Child (Strict Safety)', color: '#00ff88' },
        { id: 'TEEN', icon: '⚡', text: 'Teen (PG-13)', color: '#f59e0b' },
        { id: 'ADULT', icon: '🔞', text: 'Adult (Unrestricted)', color: '#ff4444' }
    ];

    levels.forEach(lvl => {
        const btn = document.createElement('button');
        btn.innerHTML = `${lvl.icon} ${lvl.text}`;
        btn.style.cssText = `
            background: rgba(0,0,0,0.4); 
            border: 1px solid #444; 
            color: #ccc; 
            padding: 12px; 
            border-radius: 6px; 
            cursor: pointer; 
            text-align: left; 
            font-family: monospace; 
            font-size: 12px; 
            transition: all 0.2s;
            width: 100%;
        `;

        btn.onclick = () => {
            // Set the Blueprint directly
            soulBlueprint.safety_level = lvl.id;

            // Visual Feedback
            btn.style.borderColor = lvl.color;
            btn.style.color = lvl.color;
            btn.style.background = "rgba(255,255,255,0.1)";

            // Remove widget after selection, then proceed to card reveal
            setTimeout(() => {
                container.remove();

                // Add confirmation message
                addMessage(`Safety set to ${lvl.text}. Now we need your email...`, "user");

                // HARD GATE: Must go through Stage 10 for email
                currentStage = 10;
                const emailStep = RITUAL_CONFIG[10];
                addMessage(emailStep.text, "rem", emailStep.audio);
            }, 500);
        };

        container.appendChild(btn);
    });

    chatLog.appendChild(container);
    chatLog.scrollTop = chatLog.scrollHeight;
}

/* =========================================
   THE CARD REVEAL ENGINE (FINAL V4 - DOWNLOAD FIX)
   ========================================= */
function showCardReveal() {
    // SAFETY GUARD: Abort if email missing or invalid
    if (!soulBlueprint.email || soulBlueprint.email === "" || soulBlueprint.email === "guest") {
        console.warn("⚠️ SAFETY GUARD: Email missing, forcing Stage 10");
        currentStage = 10;
        const emailStep = RITUAL_CONFIG[10];
        addMessage(emailStep.text, "rem", emailStep.audio);
        return; // Abort card reveal
    }

    console.log("🃏 REVEALING CARD...");
    const overlay = document.getElementById('card-overlay');
    const card = document.getElementById('final-soul-card');

    // 1. UNHIDE
    overlay.classList.remove('hidden');

    // 2. DATA INJECTION
    const sessionID = soulBlueprint.id || 'GEN-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    // --- NAME LOGIC ---
    let cleanName = (soulBlueprint.name || "UNKNOWN").replace(/[!.?]/g, "").toUpperCase();
    if (cleanName.length > 15) cleanName = cleanName.substring(0, 15) + "...";
    document.getElementById('card-name').innerText = cleanName;

    // --- SYNC SCORE ---
    document.getElementById('card-sync').innerText = Math.floor(Math.random() * (99 - 88) + 88) + "%";

    // --- IMAGE ---
    const imgEl = document.getElementById('card-image');
    if (soulBlueprint.temp_image_url) {
        imgEl.src = soulBlueprint.temp_image_url;
        imgEl.crossOrigin = "anonymous";
    } else {
        imgEl.src = "assets/default_card.png";
    }

    // --- BIO (Using Smart Generator) ---
    // The previous bug was here: it was overwriting this line later!
    document.getElementById('card-bio').innerText = `"${generateBio(soulBlueprint)}"`;

    // --- TYPE ---
    const archetype = soulBlueprint.vision ? soulBlueprint.vision.split(' ')[0].toUpperCase() : "SOUL";
    document.getElementById('card-type').innerText = "Genesis V1 • " + archetype;

    // --- TRAITS (Using Smart Extraction) ---
    const traitsContainer = document.getElementById('card-traits');
    traitsContainer.innerHTML = "";

    // Use the SMART extractor, not the raw text split
    const traits = extractTraits(soulBlueprint);

    // Colorful Pills Logic
    const pillColors = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6'];

    traits.forEach((t, index) => {
        const span = document.createElement('span');
        span.className = 'trait-pill';
        span.innerText = t.toUpperCase();
        // Dynamic Coloring
        span.style.borderColor = pillColors[index % pillColors.length];
        span.style.color = pillColors[index % pillColors.length];
        span.style.background = "rgba(0,0,0,0.3)";
        traitsContainer.appendChild(span);
    });

    // --- QR CODE ---
    const qrContainer = document.getElementById('qrcode-container'); // Ensure HTML ID matches this
    // Or use .qr-chip class if ID is missing:
    const qrTarget = qrContainer || document.querySelector('.qr-chip');

    if (qrTarget) {
        qrTarget.innerHTML = "";
        try {
            new QRCode(qrTarget, {
                text: `https://remrin.vercel.app/soul/${sessionID}`,
                width: 40, height: 40,
                colorDark: "#000000", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L
            });
        } catch (e) { console.error("QR Error", e); }
    }

    // 4. FADE IN & TILT
    setTimeout(() => overlay.classList.add('active'), 50);

    document.addEventListener('mousemove', (e) => {
        if (!overlay.classList.contains('active')) return;
        const x = (window.innerWidth / 2 - e.pageX) / 25;
        const y = (window.innerHeight / 2 - e.pageY) / 25;
        card.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    });

    // 5. DOWNLOAD LOGIC (FLATTENER FIX)
    const dlBtn = document.getElementById('download-card-btn');
    const newDlBtn = dlBtn.cloneNode(true);
    dlBtn.parentNode.replaceChild(newDlBtn, dlBtn);

    newDlBtn.onclick = () => {
        const oldText = newDlBtn.innerText;
        newDlBtn.innerText = "CAPTURING...";
        card.style.transform = "none"; // Flatten

        setTimeout(() => {
            html2canvas(document.querySelector("#final-soul-card"), {
                backgroundColor: null, scale: 3, useCORS: true
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `${cleanName}_Card.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
                newDlBtn.innerText = oldText;
                card.style.transform = ""; // Un-flatten
            });
        }, 50);
    };

    // Confirm Btn
    const confirmBtn = document.getElementById('confirm-card-btn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.onclick = async () => {
        const oldText = newConfirmBtn.innerText;
        newConfirmBtn.innerText = "CONNECTING...";
        newConfirmBtn.disabled = true;

        try {
            console.log("🔌 WIRING STARTED...");

            // 1. UPLOAD IMAGE
            const imageUrl = soulBlueprint.temp_image_url;
            if (!imageUrl) throw new Error("No image generated.");

            // Fetch the blob from the URL
            const res = await fetch(imageUrl);
            const blob = await res.blob();

            // Upload to Supabase Storage
            const fileName = `souls/${Date.now()}_${soulBlueprint.name.replace(/\s+/g, '')}.png`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('soul_forge')
                .upload(fileName, blob);

            if (uploadError) throw new Error("Upload Failed: " + uploadError.message);

            // Get Public URL
            const { data: publicUrlData } = supabaseClient.storage
                .from('soul_forge')
                .getPublicUrl(fileName);

            const finalPublicUrl = publicUrlData.publicUrl;
            console.log("✅ IMAGE UPLOADED:", finalPublicUrl);

            // 2. INSERT ROW INTO V2 TABLE (personas)
            const userEmail = soulBlueprint.email || "guest";

            const newPersona = {
                name: soulBlueprint.name || "Unknown Soul",
                system_prompt: `IDENTITY: ${soulBlueprint.vision}. TONE: ${soulBlueprint.temperament}. PURPOSE: ${soulBlueprint.purpose}.`,
                voice_id: soulBlueprint.voice_id || "ThT5KcBeYtu3NO4",
                image_url: finalPublicUrl,
                safety_level: soulBlueprint.safety_level || 'ADULT', // Default to Adult if somehow skipped
                visibility: 'PRIVATE',

                // THE CRITICAL FIX:
                // We don't use a UUID yet. We use a "Claim Tag".
                // The SQL Trigger will detect this later.
                owner_id: `pending:${userEmail}`,

                config: {
                    psychology: soulBlueprint.user_psychology,
                    appearance: soulBlueprint.appearance
                }
            };

            const { data: insertedSoul, error: insertError } = await supabaseClient
                .from('personas')
                .insert([newPersona])
                .select();

            if (insertError) throw new Error("DB Insert Failed: " + insertError.message);
            console.log("✅ DB RECORD INSERTED:", insertedSoul);

            // 3. INVOKE NBB UPSCALER (compile-persona)
            const newPersonaId = insertedSoul[0]?.id;
            if (newPersonaId) {
                newConfirmBtn.innerText = "FORGING NEURAL PATHWAYS...";
                console.log("🧬 INVOKING UPSCALER FOR:", newPersonaId);

                try {
                    // Call the compile-persona edge function
                    const compileResponse = await fetch(SUPABASE_URL + '/functions/v1/compile-persona', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        },
                        body: JSON.stringify({
                            persona_id: newPersonaId,
                            name: soulBlueprint.name,
                            identity: soulBlueprint.vision,
                            tone: soulBlueprint.temperament,
                            user_input_raw: JSON.stringify({
                                purpose: soulBlueprint.purpose,
                                relation: soulBlueprint.relation,
                                psychology: soulBlueprint.user_psychology,
                                appearance: soulBlueprint.appearance
                            })
                        })
                    });

                    const compileResult = await compileResponse.json();

                    if (compileResult.error) {
                        console.warn("⚠️ UPSCALER WARNING:", compileResult.error);
                        // Don't block - continue to redirect even if upscaler fails
                    } else {
                        console.log("✅ NEURAL BLUEPRINT COMPILED:", compileResult.blueprint ? "Success" : "No blueprint");
                    }
                } catch (upscaleError) {
                    console.warn("⚠️ UPSCALER FAILED (non-blocking):", upscaleError);
                    // Continue anyway - don't block user flow
                }
            }

            // 4. REDIRECT (Login page handles both login and signup)
            newConfirmBtn.innerText = "LAUNCHING...";
            const redirectUrl = `https://remrin-chat.vercel.app/login?email=${encodeURIComponent(soulBlueprint.email)}`;
            console.log("🚀 REDIRECTING:", redirectUrl);
            window.location.href = redirectUrl;

        } catch (e) {
            console.error("❌ ACCEPT ERROR:", e);
            alert("Connection Failed: " + e.message);
            newConfirmBtn.innerText = oldText;
            newConfirmBtn.disabled = false;
        }
    };
}

// =========================================
// HELPER LOGIC (Bio V2)
// =========================================
function generateBio(data) {
    // Logic: If the user wrote a long sentence for 'vision', just use that. 
    // Don't force it into a template if it breaks grammar.

    if (data.vision && data.vision.length > 20) {
        // Just take their vision description, it's usually the best bio.
        let bio = data.vision;
        if (bio.length > 140) bio = bio.substring(0, 140) + "...";
        return bio;
    }

    // Fallback Template
    return `A ${data.temperament || "mysterious"} spirit forged to ${data.purpose || "guide"}. Serves as a loyal ${data.relation || "companion"}.`;
}

function extractTraits(data) {
    let traits = [];
    const text = (data.temperament + " " + data.vision).toLowerCase();

    // Logic: Map keywords to cooler traits
    const map = {
        "fast": "SPEEDSTER", "speed": "VELOCITY",
        "smart": "ORACLE", "wise": "SAGE",
        "strong": "TITAN", "fight": "WARRIOR",
        "kind": "HEALER", "gentle": "GUARDIAN",
        "dark": "SHADOW", "void": "ABYSS",
        "light": "RADIANT", "funny": "JESTER",
        "cat": "FELINE", "dog": "CANINE",
        "crazy": "CHAOS", "hyper": "VOLTAGE"
    };

    Object.keys(map).forEach(key => {
        if (text.includes(key)) traits.push(map[key]);
    });

    if (traits.length === 0) traits.push("GENESIS", "SOUL");
    return traits.slice(0, 3); // Max 3 traits
}

// =========================================
// 4. STARTUP (ROBUST MUTE FIX)
// =========================================
window.addEventListener('load', async () => {
    chatLog = document.getElementById('chat-history');
    userInput = document.getElementById('user-input');
    sendBtn = document.getElementById('send-btn');
    visionOverlay = document.getElementById('vision-overlay');
    visionImage = document.getElementById('vision-image');
    visionLoader = document.getElementById('vision-loader');
    closeVisionBtn = document.getElementById('close-vision');

    // --- MUTE BUTTON FIX START ---
    statusDot = document.getElementById('voice-toggle');
    const statusText = document.getElementById('voice-status-text');

    if (statusDot) {
        console.log("🔊 Mute Button Detected.");

        // Remove old listeners by cloning
        const newDot = statusDot.cloneNode(true);
        statusDot.parentNode.replaceChild(newDot, statusDot);
        statusDot = newDot;

        // Force Styles
        statusDot.style.cursor = "pointer";
        statusDot.style.pointerEvents = "auto"; // Ensure it's clickable
        statusDot.style.zIndex = "10000";       // Bring to front

        // Attach Click Listener
        statusDot.onclick = () => {
            isMuted = !isMuted;
            console.log("Toggle Mute:", isMuted);

            // Visual Updates
            statusDot.style.background = isMuted ? "#ff4444" : "#00ff88";
            statusDot.style.boxShadow = isMuted ? "0 0 10px #ff4444" : "0 0 10px #00ff88";

            if (statusText) {
                statusText.innerText = isMuted ? "VOICE: HUSH" : "VOICE: ONLINE";
                statusText.style.color = isMuted ? "#ff4444" : "#00ff88";
            }

            // Kill Audio if Muted
            if (isMuted && currentAudio) currentAudio.pause();
        };

        // Make the text clickable too
        if (statusText) {
            statusText.style.cursor = "pointer";
            statusText.onclick = () => statusDot.click();
        }
    } else {
        console.warn("⚠️ Mute Button ID 'voice-toggle' not found in HTML.");
    }
    // --- MUTE BUTTON FIX END ---

    // --- VOICE INPUT LOGIC START ---
    micBtn = document.getElementById('mic-btn');
    if (micBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            let isListening = false;

            micBtn.onclick = () => {
                if (isListening) return; // Prevent double trigger
                try {
                    recognition.start();
                    isListening = true;
                    micBtn.style.color = '#ff0000';
                    micBtn.style.borderColor = '#ff0000';
                    userInput.placeholder = "Listening...";
                } catch (e) {
                    console.error("Mic Error:", e);
                    isListening = false;
                }
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                userInput.value = transcript;
                userInput.placeholder = "Initializing...";
            };

            recognition.onend = () => {
                isListening = false;
                micBtn.style.color = 'white';
                micBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                userInput.focus();
            };

            recognition.onerror = (event) => {
                isListening = false;
                console.error("Speech Error:", event.error);
                micBtn.style.color = 'white';

                if (event.error === 'network') {
                    userInput.placeholder = "Browser not supported (Network Error)";
                    alert("Voice Input Error: Your browser (likely Chromium Flatpak) is missing Google API keys required for speech recognition. Please use official Chrome or Edge.");
                } else if (event.error === 'not-allowed') {
                    userInput.placeholder = "Mic blocked. Check settings.";
                } else {
                    userInput.placeholder = "Error. Try again.";
                }
            }

        } else {
            micBtn.style.display = 'none'; // Hide if not supported
            console.warn("Speech Recognition API not supported in this browser.");
        }
    }
    // --- VOICE INPUT LOGIC END ---

    if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
    if (userInput) userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserAction(); });
    if (closeVisionBtn) closeVisionBtn.addEventListener('click', () => { visionOverlay.classList.remove('active'); setTimeout(() => visionOverlay.classList.add('hidden'), 800); });

    // Auto-Start Check
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'chat') {
        chatLog.innerHTML += '<div style="text-align:center; color:#666; font-size:12px; margin-top:20px; font-family:monospace;">[ SECURE CONNECTION ]</div>';
    } else {
        // =============================================
        // NEW APPROACH: Click-to-Start Button (Cleaner UI)
        // Shows welcome message first, then overlay on input bar
        // Satisfies browser audio autoplay requirements
        // =============================================

        // 1. Display the welcome message immediately
        const startStep = RITUAL_CONFIG[0];
        addMessage(startStep.text, 'rem'); // No audio until user clicks

        // 2. Create overlay button on input bar
        const inputWrapper = document.querySelector('.input-bar') || document.querySelector('.input-zone');
        if (inputWrapper) {
            const overlay = document.createElement('div');
            overlay.id = 'start-overlay';
            overlay.style.cssText = `
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border-radius: inherit;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100;
                transition: all 0.4s ease;
            `;
            overlay.innerHTML = `
                <span style="
                    color: white;
                    font-family: 'Crimson Pro', serif;
                    font-size: 1.1rem;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                ">Click to Speak to the Mother of Souls</span>
            `;

            // Make input wrapper relative for absolute positioning
            inputWrapper.style.position = 'relative';
            inputWrapper.appendChild(overlay);

            // 3. Handle click - enable audio and start interaction
            overlay.addEventListener('click', () => {
                // Fade out and remove overlay
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                setTimeout(() => overlay.remove(), 400);

                // Play the welcome audio now (browser allows it after user gesture)
                if (startStep.audio) {
                    speakText(startStep.audio);
                }

                // Enable input
                if (userInput) {
                    userInput.placeholder = "Speak, Traveler...";
                    userInput.focus();
                }

                currentStage = 0;
                console.log("🎭 Ritual started via click-to-speak button");
            });
        }
    }
});

// --- DEBUGGING EXPORTS ---
// Allow console access for manual testing
window.soulBlueprint = soulBlueprint;
window.showCardReveal = showCardReveal;
window.renderSafetyWidget = renderSafetyWidget;

// DEBUG: Quick test function - call this in console to jump to safety widget
window.testSafetyWidget = function () {
    // Pre-fill the blueprint with test data
    soulBlueprint.name = "TestSoul";
    soulBlueprint.vision = "A wise dragon who guides lost travelers";
    soulBlueprint.temperament = "Gentle, wise, protective";
    soulBlueprint.purpose = "To guide and protect";
    soulBlueprint.user_psychology = "Curious and adventurous";
    soulBlueprint.appearance = "Blue scales, golden eyes, ethereal glow";
    soulBlueprint.voice_id = "F_Mystic";
    soulBlueprint.email = "test@example.com";
    soulBlueprint.temp_image_url = "https://placehold.co/400x600/1a1a2e/00ff88?text=TEST";

    console.log("🧪 TEST MODE: Blueprint pre-filled:", soulBlueprint);
    console.log("🧪 Showing Safety Widget...");

    addMessage("One final calibration. Who is this companion designed for?", "rem");
    setTimeout(() => { renderSafetyWidget(); }, 500);
};

// DEBUG: Skip straight to card reveal with test data
window.testCardReveal = function () {
    soulBlueprint.name = "TestSoul";
    soulBlueprint.vision = "A wise dragon who guides lost travelers";
    soulBlueprint.temperament = "Gentle, wise, protective";
    soulBlueprint.purpose = "To guide and protect";
    soulBlueprint.user_psychology = "Curious and adventurous";
    soulBlueprint.appearance = "Blue scales, golden eyes, ethereal glow";
    soulBlueprint.voice_id = "F_Mystic";
    soulBlueprint.email = "test@example.com";
    soulBlueprint.safety_level = "TEEN";
    soulBlueprint.temp_image_url = "https://placehold.co/400x600/1a1a2e/00ff88?text=TEST";

    console.log("🧪 TEST MODE: Blueprint pre-filled:", soulBlueprint);
    console.log("🧪 Showing Card Reveal...");
    showCardReveal();
};