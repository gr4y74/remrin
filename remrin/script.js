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
       { text: "Hello! I am Rem. Welcome to the Soul Layer. 💙", pause: 1000 },
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
   
   // 5. INPUT HANDLING
   async function handleUserAction() {
       const text = userInput.value.trim();
       if (!text || isTyping) return; // Don't interrupt Rem!
   
       userInput.value = "";
       addMessage(text, "user");
   
       // Placeholder logic for now
       await new Promise(r => setTimeout(r, 1000));
       // This is where we will hook up the "Am I creating a soul?" logic later
   }
   
   sendBtn.addEventListener('click', handleUserAction);
   userInput.addEventListener('keypress', (e) => {
       if (e.key === 'Enter') handleUserAction();
   });