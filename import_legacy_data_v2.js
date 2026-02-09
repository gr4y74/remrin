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

/**
 * Robust CSV parser that handles newlines in quotes
 */
function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const rows = []
    let currentRow = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < content.length; i++) {
        const char = content[i]
        const nextChar = content[i + 1]

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField)
            currentField = ''
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++ // Skip \n after \r
            if (currentRow.length > 0 || currentField !== '') {
                currentRow.push(currentField)
                rows.push(currentRow)
                currentRow = []
                currentField = ''
            }
        } else {
            currentField += char
        }
    }

    if (currentRow.length > 0 || currentField !== '') {
        currentRow.push(currentField)
        rows.push(currentRow)
    }

    const headers = rows[0]
    const data = []
    for (let i = 1; i < rows.length; i++) {
        const obj = {}
        headers.forEach((h, idx) => {
            obj[h.trim()] = rows[i][idx]?.trim()
        })
        data.push(obj)
    }
    return data
}

async function runImport() {
    console.log('🚀 Starting improved import...')

    // 1. Import Memories
    console.log('📖 Parsing memories.csv...')
    const memoryData = parseCsv('/mnt/Data68/remrin/chat/public/sosu_rem/old_memories/memories.csv')
    console.log(`🧠 Found ${memoryData.length} records in CSV.`)

    const memoryInserts = memoryData.map((m, index) => {
        let metadata = {}
        try { metadata = JSON.parse(m.metadata || '{}') } catch (e) { }

        // Validation: If no content or no role, might be malformed
        if (!m.content || !m.role) {
            // console.warn(`⚠️ skipping potentially malformed row ${index + 2}`)
            return null
        }

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
    }).filter(Boolean)

    console.log(`🧠 Preparing to upload ${memoryInserts.length} valid memories...`)

    // Clear existing to avoid duplicates if re-running? 
    // Actually user might want to keep current ones. I'll just append.

    // Insert in batches of 200
    for (let i = 0; i < memoryInserts.length; i += 200) {
        const batch = memoryInserts.slice(i, i + 200)
        const { error: mErr } = await supabase.from('memories').insert(batch)
        if (mErr) {
            console.error(`❌ Memory Error (batch ${i}):`, mErr.message)
            // Log a sample row from the failing batch to debug
            console.log('Sample for debug:', JSON.stringify(batch[0], null, 2))
            break
        }
        if (i % 2000 === 0) console.log(`⏳ Progress: ${i}/${memoryInserts.length} uploaded...`)
    }
    console.log('✅ Import process completed.')
}

runImport()
