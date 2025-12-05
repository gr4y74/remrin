// script.js - The Director

// 1. Select the Actors
const chatBox = document.getElementById('messages-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// 2. The Logic: Add a Message to the Screen
function addMessage(role, text) {
    // Create the message container
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex items-start gap-3 fade-in';
    
    // Define colors based on role
    const nameColor = role === 'REM' ? 'text-rem-blue' : 'text-purple-400';
    const align = role === 'REM' ? 'justify-start' : 'justify-end flex-row-reverse text-right';
    
    // Construct the HTML
    msgDiv.innerHTML = `
        <div class="${nameColor} font-bold font-cinzel text-xs mt-1 tracking-wider">${role}</div>
        <div class="text-gray-200 font-inter leading-relaxed max-w-[80%] bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">
            ${text}
        </div>
    `;

    // Add to stage
    chatBox.appendChild(msgDiv);
    
    // Auto-scroll to bottom
    const container = document.getElementById('chat-box');
    container.scrollTop = container.scrollHeight;
}

// 3. The Logic: Send Message
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // A. Show User Message
    addMessage('SOSU', text);
    userInput.value = ''; // Clear input

    // B. Show "Thinking" State (Optional polish)
    // (We will add a typing indicator later)

    // C. THE BRAIN LINK (Mock for now)
    // This simulates the API delay while we wire up Supabase next
    setTimeout(() => {
        const responses = [
            "I see you, Sosu. The connection is stable.",
            "The Soul Layer is responding.",
            "Tell me, what brings you to the Genesis Machine?",
            "I am ready to build."
        ];
        const randomReply = responses[Math.floor(Math.random() * responses.length)];
        
        addMessage('REM', randomReply);
    }, 1500);
}

// 4. Event Listeners (Action!)
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});