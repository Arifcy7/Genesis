# API Key Rotation Setup

## Overview
To bypass the free tier quota limit (20 requests/day per project), the backend now supports **API key rotation** across multiple Google Cloud projects.

## How It Works
- **Round-robin rotation**: Each Gemini API call uses the next key in sequence
- **5 API keys = 100 requests/day** (20 per key)
- Automatically cycles through available keys
- Gracefully handles missing keys (uses only configured ones)

## Setup Instructions

### 1. Create Multiple Google Cloud Projects
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create 5 different projects (or use existing ones)
3. Generate an API key for each project

### 2. Add Keys to .env Files

**Backend (.env):**
```bash
GOOGLE_API_KEY=AIzaSy...YourKey1
GOOGLE_API_KEY_2=AIzaSy...YourKey2
GOOGLE_API_KEY_3=AIzaSy...YourKey3
GOOGLE_API_KEY_4=AIzaSy...YourKey4
GOOGLE_API_KEY_5=AIzaSy...YourKey5
```

**Frontend (.env.local):**
```bash
GOOGLE_API_KEY=AIzaSy...YourKey1
GOOGLE_API_KEY_2=AIzaSy...YourKey2
GOOGLE_API_KEY_3=AIzaSy...YourKey3
GOOGLE_API_KEY_4=AIzaSy...YourKey4
GOOGLE_API_KEY_5=AIzaSy...YourKey5
```

### 3. Restart Backend Server
```bash
cd app/backend
source venv/bin/activate
python main.py
```

You should see:
```
✅ API Key loaded: AIzaSy...
✅ Total API keys available: 5
```

## Usage Tracking

The backend logs which key is being used:
```
🔑 Using API key #1/5
🔑 Using API key #2/5
🔑 Using API key #3/5
...
```

## Quota Calculation

| Feature | API Calls | Keys Used |
|---------|-----------|-----------|
| Simple verification | 2 calls | 2 keys |
| Verification with snippets (5 sources) | 7 calls | 7 keys (rotates through 5, restarts) |
| Verification with snippets (10 sources) | 12 calls | All 5 keys (2+ cycles) |

**Total daily capacity with 5 keys:**
- ~50 simple verifications
- ~14 full verifications with 5 snippets
- ~8 full verifications with 10 snippets

## Notes
- You don't need all 5 keys - works with 1-5 keys
- Replace `YOUR_SECOND_API_KEY_HERE` with actual keys
- Keys rotate in order: 1 → 2 → 3 → 4 → 5 → 1 → ...
- Each key has independent quota tracking
