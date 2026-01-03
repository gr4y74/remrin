# Admin Search Dashboard Guide

## Overview

The Admin Search Dashboard provides a centralized interface for managing and monitoring Remrin's multi-provider web search system.

**Access**: `/admin/search`

## Features

### 1. Real-Time Provider Status

Monitor the health and availability of all search providers:

- **Configuration Status**: Which providers have API keys configured
- **Circuit Breaker State**: Current state (closed/open/half-open)
- **Availability**: Whether the provider can currently handle requests
- **Priority Order**: Automatic failover sequence

### 2. Provider Cards

Each provider displays:

```
┌─────────────────────────────────────────┐
│ ● Tavily                    Priority 1   │
│   Premium AI-optimized search            │
│                                          │
│   API Key: TAVILY_API_KEY        ✓      │
│   Circuit State: closed                  │
│   Status: Available                      │
└─────────────────────────────────────────┘
```

**Status Indicators**:
- 🟢 Green dot: Provider available and ready
- ⚫ Gray dot: Provider unavailable or not configured

**Circuit States**:
- `closed` (Green): Normal operation
- `open` (Red): Temporarily disabled due to failures
- `half-open` (Yellow): Testing recovery

### 3. Live Search Testing

Test the search system directly from the dashboard:

1. Enter a search query
2. Click "Search"
3. View results with:
   - Number of results found
   - Which provider was used
   - Result titles, snippets, and URLs

**Use Cases**:
- Verify provider configuration
- Test failover behavior
- Debug search quality issues
- Compare provider results

### 4. Statistics Overview

Three key metrics at a glance:

**Available Providers**: `3 / 4`
- How many providers are currently operational
- Target: All 4 providers available

**Default Provider**: `tavily`
- Which provider will be tried first
- Based on priority and availability

**Configured**: `3 / 4`
- How many providers have API keys set
- DuckDuckGo doesn't need a key

## Provider Details

### Tavily (Priority 1)
- **Type**: Premium, AI-optimized
- **Cost**: Paid (1,000 free/month)
- **Quality**: Best
- **Speed**: Fast (500-1000ms)
- **API Key**: `TAVILY_API_KEY`
- **Get Key**: https://tavily.com

**Best For**:
- Production use
- High-quality results
- AI-friendly formatting

### Google Custom Search (Priority 2)
- **Type**: High-quality web search
- **Cost**: Paid (100 free/day)
- **Quality**: Excellent
- **Speed**: Very fast (300-800ms)
- **API Keys**: 
  - `GOOGLE_SEARCH_API_KEY`
  - `GOOGLE_SEARCH_ENGINE_ID`
- **Get Key**: https://developers.google.com/custom-search

**Best For**:
- Comprehensive coverage
- Reliable results
- Familiar search quality

### Brave Search (Priority 3)
- **Type**: Privacy-focused
- **Cost**: Paid (2,000/month)
- **Quality**: Good
- **Speed**: Fast (400-900ms)
- **API Key**: `BRAVE_SEARCH_API_KEY`
- **Get Key**: https://brave.com/search/api

**Best For**:
- Privacy-conscious users
- Independent index
- Good fallback option

### DuckDuckGo (Priority 4)
- **Type**: Free fallback
- **Cost**: Free, unlimited
- **Quality**: Basic
- **Speed**: Moderate (600-1200ms)
- **API Key**: None required
- **Get Key**: N/A

**Best For**:
- Always-available fallback
- Cost-free option
- Development/testing

## Configuration

### Setting Up Providers

1. **Get API Keys**
   - Sign up for each provider's API service
   - Generate API keys from their dashboards

2. **Add to Environment**
   
   Edit `/chat/.env.local`:
   ```bash
   # Tavily
   TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxx
   
   # Google Custom Search
   GOOGLE_SEARCH_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx
   GOOGLE_SEARCH_ENGINE_ID=xxxxxxxxxxxxxxxxxx
   
   # Brave Search
   BRAVE_SEARCH_API_KEY=BSAxxxxxxxxxxxxxxxxxx
   
   # DuckDuckGo (no key needed)
   ```

3. **Apply Database Migration**
   - Import the SQL from `supabase/migrations/20250103_add_search_provider_config.sql` into the Supabase SQL Editor.
   - Run the script to create the necessary tables and seed default providers.

4. **Restart Server**
   ```bash
   npm run dev
   ```

5. **Verify in Dashboard**
   - Navigate to `/admin/search`
   - Check that providers show as "Configured"
   - Run a test search

### Recommended Setup

**Minimum** (Free):
- DuckDuckGo only
- No API keys needed
- Basic functionality

**Recommended** (Best Value):
- Tavily (primary)
- DuckDuckGo (fallback)
- Cost: ~$0-10/month for typical usage

**Enterprise** (Maximum Reliability):
- All 4 providers configured
- Full redundancy
- Best quality + reliability

## Monitoring

### What to Watch

1. **Available Provider Count**
   - Should be 3-4 for production
   - Alert if drops to 1

2. **Circuit Breaker States**
   - Occasional "open" is normal (auto-recovery)
   - Persistent "open" indicates provider issues

3. **Default Provider**
   - Should be your highest-priority configured provider
   - Changes indicate failover is occurring

### Common Issues

#### Provider Shows as "Unavailable"

**Possible Causes**:
1. API key not set or invalid
2. Circuit breaker is open (recent failures)
3. Rate limit exceeded
4. Provider service outage

**Solutions**:
1. Verify API key in `.env.local`
2. Wait 60 seconds for circuit breaker reset
3. Wait for rate limit window to expire
4. Check provider status page

#### All Providers Unavailable

**Possible Causes**:
1. Server not restarted after adding keys
2. Network connectivity issues
3. All providers experiencing outages (rare)

**Solutions**:
1. Restart development server
2. Check internet connection
3. Verify DuckDuckGo is working (no key needed)
4. Check server logs for errors

#### Test Search Returns No Results

**Possible Causes**:
1. Query too specific or unusual
2. Provider filtering content
3. Network timeout

**Solutions**:
1. Try a simpler query (e.g., "weather")
2. Try different provider
3. Check network latency

## Best Practices

### For Administrators

1. **Configure Multiple Providers**
   - Redundancy prevents downtime
   - Different providers have different strengths

2. **Monitor Regularly**
   - Check dashboard weekly
   - Set up alerts for circuit breaker events

3. **Test Failover**
   - Periodically disable primary provider
   - Verify fallback works correctly

4. **Track Costs**
   - Monitor API usage in provider dashboards
   - Set up billing alerts
   - Consider caching for cost optimization

5. **Keep Keys Secure**
   - Never commit `.env.local` to git
   - Rotate keys periodically
   - Use different keys for dev/prod

### For Cost Optimization

1. **Use Free Tiers First**
   - Tavily: 1,000 free searches/month
   - Google: 100 free searches/day
   - DuckDuckGo: Unlimited free

2. **Implement Caching** (Future)
   - Cache common queries
   - Reduce redundant API calls

3. **Set Appropriate maxResults**
   - Default is 5 results
   - More results = higher cost
   - Balance quality vs. cost

## Troubleshooting

### Dashboard Not Loading

1. Check admin authentication
2. Verify route exists: `/app/[locale]/admin/search/page.tsx`
3. Check browser console for errors

### Provider Status Not Updating

1. Click "Refresh Status" button
2. Check network tab for failed API calls
3. Verify `/api/v2/search` endpoint is accessible

### Test Search Failing

1. Check browser console for errors
2. Verify user is authenticated
3. Check server logs for API errors
4. Try with a simple query like "test"

## API Reference

### Get Provider Status

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
        "google": {
            "configured": false,
            "available": false,
            "circuitState": "closed"
        },
        "brave": {
            "configured": true,
            "available": true,
            "circuitState": "closed"
        },
        "duckduckgo": {
            "configured": true,
            "available": true,
            "circuitState": "closed"
        }
    },
    "availableCount": 3,
    "defaultProvider": "tavily"
}
```

### Test Search

```typescript
POST /api/v2/search
Content-Type: application/json

{
    "query": "latest AI news",
    "maxResults": 5
}

Response:
{
    "query": "latest AI news",
    "results": [
        {
            "title": "AI Breakthrough in 2026",
            "url": "https://example.com/article",
            "snippet": "Recent developments in AI...",
            "source": "example.com"
        }
    ],
    "provider": "tavily",
    "timestamp": "2026-01-03T12:00:00Z"
}
```

## Security

### Access Control

- Dashboard requires admin authentication
- API endpoints require user authentication
- API keys never exposed to client

### Rate Limiting

- 10 requests per provider per minute
- Prevents quota exhaustion
- Automatic across all users

### Data Privacy

- Search queries not logged permanently
- Results not cached (currently)
- User privacy maintained

## Future Enhancements

Planned features:

1. **Search Analytics**
   - Query volume graphs
   - Provider performance metrics
   - Cost tracking

2. **Custom Priority**
   - Reorder providers
   - Disable specific providers
   - Per-user preferences

3. **Advanced Testing**
   - Batch test queries
   - Performance benchmarks
   - Quality comparisons

4. **Alerting**
   - Email alerts for failures
   - Slack/Discord webhooks
   - Automated failover notifications

5. **Caching Dashboard**
   - View cached queries
   - Cache hit rates
   - Manual cache invalidation

## Support

For issues or questions:

1. Check this guide first
2. Review `/docs/SEARCH_INTEGRATION.md` for technical details
3. Check server logs for errors
4. Contact system administrator

## Quick Reference

| Task | Steps |
|------|-------|
| Add new provider | 1. Get API key<br>2. Add to `.env.local`<br>3. Restart server<br>4. Verify in dashboard |
| Test search | 1. Go to `/admin/search`<br>2. Enter query<br>3. Click "Search" |
| Check status | 1. Go to `/admin/search`<br>2. View provider cards<br>3. Click "Refresh Status" |
| Troubleshoot | 1. Check circuit state<br>2. Verify API key<br>3. Test with simple query<br>4. Check logs |

---

**Last Updated**: 2026-01-03  
**Version**: 1.0.0  
**Maintained By**: Remrin Development Team
