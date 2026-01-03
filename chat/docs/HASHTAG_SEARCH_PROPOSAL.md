# HASHTAG & ENHANCED SEARCH SYSTEM - PROPOSAL

## 📋 EXECUTIVE SUMMARY

This proposal outlines a comprehensive hashtag and search system for Remrin.ai that will enable:
1. **Hashtag-based discovery** - Users can search by #hashtags like #funny, #helper, #anime
2. **Enhanced full-text search** - Search by name, description, personality traits
3. **Multi-dimensional filtering** - Combine hashtags, categories, rarity, and more
4. **Auto-tagging system** - AI-powered hashtag suggestions for creators

---

## 🎯 CURRENT STATE ANALYSIS

### Existing Database Structure
```sql
-- personas table (aliased from assistants)
- id, name, description, image_url
- system_prompt, visibility, status
- category (system, kids, gaming, etc.)
- owner_id, is_official, is_premium
- safety_level (CHILD, TEEN, ADULT)
- config (JSONB) -- ✅ Can store hashtags here!

-- persona_stats table
- persona_id, total_chats, total_messages
- followers_count, trending_score
- last_chat_at, updated_at
```

### Current Search Implementation
```typescript
// components/ui/SearchSouls.tsx
.from("personas")
.select("id, name, image_url, description")
.eq("visibility", "PUBLIC")
.or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%`)
.limit(8)
```

**Limitations:**
- ❌ No hashtag support
- ❌ No full-text search (uses ILIKE which is slow)
- ❌ No multi-field weighting
- ❌ No typo tolerance
- ❌ No relevance ranking

---

## 💡 PROPOSED SOLUTION

### Option 1: JSONB Hashtags (Recommended - Fast Implementation)

**Pros:**
- ✅ No schema changes needed
- ✅ Uses existing `config` JSONB column
- ✅ Fast to implement (1-2 hours)
- ✅ Flexible - can add more metadata later
- ✅ PostgreSQL has excellent JSONB indexing

**Cons:**
- ⚠️ Slightly slower than dedicated columns for very large datasets
- ⚠️ Requires GIN index for optimal performance

**Implementation:**

```sql
-- 1. Add GIN index for fast JSONB queries
CREATE INDEX idx_personas_config_gin ON personas USING GIN (config);

-- 2. Store hashtags in config JSONB
UPDATE personas SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{hashtags}',
  '["funny", "helper", "anime", "tsundere"]'::jsonb
) WHERE id = 'some-persona-id';

-- 3. Query by hashtag
SELECT * FROM personas 
WHERE config->'hashtags' ? 'funny'  -- Contains 'funny'
AND visibility = 'PUBLIC';

-- 4. Query multiple hashtags (OR)
SELECT * FROM personas 
WHERE config->'hashtags' ?| array['funny', 'anime']  -- Contains ANY
AND visibility = 'PUBLIC';

-- 5. Query multiple hashtags (AND)
SELECT * FROM personas 
WHERE config->'hashtags' ?& array['funny', 'anime']  -- Contains ALL
AND visibility = 'PUBLIC';
```

**TypeScript Interface:**
```typescript
interface PersonaConfig {
  hashtags?: string[]
  auto_tags?: string[]  // AI-generated tags
  creator_tags?: string[]  // User-defined tags
  search_keywords?: string[]  // Additional search terms
  // ... other config
}
```

---

### Option 2: Full-Text Search with PostgreSQL (Advanced)

**Pros:**
- ✅ Native PostgreSQL feature
- ✅ Typo tolerance
- ✅ Relevance ranking
- ✅ Multi-language support
- ✅ Weighted search (name > description > tags)

**Cons:**
- ⚠️ Requires migration
- ⚠️ More complex setup
- ⚠️ Needs maintenance (reindexing)

**Implementation:**

```sql
-- 1. Add tsvector column for full-text search
ALTER TABLE personas 
ADD COLUMN search_vector tsvector;

-- 2. Create index
CREATE INDEX idx_personas_search_vector 
ON personas USING GIN (search_vector);

-- 3. Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION personas_search_vector_update() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.config->>'hashtags', '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_personas_search_vector
BEFORE INSERT OR UPDATE ON personas
FOR EACH ROW EXECUTE FUNCTION personas_search_vector_update();

-- 4. Query with ranking
SELECT 
  id, name, description,
  ts_rank(search_vector, query) AS rank
FROM personas, 
  to_tsquery('english', 'funny & anime') AS query
WHERE search_vector @@ query
AND visibility = 'PUBLIC'
ORDER BY rank DESC
LIMIT 10;
```

---

### Option 3: Hybrid Approach (Best of Both Worlds)

Combine JSONB hashtags with enhanced text search:

```typescript
// Enhanced search query
const { data } = await supabase
  .from('personas')
  .select('id, name, description, image_url, config')
  .eq('visibility', 'PUBLIC')
  .or(`
    name.ilike.%${term}%,
    description.ilike.%${term}%,
    config->>hashtags.cs.{${term}}
  `)
  .order('trending_score', { ascending: false })
  .limit(20)
```

---

## 🏷️ HASHTAG SYSTEM DESIGN

### Hashtag Categories

**1. Personality Traits**
- `#funny`, `#serious`, `#playful`, `#wise`
- `#tsundere`, `#yandere`, `#kuudere`, `#dandere`
- `#sarcastic`, `#wholesome`, `#mysterious`

**2. Roles & Functions**
- `#helper`, `#teacher`, `#mentor`, `#companion`
- `#therapist`, `#coach`, `#advisor`, `#friend`

**3. Genres & Themes**
- `#anime`, `#fantasy`, `#scifi`, `#historical`
- `#romance`, `#adventure`, `#horror`, `#comedy`

**4. Content Types**
- `#roleplay`, `#storytelling`, `#educational`
- `#creative`, `#productivity`, `#wellness`

**5. Demographics**
- `#kids`, `#teen`, `#adult`
- `#family-friendly`, `#mature`

**6. Special Features**
- `#voice-enabled`, `#multilingual`, `#premium`
- `#legendary`, `#epic`, `#rare`

### Hashtag Rules

1. **Lowercase only**: `#funny` not `#Funny`
2. **No spaces**: `#familyfriendly` or `#family-friendly`
3. **Max 20 hashtags** per persona
4. **Min 3 hashtags** recommended
5. **No NSFW hashtags** (auto-filtered)

---

## 🤖 AI AUTO-TAGGING SYSTEM

### Concept
Automatically suggest hashtags based on persona's:
- Name
- Description
- System prompt
- Category
- Existing messages (if any)

### Implementation

```typescript
// lib/ai/auto-tagger.ts
import { openai } from '@/lib/ai/openai'

export async function generateHashtags(persona: {
  name: string
  description: string
  system_prompt: string
  category: string
}): Promise<string[]> {
  const prompt = `
Analyze this AI persona and suggest 5-10 relevant hashtags for discovery.

Name: ${persona.name}
Description: ${persona.description}
Category: ${persona.category}
Personality: ${persona.system_prompt.slice(0, 500)}

Return ONLY a JSON array of lowercase hashtags without the # symbol.
Example: ["funny", "helper", "anime", "tsundere"]

Focus on:
- Personality traits
- Role/function
- Genre/theme
- Special characteristics

Hashtags:`.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 100
  })

  try {
    const tags = JSON.parse(response.choices[0].message.content || '[]')
    return tags.filter((tag: string) => 
      tag.length > 2 && 
      tag.length < 30 &&
      /^[a-z0-9-]+$/.test(tag)
    ).slice(0, 10)
  } catch {
    return []
  }
}
```

### Usage in Studio

```tsx
// components/studio/HashtagEditor.tsx
export function HashtagEditor({ personaId }: { personaId: string }) {
  const [hashtags, setHashtags] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const generateSuggestions = async () => {
    const suggested = await generateHashtags(persona)
    setSuggestions(suggested)
  }
  
  return (
    <div>
      <h3>Hashtags</h3>
      
      {/* Current hashtags */}
      <div className="flex flex-wrap gap-2">
        {hashtags.map(tag => (
          <Badge key={tag} onRemove={() => removeTag(tag)}>
            #{tag}
          </Badge>
        ))}
      </div>
      
      {/* Add new hashtag */}
      <Input 
        placeholder="Add hashtag (e.g., funny)"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            addTag(e.currentTarget.value)
          }
        }}
      />
      
      {/* AI suggestions */}
      <button onClick={generateSuggestions}>
        ✨ Generate Suggestions
      </button>
      
      {suggestions.length > 0 && (
        <div>
          <p>Suggested hashtags:</p>
          {suggestions.map(tag => (
            <button 
              key={tag}
              onClick={() => addTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🔍 ENHANCED SEARCH COMPONENT

### Updated SearchSouls Component

```typescript
// components/ui/SearchSouls.tsx (Enhanced)
interface SearchResult {
  id: string
  name: string
  image_url: string | null
  description: string | null
  config: {
    hashtags?: string[]
  }
  match_type: 'name' | 'description' | 'hashtag'
  relevance_score: number
}

export function SearchSouls({ onResultClick }: SearchSoulsProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      const supabase = createClient()
      
      // Check if query starts with #
      const isHashtagSearch = query.startsWith('#')
      const searchTerm = isHashtagSearch ? query.slice(1) : query
      
      let queryBuilder = supabase
        .from('personas')
        .select('id, name, image_url, description, config')
        .eq('visibility', 'PUBLIC')
      
      if (isHashtagSearch) {
        // Hashtag search
        queryBuilder = queryBuilder.contains('config', {
          hashtags: [searchTerm.toLowerCase()]
        })
      } else {
        // Text search (name, description, or hashtags)
        queryBuilder = queryBuilder.or(`
          name.ilike.%${searchTerm}%,
          description.ilike.%${searchTerm}%
        `)
      }
      
      const { data } = await queryBuilder
        .limit(12)
        .order('trending_score', { ascending: false })
      
      if (data) {
        // Add match type and relevance score
        const scored = data.map(persona => {
          let match_type: 'name' | 'description' | 'hashtag' = 'description'
          let relevance_score = 1
          
          if (persona.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            match_type = 'name'
            relevance_score = 3
          } else if (persona.config?.hashtags?.includes(searchTerm.toLowerCase())) {
            match_type = 'hashtag'
            relevance_score = 2
          }
          
          return { ...persona, match_type, relevance_score }
        })
        
        // Sort by relevance
        scored.sort((a, b) => b.relevance_score - a.relevance_score)
        setResults(scored)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])
  
  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or #hashtag..."
      />
      
      {/* Show hashtag suggestions as user types */}
      {query.startsWith('#') && (
        <HashtagSuggestions 
          partial={query.slice(1)}
          onSelect={(tag) => setQuery(`#${tag}`)}
        />
      )}
      
      {/* Results */}
      {results.map(result => (
        <SearchResult 
          key={result.id}
          persona={result}
          onClick={() => onResultClick(result.id)}
          matchType={result.match_type}
        />
      ))}
    </div>
  )
}
```

---

## 🎨 UI/UX ENHANCEMENTS

### 1. Hashtag Autocomplete

```tsx
// components/ui/HashtagSuggestions.tsx
export function HashtagSuggestions({ 
  partial, 
  onSelect 
}: { 
  partial: string
  onSelect: (tag: string) => void 
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  useEffect(() => {
    // Fetch popular hashtags that match partial
    const fetchSuggestions = async () => {
      const supabase = createClient()
      
      // This would require a hashtag frequency table
      // For now, use hardcoded popular tags
      const popularTags = [
        'funny', 'helper', 'anime', 'tsundere',
        'teacher', 'friend', 'mentor', 'companion',
        'fantasy', 'scifi', 'roleplay', 'creative'
      ]
      
      const matches = popularTags.filter(tag => 
        tag.startsWith(partial.toLowerCase())
      )
      
      setSuggestions(matches)
    }
    
    if (partial.length > 0) {
      fetchSuggestions()
    }
  }, [partial])
  
  return (
    <div className="hashtag-suggestions">
      {suggestions.map(tag => (
        <button 
          key={tag}
          onClick={() => onSelect(tag)}
        >
          #{tag}
        </button>
      ))}
    </div>
  )
}
```

### 2. Hashtag Display on Cards

```tsx
// Update EtherealCard to show hashtags
<div className="hashtags">
  {persona.config?.hashtags?.slice(0, 3).map(tag => (
    <span key={tag} className="hashtag-badge">
      #{tag}
    </span>
  ))}
</div>
```

### 3. Trending Hashtags Section

```tsx
// components/discovery/TrendingHashtags.tsx
export function TrendingHashtags() {
  const trendingTags = [
    { tag: 'anime', count: 1234 },
    { tag: 'funny', count: 987 },
    { tag: 'helper', count: 756 },
    // ...
  ]
  
  return (
    <section>
      <h2>Trending Hashtags</h2>
      <div className="trending-tags">
        {trendingTags.map(({ tag, count }) => (
          <Link 
            key={tag}
            href={`/discover?tag=${tag}`}
            className="trending-tag"
          >
            #{tag}
            <span className="count">{count}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

---

## 📊 ANALYTICS & INSIGHTS

### Hashtag Analytics Table

```sql
CREATE TABLE hashtag_analytics (
  tag TEXT PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  click_through_rate FLOAT DEFAULT 0,
  trending_score FLOAT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hashtag_analytics_trending 
ON hashtag_analytics(trending_score DESC);
```

### Track Hashtag Performance

```typescript
// Track when users search by hashtag
async function trackHashtagSearch(tag: string) {
  await supabase.rpc('increment_hashtag_search', { tag_name: tag })
}

// Track when users click on hashtag results
async function trackHashtagClick(tag: string, personaId: string) {
  await supabase.rpc('increment_hashtag_click', { 
    tag_name: tag,
    persona_id: personaId 
  })
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Basic Hashtags (Week 1)
- [x] Add GIN index to `personas.config`
- [ ] Create migration to add sample hashtags
- [ ] Update SearchSouls component for hashtag search
- [ ] Add hashtag display to persona cards
- [ ] Test with existing personas

### Phase 2: Studio Integration (Week 2)
- [ ] Create HashtagEditor component
- [ ] Add hashtag field to Soul Splicer
- [ ] Implement hashtag validation
- [ ] Add bulk hashtag update tool for admins

### Phase 3: AI Auto-Tagging (Week 3)
- [ ] Implement generateHashtags function
- [ ] Add "Generate Suggestions" button in Studio
- [ ] Batch process existing personas
- [ ] Fine-tune AI prompts for better suggestions

### Phase 4: Advanced Search (Week 4)
- [ ] Implement full-text search (Option 2)
- [ ] Add search filters (category, rarity, safety level)
- [ ] Add sort options (relevance, trending, new)
- [ ] Implement hashtag autocomplete

### Phase 5: Analytics & Optimization (Week 5)
- [ ] Create hashtag_analytics table
- [ ] Implement tracking functions
- [ ] Build admin dashboard for hashtag insights
- [ ] Add "Trending Hashtags" section to front page

---

## 💾 SAMPLE MIGRATION

```sql
-- File: supabase/migrations/20260103_add_hashtag_system.sql

-- 1. Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_personas_config_gin 
ON personas USING GIN (config);

-- 2. Add sample hashtags to existing personas
UPDATE personas 
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{hashtags}',
  '["official", "guide", "mystical"]'::jsonb
)
WHERE name = 'The Mother of Souls';

-- 3. Create hashtag analytics table
CREATE TABLE IF NOT EXISTS hashtag_analytics (
  tag TEXT PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  trending_score FLOAT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hashtag_analytics_trending 
ON hashtag_analytics(trending_score DESC);

-- 4. Function to increment search count
CREATE OR REPLACE FUNCTION increment_hashtag_search(tag_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO hashtag_analytics (tag, search_count, last_updated)
  VALUES (LOWER(tag_name), 1, NOW())
  ON CONFLICT (tag) DO UPDATE SET
    search_count = hashtag_analytics.search_count + 1,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INT DEFAULT 10)
RETURNS TABLE (
  tag TEXT,
  usage_count INTEGER,
  search_count INTEGER,
  trending_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ha.tag,
    ha.usage_count,
    ha.search_count,
    ha.trending_score
  FROM hashtag_analytics ha
  ORDER BY ha.trending_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant permissions
GRANT SELECT ON hashtag_analytics TO authenticated;
GRANT SELECT ON hashtag_analytics TO anon;
```

---

## 🎯 RECOMMENDED APPROACH

**I recommend starting with Option 1 (JSONB Hashtags) because:**

1. ✅ **Fast to implement** - Can be done in 1-2 hours
2. ✅ **No breaking changes** - Uses existing `config` column
3. ✅ **Flexible** - Easy to add more metadata later
4. ✅ **Good performance** - GIN indexes are very fast
5. ✅ **Scalable** - Can upgrade to full-text search later

**Next Steps:**
1. Run the migration to add GIN index
2. Update SearchSouls component to support hashtag search
3. Add hashtag editor to Soul Splicer
4. Implement AI auto-tagging for existing personas
5. Add trending hashtags section to front page

Would you like me to proceed with implementing Option 1?
