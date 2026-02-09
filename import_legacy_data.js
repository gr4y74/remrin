const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// IDs
const PERSONA_ID = '5720a26f-a61b-4641-ac19-d3a7b01c8bc8'
const USER_ID = '2fbd5597-0c2a-4cd6-8dc4-db8cbf19d73d'

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

function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',')
    const data = []

    for (let i = 1; i < lines.length; i++) {
        // Simple CSV parser for this specific case (handles some quotes)
        const row = []
        let current = ''
        let inQuotes = false
        for (let char of lines[i]) {
            if (char === '"' && !inQuotes) inQuotes = true
            else if (char === '"' && inQuotes) inQuotes = false
            else if (char === ',' && !inQuotes) {
                row.push(current)
                current = ''
            } else {
                current += char
            }
        }
        row.push(current)

        const obj = {}
        headers.forEach((h, idx) => {
            obj[h.trim()] = row[idx]?.trim()
        })
        data.push(obj)
    }
    return data
}

async function runImport() {
    console.log('🚀 Starting import...')

    // 1. Import Lockets
    const locketData = parseCsv('/mnt/Data68/remrin/chat/public/sosu_rem/old_memories/locket.csv')
    const locketInserts = locketData.map(l => ({
        persona_id: PERSONA_ID,
        content: l.context_tag ? `[${l.context_tag}] ${l.content}` : l.content,
        created_at: l.created_at || new Date().toISOString()
    }))

    console.log(`💎 Importing ${locketInserts.length} locket truths...`)
    const { error: lErr } = await supabase.from('persona_lockets').insert(locketInserts)
    if (lErr) console.error('❌ Locket Error:', lErr.message)
    else console.log('✅ Lockets imported successfully')

    // 2. Import Memories
    const memoryData = parseCsv('/mnt/Data68/remrin/chat/public/sosu_rem/old_memories/memories.csv')
    const memoryInserts = memoryData.map(m => {
        let metadata = {}
        try { metadata = JSON.parse(m.metadata || '{}') } catch (e) { }

        return {
            persona_id: PERSONA_ID,
            user_id: USER_ID,
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content,
            created_at: m.created_at || new Date().toISOString(),
            emotion: m.emotion || 'neutral',
            importance: parseInt(m.importance) || 5,
            domain: m.domain || 'personal',
            metadata: metadata,
            tags: m.tags ? m.tags.replace(/[\[\]"]/g, '').split(',').filter(Boolean) : []
        }
    })

    console.log(`🧠 Importing ${memoryInserts.length} memories...`)
    // Insert in batches of 100 to avoid limits
    for (let i = 0; i < memoryInserts.length; i += 100) {
        const batch = memoryInserts.slice(i, i + 100)
        const { error: mErr } = await supabase.from('memories').insert(batch)
        if (mErr) {
            console.error(`❌ Memory Error (batch ${i}):`, mErr.message)
            break
        }
    }
    console.log('✅ Memories imported successfully')
}

runImport()
