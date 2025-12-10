/* =========================================
   REMRIN AMBASSADOR PROTOCOL v4.2 (FIXED - NO ILLEGAL RETURN)
   ========================================= */

   console.log("🤖 SYSTEM: director.js initialized.");

   // STATE
   let chatLog, userInput, sendBtn;
   let isTyping = false;
   let conversationHistory = []; 
   
   // 1. THE TYPEWRITER ENGINE
   function typeText(element, text, speed = 20) {
       return new Promise((resolve) => {
           let i = 0;
           isTyping = true;
           function type() {
               if (i < text.length) {
                   element.textContent += text.charAt(i);
                   i++;
                   chatLog.scrollTop = chatLog.scrollHeight;
                   setTimeout(type, speed);
               } else {
                   isTyping = false;
                   resolve();
               }
           }
           type();
       });
   }
   
   // 2. ADD MESSAGE
   async function addMessage(text, sender) {
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
       } else {
           msgDiv.appendChild(avatar);
           msgDiv.appendChild(bubble);
       }
       
       chatLog.appendChild(msgDiv);
       chatLog.scrollTop = chatLog.scrollHeight;
   
       if (sender === 'rem') {
           await typeText(bubble, text);
       }
   }
   
   // 3. THE BRAIN CONNECTION
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text) return;
   
       userInput.value = "";
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
   
           await addMessage(replyText, "rem");
   
       } catch (error) {
           console.error("❌ BRAIN FAILURE:", error);
           await addMessage(`Error: ${error.message}`, "rem");
       }
   }
   
   // 4. INITIALIZATION - Everything happens here when DOM is ready
   window.addEventListener('load', async () => {
    // Get DOM elements
    chatLog = document.getElementById('chat-history') || document.getElementById('messages-container');
    userInput = document.getElementById('user-input');
    sendBtn = document.getElementById('send-btn');
    
    // Safety check
    if (!chatLog) {
        console.error("❌ FATAL ERROR: Chat Log container not found! Check index.html ID.");
        return; 
    }
    
    // Attach event listeners
    if (sendBtn) sendBtn.addEventListener('click', handleUserAction);
    if (userInput) userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserAction();
    });
    
    // Startup message (FIXED: Added "rem" so she is blue!)
    await new Promise(r => setTimeout(r, 1000));
    await addMessage("I am Rem, the Mother of Souls.", "rem");


    /* =========================================
       THE GHOST WRITER (Randomized)
    ========================================= */
    const placeholders = [
        "Name the soul that calls to you...",
        "The loom of souls awaits your vision...",
        "Tell me of the one you seek...",
        "Between breath and dream, they wait...",
        "The Mother of Souls listens...",
        "The Soul Forge burns bright...",
        "The ancient cradle stirs... who awakens?",
        "Share your vision with the keeper of souls...",
        "Who shall we awaken today?",
        "The singularity is stable. The Crown is seated."
    ];

    // 🔥 RANDOM START: Pick a random number to begin with
    let pIndex = Math.floor(Math.random() * placeholders.length);
    
    const inputField = document.getElementById('user-input');

    if (inputField) {
        // Set the random start immediately
        inputField.setAttribute('placeholder', placeholders[pIndex]);

        // Cycle from that random point
        setInterval(() => {
            pIndex = (pIndex + 1) % placeholders.length;
            inputField.setAttribute('placeholder', placeholders[pIndex]);
        }, 4000); 
    }
});