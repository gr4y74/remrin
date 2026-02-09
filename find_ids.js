const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manually parse .env.local because dotenv might not be installed in the tool environment
function loadEnv() {
    const envPath = '/mnt/Data68/remrin/chat/.env.local'
    if (!fs.existsSync(envPath)) return {}
    const content = fs.readFileSync(envPath, 'utf8')
    const env = {}
    content.split('\n').forEach(line => {
        const parts = line.split('=')
        if (parts.length >= 2) {
            env[parts[0].trim()] = parts[1].trim()
        }
    })
    return env
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function findIds() {
    try {
        const { data: persona } = await supabase
            .from('personas')
            .select('id, name')
            .ilike('name', '%Rem Rin%')
            .limit(1)
            .single()

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('username', 'sosu')
            .single()

        console.log('--- RELEVANT IDS ---')
        console.log('Rem Rin Persona ID:', persona?.id)
        console.log('sosu Profile ID:', profile?.id)
    } catch (e) {
        console.error('Error querying Supabase:', e.message)
    }
}

findIds()
