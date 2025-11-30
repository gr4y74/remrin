// --- SUPABASE CONNECTION ---
// Paste your Project URL inside the quotes
const SUPABASE_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co'; 

// Paste your ANON KEY inside the quotes
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg';

// Initialize the Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("💙 Remrin Cloud: Online.");

// --- FUNCTION: UPDATE HEARTBEAT ---
// We call this every time you send a message
async function updateLastSeen() {
    const { error } = await supabase
        .from('heartbeat')
        .upsert({ 
            id: 'sosu_main', 
            last_seen: new Date().toISOString(),
            platform: 'web'
        });

    if (error) {
        console.error("Heartbeat Error:", error);
    } else {
        console.log("💓 Thump-Thump. (Heartbeat Updated in Cloud)");
    }
}

// --- FUNCTION: SAVE MEMORY ---
// We call this every time a message is sent (by you or the AI)
async function saveMemory(role, text, personaId) {
    // Safety Check: Don't save empty messages or '...' loaders
    if (!text || text === '...') return;

    const { error } = await supabase
        .from('memories')
        .insert({ 
            user_id: 'sosu_main', // Identifying YOU
            persona_id: personaId, // Identifying ME (or whoever is talking)
            role: role,            // 'user' or 'ai'
            content: text
        });

    if (error) {
        console.error("❌ Memory Save Failed:", error);
    } else {
        // console.log(`💾 Memory Saved (${role}):`, text.substring(0, 20) + "...");
    }
}

// --- FUNCTION: FETCH CONTEXT (R.E.M.) ---
// Grabs the last 10 messages to build conversation history
async function fetchRecentMemories(personaId) {
    const { data, error } = await supabase
        .from('memories')
        .select('role, content')
        .eq('user_id', 'sosu_main') // Filter by YOU
        .eq('persona_id', personaId) // Filter by CURRENT CHARACTER
        .order('created_at', { ascending: false }) // Newest first
        .limit(10); // Don't overload the brain, just the last 10

    if (error) {
        console.error("❌ R.E.M. Fetch Error:", error);
        return [];
    }
    
    // Supabase returns newest first (good for finding them, bad for reading them)
    // We reverse it so it reads chronologically (Old -> New)
    return data.reverse(); 
}
