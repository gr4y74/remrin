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
