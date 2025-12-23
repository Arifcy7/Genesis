# Snippet Extraction Feature

## Overview
The verification system now extracts **exact paragraphs/snippets** from source articles that support or refute each claim.

## What Changed

### 1. New Dependencies (requirements.txt)
- `requests` - HTTP client for fetching web pages
- `beautifulsoup4` - HTML parser
- `lxml` - Fast XML/HTML parser

### 2. New Function: `fetch_snippet_from_source()`
**Location:** `app/backend/main.py`

**What it does:**
1. Fetches the actual webpage content using requests
2. Parses HTML with BeautifulSoup
3. Cleans and extracts text content
4. Uses Gemini to identify the 1-3 most relevant sentences
5. Returns the exact quoted snippet (max 500 chars)

**Parameters:**
- `uri`: Source URL to fetch
- `query`: The claim being verified
- `max_length`: Max article length to process (default 10,000 chars)

**Returns:**
- Extracted snippet text or error message

### 3. Updated: `run_check_agent()`
**New parameter:** `extract_snippets=True`

When enabled:
- Fetches snippets from top 3 sources (parallel async requests)
- Adds `snippet` field to each source in results
- Falls back to "Snippet unavailable" on errors

## Example Output

### Before (just links):
```json
{
  "sources": [
    {
      "title": "britannica.com",
      "uri": "https://..."
    }
  ]
}
```

### After (with snippets):
```json
{
  "sources": [
    {
      "title": "britannica.com",
      "uri": "https://...",
      "snippet": "The Eiffel Tower can be found on the Champs de Mars at 5 Avenue Anatole France within the 7th arrondissement of Paris."
    }
  ]
}
```

## Usage

### API Endpoints
All endpoints using `run_check_agent()` now automatically include snippets:
- `/api/check-agent`
- `/api/main-agent`
- Live voice verification

### Manual Control
```python
# With snippets (default)
result = await run_check_agent("claim", extract_snippets=True)

# Without snippets (faster)
result = await run_check_agent("claim", extract_snippets=False)
```

## Performance Notes

**Time impact:** +1-3 seconds per verification (parallel fetching)
**API calls:** +1 Gemini call per source for snippet extraction
**Success rate:** ~60-80% (depends on site accessibility, paywalls, rate limits)

## Error Handling

Graceful fallbacks:
- Timeout (5 sec): "Source timeout - could not fetch content"
- HTTP errors: "Could not access source: [error]"
- Parsing errors: "Snippet extraction failed"
- Model overload: "Snippet extraction failed"

## Testing

Run the test script:
```bash
cd app/backend
./venv/bin/python test_snippet.py
```

## Production Recommendations

1. **Caching:** Cache snippets by (uri, query) to avoid refetching
2. **Rate limiting:** Add delays between requests to avoid IP bans
3. **Proxy rotation:** Use proxies for high-volume extraction
4. **Paid APIs:** Consider services like Diffbot or newspaper3k for better reliability
5. **Cost control:** Monitor Gemini API usage (1 extra call per source snippet)

## Limitations

- Some sites block bots or require JavaScript (no snippet)
- Paywalled content returns limited/no text
- Very long articles may be truncated to 10,000 chars
- Gemini API rate limits may cause failures during high load
- Not all sources provide clean, extractable text

## Future Enhancements

- [ ] Add snippet caching in MongoDB
- [ ] Support for PDF sources
- [ ] Better handling of paywalls
- [ ] Configurable snippet length
- [ ] Multiple snippet extraction per source
- [ ] Highlight exact sentences in UI
