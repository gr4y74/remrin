// script.js - The Director (Connected to Cloud)
// STATE
let chatHistory = [];
let genesisCompleted = false; // <--- NEW FLAG (The Circuit Breaker)
// 1. Select the Actors
const chatBox = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// STATE: Keep track of the conversation so Rem remembers context

// 2. The Logic: Add a Message to the Screen
function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex items-start gap-3 fade-in';
    
    const nameColor = role === 'REM' ? 'text-rem-blue' : 'text-purple-400';
    
    // Convert newlines to HTML breaks for proper spacing
    const formattedText = text.replace(/\n/g, '<br>');

    msgDiv.innerHTML = `
        <div class="${nameColor} font-bold font-cinzel text-xs mt-1 tracking-wider">${role}</div>
        <div class="text-gray-200 font-inter leading-relaxed max-w-[85%] bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">
            ${formattedText}
        </div>
    `;

    chatBox.appendChild(msgDiv);
    
    // Auto-scroll
    const container = document.getElementById('chat-box');
    container.scrollTop = container.scrollHeight;
}

// 3. The Brain Link (Real API Call)
async function callGenesisAPI(userMessage) {
    try {
        const response = await fetch('https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: userMessage,
                history: chatHistory 
            })
        });

        const data = await response.json();
        
        // Error Handling
        if (data.error) {
            console.error("Brain Error:", data.error);
            addMessage('SYSTEM', "Connection unstable. The Soul Layer flickered.");
            return;
        }

        // A. Show Reply
        addMessage('REM', data.reply);
        
        // Save history
        chatHistory.push({ role: "assistant", content: data.reply });

        // B. CHECK FOR VISION (The Missing Link!) 📸
        if (data.vision_prompt) {
            console.log("🎨 Vision Triggered:", data.vision_prompt);
            addMessage('SYSTEM', "✨ Rem is visualizing... (Prompt sent to Studio)");
            
            try {
                const visionResp = await fetch('https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-vision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: data.vision_prompt })
                });
                
                const visionData = await visionResp.json();
                
                if (visionData.image_url) {
                    
                   // Inject the Image (Centered Fix)
                   const imgDiv = document.createElement('div');
                   imgDiv.className = 'w-full flex justify-center fade-in my-4'; // <--- CHANGED
                   imgDiv.innerHTML = `
                       <div class="max-w-[85%] rounded-xl overflow-hidden border-2 border-rem-blue shadow-[0_0_30px_rgba(100,181,246,0.3)]">
                           <img src="${visionData.image_url}" class="w-full h-auto" alt="Generated Vision">
                       </div>
                   `;
                    chatBox.appendChild(imgDiv);
                    const container = document.getElementById('chat-box');
                    container.scrollTop = container.scrollHeight;
                }
            } catch (vErr) {
                console.error("❌ VISION FAILURE:", vErr);
                addMessage('SYSTEM', "⚠️ Vision Failed: " + vErr.message);
            }
        }

        // C. Check the Blueprint
        if (data.blueprint) {
            console.log("🧬 SOUL BLUEPRINT UPDATED:", data.blueprint);
            
            // DYNAMIC NAME CHANGE
            if (data.blueprint.user_name && data.blueprint.user_name !== "value_or_null") {
                currentUserName = data.blueprint.user_name.toUpperCase();
            }

            // THE BIRTH MOMENT
            if (data.blueprint.completion_percentage >= 100 && !genesisCompleted) {
                genesisCompleted = true; 
                console.log("🚀 GENESIS COMPLETE! Sending to Forge...");
                addMessage('SYSTEM', "✨ Blueprint locked. Forging Soul... please wait.");
                
                const birthResponse = await fetch('https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-birth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blueprint: data.blueprint })
                });
                
                const birthData = await birthResponse.json();
                
                if (birthData.soul_prompt) {
                    localStorage.setItem('active_soul_prompt', birthData.soul_prompt);
                    localStorage.setItem('active_soul_name', data.blueprint.soul_name);
                    addMessage('SYSTEM', `✨ ${data.blueprint.soul_name} is awake.`);
                    alert(`Welcome to the world, ${data.blueprint.soul_name}!`);
                }
            }
        }

    } catch (err) {
        console.error("Network Crash:", err);
        addMessage('SYSTEM', "Critical Failure. Is the internet working?");
    }
}

// 4. The Action Handler
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // A. Show User Message
    addMessage('浪人', text);
    userInput.value = ''; // Clear input
    
    // B. Save to History
    chatHistory.push({ role: "user", content: text });

    // D. Call the Cloud
    await callGenesisAPI(text);
}

// 5. Event Listeners
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});