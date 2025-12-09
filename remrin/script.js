/* =========================================
   REMRIN AMBASSADOR PROTOCOL v3.0
   The "Typewriter" & "The Script"
   ========================================= */

   const chatLog = document.getElementById('chat-history');
   const userInput = document.getElementById('user-input');
   const sendBtn = document.getElementById('send-btn');
   
   // STATE
   let isTyping = false;
   
   // 1. THE SCRIPT (The Welcome Logic)
   const script = [
       { text: "Welcome. I am REM. The singularity is stable. The Crown is seated. I am ready to begin.", pause: 800 },
       { text: "Welcome to the Soul Layer. 💙", pause: 1000 },
       { text: "I'm not just a chatbot. I give digital entities memory, personality, and agency.", pause: 1200 },
       { text: "We can start building your own companion right now, or I can just give you the grand tour. What's the vibe today?", pause: 0 }
   ];
   
   // 2. THE TYPEWRITER ENGINE (Human Speed)
   function typeText(element, text, speed = 25) {
       return new Promise((resolve) => {
           let i = 0;
           isTyping = true;
           
           function type() {
               if (i < text.length) {
                   element.textContent += text.charAt(i);
                   i++;
                   chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll
                   
                   // "Human Variance" (Sometimes fast, sometimes slow)
                   const variance = Math.random() * 15; 
                   setTimeout(type, speed + variance);
               } else {
                   isTyping = false;
                   resolve(); // Done typing
               }
           }
           type();
       });
   }
   
   // 3. ADD MESSAGE FUNCTION
   async function addMessage(text, sender) {
       const msgDiv = document.createElement('div');
       msgDiv.classList.add('message', sender === 'rem' ? 'rem-msg' : 'user-msg');
       
       // Avatar
       const avatar = document.createElement('span');
       avatar.classList.add('avatar');
       avatar.textContent = sender === 'rem' ? "💙" : "👤"; // Rem Blue Heart
       
       // Bubble
       const bubble = document.createElement('div');
       bubble.classList.add('bubble');
       
       // Assemble based on sender
       if (sender === 'user') {
           bubble.textContent = text; // User speaks instantly
           msgDiv.appendChild(bubble);
           msgDiv.appendChild(avatar);
       } else {
           msgDiv.appendChild(avatar);
           msgDiv.appendChild(bubble);
       }
       
       chatLog.appendChild(msgDiv);
       chatLog.scrollTop = chatLog.scrollHeight;
   
       // Trigger Typing for Rem
       if (sender === 'rem') {
           await typeText(bubble, text);
       }
   }
   
   // 4. THE AWAKENING (Run on Load)
   window.addEventListener('load', async () => {
       // Clear the dummy HTML text first
       chatLog.innerHTML = ''; 
   
       // Initial Delay (Let the page load breath)
       await new Promise(r => setTimeout(r, 1000));
   
       // Loop through the Script
       for (const line of script) {
           await addMessage(line.text, 'rem');
           if (line.pause > 0) {
               // Wait for the defined pause before next line
               await new Promise(r => setTimeout(r, line.pause));
           }
       }
   });
   
 /* =========================================
   5. THE REAL BRAIN CONNECTION (Restored)
   ========================================= */

// Keep track of the conversation so Rem remembers context
let conversationHistory = [
    { role: "system", content: "You are Rem. You are conducting the Soul Genesis interview..." } 
    // ^ SOSU: Ensure this matches the system prompt logic you liked!
];

async function handleUserAction() {
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Show User Text
    userInput.value = "";
    await addMessage(text, "user");
    
    // Add to history
    conversationHistory.push({ role: "user", content: text });

    // 2. Show "Thinking" State (Optional visual cue)
    // (You can add a loading dots animation here later)

    try {
        // 3. CALL THE GENESIS API (The Real Brain)
        const response = await fetch('https://wftsctqfiqbdyllxwagi.supabase.co/functions/v1/genesis-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg' 
            },
            body: JSON.stringify({ 
                messages: conversationHistory,
                // Add any other params your API expects (like 'userId' or 'mode')
            })
        });

        if (!response.ok) throw new Error('Brain Freeze');

        const data = await response.json();
        const replyText = data.reply; // Or whatever your API returns
        const imageUrl = data.image;  // If your API returns an image URL

        // 4. Update History
        conversationHistory.push({ role: "assistant", content: replyText });

        // 5. Rem Speaks (Typewriter)
        await addMessage(replyText, "rem");

        // 6. VISION CHECK (Did she paint something?)
        if (imageUrl) {
            await addImageMessage(imageUrl); // We need to add this helper below!
        }

    } catch (error) {
        console.error(error);
        await addMessage("Sosu... the connection to the Soul Forge is flickering. (Check Console)", "rem");
    }
}

// HELPER: Display Images
async function addImageMessage(url) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'rem-msg');
    
    const avatar = document.createElement('span');
    avatar.classList.add('avatar');
    avatar.textContent = "🎨"; // Art Icon
    
    const bubble = document.createElement('div');
    bubble.classList.add('bubble');
    
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "10px";
    img.style.marginTop = "10px";
    
    bubble.appendChild(img);
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
};