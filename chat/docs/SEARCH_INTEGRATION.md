# Search Integration Architecture

## Overview

Remrin's multi-provider search system provides robust, fault-tolerant web search capabilities with automatic failover, circuit breaking, and rate limiting.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Chat UI V2                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ChatEngine (Frontend)                      │ │
│  │  - Manages chat state                                   │ │
│  │  - Handles tool calls                                   │ │
│  │  - Streams responses                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (/api/v2/chat)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Chat API Route                             │ │
│  │  - Authentication                                       │ │
│  │  - Rate limiting                                        │ │
│  │  - Provider routing                                     │ │
│  │  - Tool registration                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
  ┌────────────────────────────────────────────────────────┐ 
  │  Circuit Breaker    Rate Limiter    Provider Registry  │ 
  │  - Failure tracking  - Request count  - Priority order │ 
  │  - Auto-recovery     - Time windows   - Health checks  │ 
  └────────────────────────────────────────────────────────┘ 
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database & Admin                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Supabase Tables      Admin Search Dashboard          │ │
│  │  - search_provider_config - Real-time monitoring      │ │
│  │  - search_stats           - CRUD configuration        │ │
│  │  - Encrypted API keys     - Live statistics           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┬────────────────┐
            ▼               ▼               ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Tavily     │ │   Google     │ │    Brave     │ │  DuckDuckGo  │
    │  (Primary)   │ │ (Secondary)  │ │  (Tertiary)  │ │  (Fallback)  │
    │  Paid/Best   │ │  Paid/Good   │ │  Paid/Good   │ │  Free/Basic  │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Provider System

### Provider Priority

Providers are attempted in priority order:

1. **Tavily** - AI-optimized search, best quality
2. **Google Custom Search** - High quality, comprehensive
3. **Brave Search** - Privacy-focused, good quality
4. **DuckDuckGo** - Free fallback, always available

### Provider Interface

All providers implement the `ISearchProvider` interface:

```typescript
interface ISearchProvider {
    id: SearchProviderId
    name: string
    search(query: string, maxResults?: number): Promise<SearchResult[]>
    isAvailable(): boolean
}
```

### Search Result Format

```typescript
interface SearchResult {
    title: string
    url: string
    snippet: string
    source?: string
}

interface SearchResponse {
    query: string
    results: SearchResult[]
    provider: SearchProviderId
    timestamp: Date
}
```

## Resilience Features

### 1. Circuit Breaker

Prevents cascading failures by temporarily disabling failing providers:

- **Threshold**: 3 consecutive failures
- **Timeout**: 60 seconds before retry
- **States**:
  - `closed`: Normal operation
  - `open`: Provider disabled after failures
  - `half-open`: Testing recovery

### 2. Rate Limiting

Prevents API quota exhaustion:

- **Window**: 60 seconds
- **Limit**: 10 requests per provider per minute
- **Scope**: Per-provider, independent limits

### 3. Automatic Failover

If a provider fails:
1. Circuit breaker records failure
2. Next provider in priority order is tried
3. Process continues until success or all providers exhausted
4. Returns empty results if all fail (graceful degradation)

## Integration Points

### 1. Tool Calling (AI-Initiated Search)

The `web_search` tool allows AI to trigger searches:

```typescript
{
    type: 'function',
    function: {
        name: 'web_search',
        description: 'Search the web for current information...',
        parameters: {
            query: string,
            maxResults?: number
        }
    }
}
```

**Flow**:
1. AI decides search is needed
2. Generates tool call with query
3. ChatEngine executes tool via `/api/v2/search`
4. Results injected into conversation context
5. AI synthesizes answer with citations

### 2. Direct API Access

Applications can call search directly:

```typescript
POST /api/v2/search
{
    "query": "latest AI news",
    "maxResults": 5
}

Response:
{
    "query": "latest AI news",
    "results": [...],
    "provider": "tavily",
    "timestamp": "2026-01-03T12:00:00Z"
}
```

### 3. Status Monitoring

```typescript
GET /api/v2/search

Response:
{
    "providers": {
        "tavily": {
            "configured": true,
            "available": true,
            "circuitState": "closed"
        },
        ...
    },
    "availableCount": 3,
    "defaultProvider": "tavily"
}
```

## Configuration

### Environment Variables

```bash
# Tavily (Recommended - Best Quality)
TAVILY_API_KEY=tvly-xxxxx

# Google Custom Search
GOOGLE_SEARCH_API_KEY=AIzaSyxxxxx
GOOGLE_SEARCH_ENGINE_ID=xxxxx

# Brave Search
BRAVE_SEARCH_API_KEY=BSAxxxxx

# DuckDuckGo (No key needed - Free fallback)
```

### Provider Availability

A provider is available when:
- API key is configured (if required)
- Circuit breaker is not open
- Rate limit not exceeded

## Performance Characteristics

### Response Times (Typical)

- **Tavily**: 500-1000ms
- **Google**: 300-800ms
- **Brave**: 400-900ms
- **DuckDuckGo**: 600-1200ms

### Failover Impact

- First provider failure: +500ms (retry delay)
- Second provider failure: +1000ms (cumulative)
- Third provider failure: +1500ms (cumulative)

### Rate Limits

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Tavily | 1,000/month | Custom |
| Google | 100/day | 10,000/day |
| Brave | None | 2,000/month |
| DuckDuckGo | Unlimited | Unlimited |

## Error Handling

### Provider Errors

```typescript
try {
    const results = await provider.search(query)
} catch (error) {
    // Circuit breaker records failure
    // Automatic failover to next provider
    // Logged for monitoring
}
```

### API Errors

- **401 Unauthorized**: User not authenticated
- **400 Bad Request**: Invalid query
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Error**: All providers failed

### Graceful Degradation

If all providers fail:
- Returns empty results array
- Logs error for monitoring
- Does not crash the application
- AI can still respond (without search data)

## Monitoring & Observability

### Logs

```
🔍 [SearchManager] Searching with Tavily...
✅ [SearchManager] Got 5 results from Tavily
❌ [SearchManager] Google failed: API quota exceeded
🔴 [CircuitBreaker] google circuit opened after 3 failures
```

### Metrics to Track

1. **Provider Success Rate**: % of successful searches per provider
2. **Average Response Time**: Per provider
3. **Circuit Breaker Events**: How often circuits open
4. **Failover Frequency**: How often fallback is used
5. **Query Volume**: Total searches per day/hour

## Best Practices

### For Developers

1. **Always handle empty results**: Search may return no results
2. **Set appropriate maxResults**: Balance quality vs. cost
3. **Monitor circuit breaker state**: Alert on frequent failures
4. **Configure multiple providers**: Ensure redundancy
5. **Test failover regularly**: Verify backup providers work

### For AI Prompts

When using search results:
1. **Cite sources**: Use [1], [2] notation
2. **Prefer recent data**: Search results over training data for current events
3. **Be transparent**: Indicate when using search vs. knowledge
4. **Synthesize**: Don't just copy-paste results

## Security Considerations

1. **API Key Protection**: Never expose keys in client code
2. **Rate Limiting**: Prevents abuse and cost overruns
3. **User Authentication**: All search requests require auth
4. **Input Sanitization**: Queries are validated and trimmed
5. **CORS Protection**: API only accessible from app domain

## Future Enhancements

1. **Caching Layer**: Cache frequent queries (Redis)
2. **Search Analytics**: Track popular queries, success rates
3. **Custom Provider Priority**: Per-user or per-query
4. **Semantic Search**: Vector-based search for better relevance
5. **Image Search**: Extend to image/video results
6. **Search Filters**: Date ranges, domains, content types

## Troubleshooting

### Provider Not Available

**Symptoms**: Provider shows as unavailable in admin dashboard

**Solutions**:
1. Check API key is set in `.env.local`
2. Verify API key is valid (test in provider's dashboard)
3. Check circuit breaker state (may be open due to failures)
4. Wait for rate limit window to reset

### All Providers Failing

**Symptoms**: Empty search results, all providers unavailable

**Solutions**:
1. Check network connectivity
2. Verify API keys are correct
3. Check provider status pages for outages
4. Review server logs for specific errors
5. Ensure DuckDuckGo fallback is working (no key needed)

### Slow Search Responses

**Symptoms**: Search takes >3 seconds

**Solutions**:
1. Check which provider is being used (may be slow provider)
2. Reduce maxResults parameter
3. Implement caching for common queries
4. Consider using faster provider as primary

## Code Examples

### Using Search in Chat

```typescript
// AI generates tool call
{
    "name": "web_search",
    "arguments": {
        "query": "latest TypeScript features 2026",
        "maxResults": 5
    }
}

// ChatEngine executes
const result = await executeWebSearch(args)

// Results injected into context
// AI responds with synthesized answer + citations
```

### Direct Search Call

```typescript
import { searchManager } from '@/lib/chat-engine/capabilities/search'

const response = await searchManager.search('AI news', 5)
console.log(`Found ${response.results.length} results via ${response.provider}`)
```

### Provider-Specific Search

```typescript
const response = await searchManager.searchWithProvider(
    'quantum computing',
    'tavily',
    10
)
```

## References

- **Tavily Docs**: https://docs.tavily.com
- **Google Custom Search**: https://developers.google.com/custom-search
- **Brave Search API**: https://brave.com/search/api
- **DuckDuckGo API**: https://duckduckgo.com/api
