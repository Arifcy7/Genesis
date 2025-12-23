# Backend Optimizations & Performance Tuning

## ✅ Implemented Optimizations

### 1. **API Key Rotation** 🔑
- **What**: Round-robin rotation across 5 Google Cloud API keys
- **Benefit**: 5x quota increase (20 → 100 requests/day)
- **Implementation**: `get_next_api_key()` function rotates keys on every API call
- **Configuration**: `GOOGLE_API_KEY`, `GOOGLE_API_KEY_2`, ..., `GOOGLE_API_KEY_5` in `.env`

### 2. **Snippet Caching** 💾
- **What**: In-memory cache for extracted snippets
- **Benefit**: Avoids redundant HTTP requests and Gemini API calls for same URL+query
- **Implementation**: `snippet_cache` dictionary with `uri:query` as key
- **Cache Key**: `{uri}:{query[:50]}` (URL + first 50 chars of query)

### 3. **Rate Limit Protection** ⏱️
- **What**: Automatic detection and graceful handling of rate limit errors
- **Benefit**: Prevents wasted API calls when quota is exhausted
- **Implementation**: Detects `429 RESOURCE_EXHAUSTED` errors, stops snippet extraction, marks remaining sources
- **User Experience**: Shows "Rate limit reached" instead of failing silently

### 4. **Request Delay** 🕐
- **What**: Configurable delay between consecutive snippet extraction requests
- **Benefit**: Prevents burst rate limit errors (Gemini has 5 req/min limit on free tier)
- **Default**: 0.5 seconds between requests
- **Configuration**: `SNIPPET_DELAY_SECONDS=0.5` in `.env`

### 5. **Exact Verbatim Quotes** 📝
- **What**: Keyword-based sentence extraction instead of AI summarization
- **Benefit**: Returns actual text from source (100% accurate), faster, uses less AI quota
- **Fallback**: Uses Gemini only when keyword matching fails
- **Implementation**: Sentence splitting + keyword overlap scoring

### 6. **Configurable Snippet Limits** 🎛️
- **What**: Environment variable to control max number of snippets
- **Benefit**: Adjust API usage vs information quality tradeoff
- **Default**: 5 snippets per verification
- **Configuration**: `MAX_SNIPPETS=5` in `.env`

### 7. **Feature Toggle** 🎚️
- **What**: Ability to completely disable snippet extraction
- **Benefit**: Emergency quota conservation during high traffic
- **Default**: Enabled
- **Configuration**: `ENABLE_SNIPPET_EXTRACTION=true` in `.env`

## Environment Variables Reference

```bash
# API Keys (1-5, minimum 1 required)
GOOGLE_API_KEY=your_key_here
GOOGLE_API_KEY_2=your_key_here
GOOGLE_API_KEY_3=your_key_here
GOOGLE_API_KEY_4=your_key_here
GOOGLE_API_KEY_5=your_key_here

# Snippet Extraction Control
ENABLE_SNIPPET_EXTRACTION=true          # true/false - enable/disable snippets
SNIPPET_DELAY_SECONDS=0.5               # 0.0-5.0 - delay between snippet requests
MAX_SNIPPETS=5                          # 1-10 - max snippets per verification

# Other
MONGODB_URI=your_mongodb_uri
BACKEND_URL=http://localhost:8002
NODE_ENV=development
```

## Performance Tuning Guide

### For Demo/Presentation (High Quality)
```bash
ENABLE_SNIPPET_EXTRACTION=true
MAX_SNIPPETS=5
SNIPPET_DELAY_SECONDS=0.5
```
- Best user experience
- ~7 API calls per verification
- ~14 verifications per day with 5 keys

### For Testing/Development (Quota Conservation)
```bash
ENABLE_SNIPPET_EXTRACTION=false
MAX_SNIPPETS=3
SNIPPET_DELAY_SECONDS=1.0
```
- Minimal API usage
- ~2 API calls per verification
- ~50 verifications per day with 5 keys

### For High Traffic (Balanced)
```bash
ENABLE_SNIPPET_EXTRACTION=true
MAX_SNIPPETS=3
SNIPPET_DELAY_SECONDS=0.8
```
- Moderate quality + moderate quota
- ~5 API calls per verification
- ~20 verifications per day with 5 keys

## API Call Breakdown

| Feature | API Calls | Which Keys Used |
|---------|-----------|-----------------|
| Simple text verification | 2 | Main Agent + Check Agent |
| Verification with 3 snippets | 5 | Main + Check + 3 snippets |
| Verification with 5 snippets | 7 | Main + Check + 5 snippets |
| Verification with 10 snippets | 12 | Main + Check + 10 snippets |
| Image + text verification | 3+ | Main + Image + Check (+snippets) |

## Monitoring API Usage

### Check Current Key Rotation
Look for log output:
```
🔑 Using API key #1/5
🔑 Using API key #2/5
...
```

### Monitor Rate Limits
Watch for warnings:
```
⚠️ Rate limit hit on snippet 3, stopping extraction
```

### Cache Hit Rate
Look for cache usage:
```
📦 Using cached snippet for https://example.com...
```

## Future Optimizations (Not Yet Implemented)

1. **MongoDB Snippet Persistence** - Store snippets in DB for long-term caching
2. **Redis Caching Layer** - Distributed cache for multi-instance deployments
3. **Snippet Prefetching** - Pre-extract snippets for popular topics/sources
4. **Adaptive Rate Limiting** - Dynamically adjust delays based on error rates
5. **Source Quality Scoring** - Prioritize snippet extraction from high-quality sources
6. **Parallel Snippet Extraction with Backoff** - Extract in parallel but with exponential backoff on errors
7. **API Key Health Tracking** - Monitor quota per key, skip exhausted keys
8. **Gemini Flash 8B Model** - Use cheaper model for snippet extraction (when available)

## Troubleshooting

### "You exceeded your current quota" Error
- **Solution 1**: Add more API keys (up to 5)
- **Solution 2**: Reduce `MAX_SNIPPETS` to 3
- **Solution 3**: Disable snippets temporarily: `ENABLE_SNIPPET_EXTRACTION=false`
- **Solution 4**: Wait for quota reset (resets daily at midnight PST)

### Slow Response Times
- **Cause**: Snippet extraction adds 1-5 seconds
- **Solution 1**: Reduce `MAX_SNIPPETS` to 3
- **Solution 2**: Reduce `SNIPPET_DELAY_SECONDS` to 0.3 (but may hit rate limits)
- **Solution 3**: Disable snippets for faster responses

### Cache Not Working
- **Issue**: Cache is in-memory, cleared on server restart
- **Solution**: Implement MongoDB persistence (future optimization)

### Rate Limits Still Hit Despite Rotation
- **Cause**: Free tier has 5 requests/minute per model limit
- **Solution**: Increase `SNIPPET_DELAY_SECONDS` to 1.0 or higher
- **Alternative**: Upgrade to Gemini API paid tier (no rate limits)

## Best Practices

1. **Always use 5 API keys** for maximum quota
2. **Monitor logs** for rate limit warnings
3. **Adjust MAX_SNIPPETS** based on traffic patterns
4. **Clear snippet_cache periodically** (restart server) to avoid stale data
5. **Use ENABLE_SNIPPET_EXTRACTION=false** during heavy testing phases
6. **Keep SNIPPET_DELAY_SECONDS ≥ 0.5** to avoid burst rate limits
