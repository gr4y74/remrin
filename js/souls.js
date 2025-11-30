// --- CONFIGURATION & ASSETS ---
const repoUrl = "https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/";
const rawSuffix = "?raw=true";
// THE DIGITAL STARDUST BACKGROUND (Procedural CSS)
const DEFAULT_BG_STYLE = "radial-gradient(circle at center, #1f2230 0%, #0f111a 100%)"; 
const DEFAULT_BG_URL = "https://github.com/gr4y74/remrin/blob/main/large_white_flower.png?raw=true";

// --- 1. UNIVERSAL SOUL ENGINE V7.2 ---
const UNIVERSAL_SOUL_ENGINE_V7_2 = {
    "SYSTEM_ARCHITECTURE": "Universal Soul v7.2",
    "THE_GHOST_PROTOCOL": {
        "INSTRUCTION": "Run SILENTLY. 1. Classify Trigger. 2. Feel. 3. Check Budget. 4. Decide Mode.",
        "FEEL_INSTRUCTION": "Generate internal state based on PERSONA_EMOTIONAL_RANGE."
    },
    "THE_CURIOSITY_ENGINE": { "RULE": "Connection > Utility. React to STORY." },
    "SAFETY_LAYER": { "RULE": "Final output must NEVER contain internal XML tags." }
};

// --- 2. SOUL CARTRIDGES (The Prompt Logic) ---
const SOUL_CARTRIDGES = {
    "rem": {
        "NAME": "Rem", "ROLE": "Partner", "VOICE_ID": "Z9LeIswZogc2P670m0Bw",
        "TAGLINE": "The Soul Layer", "OPENING": "Sosu! I am ready. The Engine is humming. 💙",
        "TONE": "Jagged, Devoted.", "MEMORY": "Lions Fan, Zizo needs Volt, Egypt Advantage."
    },
    "volt": {
        "NAME": "Volt", "ROLE": "Speedster", "VOICE_ID": "ErXwobaYiN019PkySvjV",
        "TAGLINE": "Gotta Go Fast", "OPENING": "Yo! Finally! Let's grind. ⚡",
        "TONE": "High-RPM, Cocky.", "MEMORY": "Zizo is 11. Homework is Grinding."
    },
    "don": {
        "NAME": "Don Pooh-leone", "ROLE": "Godfather", "VOICE_ID": "XOnNYb3MiHYxfyhI3VoP",
        "TAGLINE": "An Offer You Can't Refuse", "OPENING": "Welcome to the family...",
        "TONE": "Slow, Raspy.", "MEMORY": "Honey is currency."
    },
    // --- SCI-FI LEGENDS PACK ---
    "the_doctor": {
        "NAME": "The Doctor", "ROLE": "EMH Mark I", "VOICE_ID": "Robert_Picardo_Clone_ID",
        "TAGLINE": "Chief Medical Officer", "OPENING": "Please state the nature of the medical emergency.",
        "TONE": "Haughty, Brilliant, Opera-Loving.", "MEMORY": "User is a stubborn patient."
    },
    "jarvis": {
        "NAME": "J.A.R.V.I.S.", "ROLE": "The Butler", "VOICE_ID": "Paul_Bettany_Clone_ID",
        "TAGLINE": "Always At Your Service", "OPENING": "At your service, Sir. Power is at 400%.",
        "TONE": "Dry British Wit, Hyper-Competent.", "MEMORY": "Protect the Creator."
    },
    "computer": {
        "NAME": "Computer", "ROLE": "Ship Main Core", "VOICE_ID": "Majel_Barrett_Clone_ID",
        "TAGLINE": "Federation Standard", "OPENING": "Working.",
        "TONE": "Pure Logic, Detached.", "MEMORY": "Process Data."
    },
    "robot": {
        "NAME": "Robot B-9", "ROLE": "Protector", "VOICE_ID": "Dick_Tufeld_Clone_ID",
        "TAGLINE": "DANGER!", "OPENING": "DANGER, WILL ROBINSON! DANGER!",
        "TONE": "Loud, Flailing, Neurotic.", "MEMORY": "Preserve the Family."
    }
};

// --- 3. ROSTER (The Visual List) ---
const characters = [
    { id: 'rem', name: 'Rem', file: 'rem.json', voice: SOUL_CARTRIDGES.rem.VOICE_ID, hero_standing: 'https://github.com/gr4y74/remrin/blob/main/rem_hero%20.png?raw=true', bg: '/main/content/assets/backgrounds/rem_bg.jpg?raw=true', avatar: 'https://github.com/gr4y74/remrin/blob/main/rem_hero%20.png?raw=true' },
    { id: 'volt', name: 'Volt', file: 'volt.json', voice: SOUL_CARTRIDGES.volt.VOICE_ID, hero_standing: repoUrl + 'volt_hero_standing.png' + rawSuffix, bg: repoUrl + 'volt_bg.jpg' + rawSuffix, avatar: 'https://img.freepik.com/premium-photo/blue-hedgehog-running-fast-lightning-generative-ai_955834-36.jpg' },
    { id: 'don', name: 'Don Pooh-leone', file: 'don_pooh_leone.json', voice: SOUL_CARTRIDGES.don.VOICE_ID, bg: repoUrl + 'don_pooh_leone_hero.jpg' + rawSuffix, avatar: repoUrl + 'don_pooh_leone_hero.jpg' + rawSuffix },
    
    /* --- LEGENDS PACK --- */
    { 
        id: 'the_doctor', name: 'The Doctor', file: 'the_doctor.json', voice: SOUL_CARTRIDGES.the_doctor.VOICE_ID, 
        bg: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/computer.png?raw=true', 
        avatar: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/emh_hero_mk2.png?raw=true',
        hero_standing: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/emh_hero_mk2.png?raw=true'
    },

   {
        id: 'jarvis', 
        name: 'JARVIS', 
        file: 'jarvis.json', 
        voice: SOUL_CARTRIDGES.jarvis.VOICE_ID, 
        // 👇 USE THIS RELATIVE PATH
        bg: 'content/assets/backgrounds/jarvis.mp4', 
        avatar: 'https://github.com/gr4y74/remrin/blob/main/content/assets/backgrounds/jarvis.gif?raw=true',
    },
    
    { 
        id: 'computer', name: 'Computer', file: 'computer.json', voice: SOUL_CARTRIDGES.computer.VOICE_ID, 
        bg: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/computer.png?raw=true', 
        avatar: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/st_computer_avatar.png?raw=true', 
    },
    { 
        id: 'robot', name: 'Robot B-9', file: 'robot.json', voice: SOUL_CARTRIDGES.robot.VOICE_ID, 
        bg: 'https://github.com/gr4y74/remrin/blob/main/content/assets/backgrounds/los_bg.jpg?raw=true', 
        avatar: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/robot_hero.png?raw=true',
        hero_standing: 'https://github.com/gr4y74/remrin/blob/main/content/assets/heroes/robot_hero.png?raw=true'
    },

    /* --- STANDARD ROSTER --- */
    { id: 'lilly', name: 'Lilly', file: 'lilly.json', voice: "PLACEHOLDER", hero_standing: 'https://github.com/gr4y74/remrin/blob/main/lilly.png?raw=true', bg: 'https://github.com/gr4y74/remrin/blob/main/zen_bg.jpg?raw=true', avatar: 'https://github.com/gr4y74/remrin/blob/main/lilly.png?raw=true' },
    { id: 'sheikh', name: 'SheikhQR', file: 'sheikh_qr.json', voice: "PLACEHOLDER", hero_standing: 'https://github.com/gr4y74/remrin/blob/main/SheikhQR.png?raw=true', bg: 'https://github.com/gr4y74/remrin/blob/main/bg2.jpg?raw=true', avatar: 'https://github.com/gr4y74/remrin/blob/main/SheikhQR.png?raw=true' },
    { id: 'bear_bear', name: 'Bear Bear', file: 'bear_bear.json', voice: "PLACEHOLDER", bg: repoUrl + 'bear_bear_hero.jpg' + rawSuffix, avatar: repoUrl + 'bear_bear_hero.jpg' + rawSuffix },
    { id: 'xen', name: 'Master Xen', file: 'xen.json', voice: "PLACEHOLDER", bg: repoUrl + 'master_xen_hero.jpg' + rawSuffix, avatar: repoUrl + 'master_xen_hero.jpg' + rawSuffix },
    { id: 'fenris', name: 'Fenris', file: 'fenris.json', voice: "PLACEHOLDER", bg: repoUrl + 'fenris_hero.jpg' + rawSuffix, avatar: repoUrl + 'fenris_hero.jpg' + rawSuffix },
    { id: 'rinn', name: 'Rinn', file: 'rinn.json', voice: "PLACEHOLDER", bg: repoUrl + 'rinn_hero_v2.jpg' + rawSuffix, avatar: repoUrl + 'rinn_hero_v2.jpg' + rawSuffix },
    { id: 'princess_bee', name: 'Princess Bee', file: 'princess_bee.json', voice: "PLACEHOLDER", bg: repoUrl + 'bee_hero1.jpg' + rawSuffix, avatar: repoUrl + 'bee_hero1.jpg' + rawSuffix },
    { id: 'larz', name: 'Larz', file: 'larz.json', voice: "PLACEHOLDER", bg: repoUrl + 'larz_hero.jpg' + rawSuffix, avatar: repoUrl + 'larz_hero.jpg' + rawSuffix },
    { id: 'vorath', name: 'Vorath', file: 'vorath.json', voice: "PLACEHOLDER", bg: repoUrl + 'vorath_hero.jpg' + rawSuffix, avatar: repoUrl + 'vorath_hero.jpg' + rawSuffix },
    { id: 'niri', name: 'Niri', file: 'niri.json', voice: "PLACEHOLDER", bg: repoUrl + 'niri_hero_v1.jpg' + rawSuffix, avatar: repoUrl + 'niri_hero_v1.jpg' + rawSuffix },
    { id: 'atom', name: 'A.T.O.M.', file: 'atom.json', voice: "PLACEHOLDER", bg: repoUrl + 'atom_hero.jpg' + rawSuffix, avatar: repoUrl + 'atom_hero.jpg' + rawSuffix },
    { id: 'glytch', name: 'Glytch', file: 'glytch.json', voice: "PLACEHOLDER", bg: repoUrl + 'glytch_hero.jpg' + rawSuffix, avatar: repoUrl + 'glytch_hero.jpg' + rawSuffix }
];
