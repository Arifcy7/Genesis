import os
import json
import random
import asyncio
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai  # Keep for voice/audio only
from google.genai import types
from dotenv import load_dotenv
import websockets
import requests
from bs4 import BeautifulSoup
import re
from groq import Groq  # For text-based agents

# Load environment variables from .env file
load_dotenv()

# GROQ API KEY (for text-based agents - FREE & UNLIMITED)
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY must be set in .env")

# Google API Key Pool (COMMENTED - kept for voice/audio only)
# API_KEYS = [
#     os.getenv('GOOGLE_API_KEY'),
#     os.getenv('GOOGLE_API_KEY_2'),
#     os.getenv('GOOGLE_API_KEY_3'),
#     os.getenv('GOOGLE_API_KEY_4'),
#     os.getenv('GOOGLE_API_KEY_5'),
# ]
# API_KEYS = [key for key in API_KEYS if key]
# if not API_KEYS:
#     raise ValueError("No API keys configured! Set at least GOOGLE_API_KEY in .env")

# Keep one Google API key for voice/audio functionality
GOOGLE_API_KEY_VOICE = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY_VOICE:
    raise ValueError("GOOGLE_API_KEY must be set for voice functionality")

# Google API Keys Pool for Check Agent rotation
GOOGLE_API_KEYS = [
    os.getenv('GOOGLE_API_KEY'),
    os.getenv('GOOGLE_API_KEY_2'),
    os.getenv('GOOGLE_API_KEY_3'),
    os.getenv('GOOGLE_API_KEY_4'),
    os.getenv('GOOGLE_API_KEY_5'),
]
GOOGLE_API_KEYS = [key for key in GOOGLE_API_KEYS if key]

# Track current Google API key index for rotation
google_key_index = 0

def get_next_google_key():
    """Round-robin rotation for Google API keys (Check Agent only)"""
    global google_key_index
    key = GOOGLE_API_KEYS[google_key_index]
    google_key_index = (google_key_index + 1) % len(GOOGLE_API_KEYS)
    print(f"🔑 Using Google API key #{google_key_index + 1}/{len(GOOGLE_API_KEYS)} for Check Agent")
    return key

# Track current key index for round-robin rotation (COMMENTED - not needed for Groq)
# current_key_index = 0
# def get_next_api_key():
#     """Round-robin API key rotation to distribute quota"""
#     global current_key_index
#     key = API_KEYS[current_key_index]
#     current_key_index = (current_key_index + 1) % len(API_KEYS)
#     print(f"🔑 Using API key #{current_key_index + 1}/{len(API_KEYS)}")
#     return key

# In-memory snippet cache to avoid refetching same URLs
snippet_cache = {}

# Feature flags
ENABLE_SNIPPET_EXTRACTION = os.getenv('ENABLE_SNIPPET_EXTRACTION', 'true').lower() == 'true'
SNIPPET_DELAY_SECONDS = float(os.getenv('SNIPPET_DELAY_SECONDS', '0.5'))  # Delay between snippet requests
MAX_SNIPPETS = int(os.getenv('MAX_SNIPPETS', '5'))  # Max number of snippets to extract

# Initialize Groq client (for text-based agents)
groq_client = Groq(api_key=GROQ_API_KEY)

# Initialize Gemini client (for voice/audio only)
gemini_voice_client = genai.Client(api_key=GOOGLE_API_KEY_VOICE)

print(f"✅ Groq API Key loaded: {GROQ_API_KEY[:10]}...")
print(f"✅ Google API Key (voice only): {GOOGLE_API_KEY_VOICE[:10]}...")
print(f"🚀 Using Groq for text agents (FREE & UNLIMITED)")
print(f"🎤 Using Gemini for voice/audio only")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the tool for the Live API
LIVE_AGENT_TOOLS = [
    {
        "function_declarations": [
            {
                "name": "verify_fact",
                "description": "Verify a claim, news, or fact using the Check Agent. Use this for ANY objective question regarding reality, news, weather, or data.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The specific claim or fact to check."
                        }
                    },
                    "required": ["query"]
                }
            }
        ]
    }
]

CHECKER_TOOLS = [
    {"google_search": {}}
]

# --- HELPER: FETCH SOURCE SNIPPET ---
async def fetch_snippet_from_source(uri: str, query: str, max_length: int = 10000) -> Optional[str]:
    """
    Fetches the actual webpage content and extracts exact verbatim quotes
    that are relevant to the given query. Uses caching to avoid redundant requests.
    """
    # Check cache first
    cache_key = f"{uri}:{query[:50]}"
    if cache_key in snippet_cache:
        print(f"📦 Using cached snippet for {uri[:50]}...")
        return snippet_cache[cache_key]
    
    try:
        # Fetch with timeout and user agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(uri, timeout=5, headers=headers, allow_redirects=True)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Limit text length to avoid huge API calls
        if len(text) > max_length:
            text = text[:max_length]
        
        # Split into sentences (simple sentence boundary detection)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Extract keywords from query for matching
        query_keywords = set(re.findall(r'\b\w{3,}\b', query.lower()))
        
        # Score each sentence by keyword overlap
        scored_sentences = []
        for sentence in sentences:
            if len(sentence) < 20 or len(sentence) > 500:  # Skip very short/long sentences
                continue
            
            sentence_words = set(re.findall(r'\b\w{3,}\b', sentence.lower()))
            overlap = len(query_keywords & sentence_words)
            
            if overlap > 0:
                scored_sentences.append((overlap, sentence))
        
        # Sort by relevance and take top 2-3 sentences
        scored_sentences.sort(reverse=True, key=lambda x: x[0])
        top_sentences = [sent for _, sent in scored_sentences[:3]]
        
        if not top_sentences:
            # Fallback: use Gemini to identify relevant sentences, then extract exact text
            # Use rotating Google API key for snippet extraction
            snippet_client = genai.Client(api_key=get_next_google_key())
            snippet_ai = snippet_client.aio
            
            snippet_prompt = f"""From this article, identify which sentences are most relevant to: "{query}"

Article text:
{text[:5000]}

List the first 5-10 words of each relevant sentence, so I can find them in the original text."""
            
            snippet_response = await snippet_ai.models.generate_content(
                model="gemini-2.5-flash",
                contents=snippet_prompt,
                config={"temperature": 0.0}
            )
            
            hints = snippet_response.text or ""
            
            # Try to find sentences matching the hints
            for hint_line in hints.split('\n'):
                hint = re.sub(r'^[-*•]\s*', '', hint_line).strip()[:50]
                if len(hint) < 10:
                    continue
                    
                for sentence in sentences:
                    if hint.lower() in sentence.lower()[:100]:
                        top_sentences.append(sentence)
                        if len(top_sentences) >= 3:
                            break
                if len(top_sentences) >= 3:
                    break
        
        if top_sentences:
            snippet = ' '.join(top_sentences[:3])
            # Limit total length
            if len(snippet) > 500:
                snippet = snippet[:500] + "..."
            result = f'"{snippet}"'  # Wrap in quotes to show it's verbatim
            # Cache the result
            snippet_cache[cache_key] = result
            return result
        else:
            no_snippet = "No relevant snippet found"
            snippet_cache[cache_key] = no_snippet
            return no_snippet
        
    except requests.Timeout:
        return "Source timeout - could not fetch content"
    except requests.RequestException as e:
        return f"Could not access source: {str(e)[:50]}"
    except Exception as e:
        print(f"Snippet extraction error for {uri}: {e}")
        return "Snippet extraction failed"

# --- AGENT 0: TRANSCRIBER ---
async def transcribe_audio(base64_audio: str, mime_type: str = "audio/webm") -> str:
    try:
        # Use rotating API key
        client = get_ai_client()
        clean_mime = mime_type.split(';')[0].strip()
        if not clean_mime:
            clean_mime = 'audio/webm'
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents={
                "parts": [
                    {"inline_data": {"mime_type": clean_mime, "data": base64_audio}},
                    {"text": "Listen to this audio. Output ONLY the verbatim spoken text. Do not reply to the speaker. If silence, output nothing."}
                ]
            },
            config={"temperature": 0.0}
        )
        
        return response.text or ""
    except Exception as error:
        print(f"Transcription Error: {error}")
        return ""

# --- AGENT 1: MAIN AGENT ---
orchestrator_schema = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ['DIRECT_REPLY', 'DELEGATE_TO_CHECKER', 'SCAN_CRISIS'],
            "description": "Use DELEGATE for specific checks. Use SCAN_CRISIS if user asks to 'scan', 'monitor', 'find trends', or 'check news' about a broad topic."
        },
        "reasoning": {"type": "string", "description": "Internal thought process."},
        "reply_text": {"type": "string", "description": "Response if DIRECT_REPLY."},
        "checker_query": {"type": "string", "description": "Optimized search query for the Check Agent."},
        "scan_topic": {"type": "string", "description": "The broad topic to scan for emerging misinformation."}
    },
    "required": ['action', 'reasoning']
}

async def run_main_agent(user_text: str) -> Dict[str, Any]:
    try:
        # Use Groq for text-based routing
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are the Main Agent. Route queries. If factual/news/weather, DELEGATE_TO_CHECKER. If user asks to scan, monitor, or find latest rumors, use SCAN_CRISIS. Respond ONLY with valid JSON matching this schema: {\"action\": \"DIRECT_REPLY|DELEGATE_TO_CHECKER|SCAN_CRISIS\", \"reasoning\": \"string\", \"reply_text\": \"string\", \"checker_query\": \"string\", \"scan_topic\": \"string\"}"},
                {"role": "user", "content": user_text}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        text = response.choices[0].message.content
        if not text:
            raise Exception("No response")
        
        return json.loads(text)
    except Exception as error:
        print(f"Main Agent Error: {error}")
        return {"action": "DIRECT_REPLY", "reasoning": "Error", "reply_text": "System error."}

# --- AGENT 2: CHECK AGENT ---
# NOTE: Still using Gemini for Check Agent because it has Google Search grounding
# Groq doesn't have built-in search capability
async def run_check_agent(query: str, extract_snippets: bool = True) -> Dict[str, Any]:
    # Try each Google API key in rotation until one works
    last_error = None
    
    for attempt in range(len(GOOGLE_API_KEYS)):
        try:
            # Use rotating Google API key for Check Agent
            current_key = get_next_google_key()
            gemini_client = genai.Client(api_key=current_key)
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=f'Fact check: "{query}". Format: VERDICT: [REAL/FAKE/UNCERTAIN], CONFIDENCE: [0.0-1.0], EXPLANATION: [...]',
                config={
                    "tools": CHECKER_TOOLS,
                    "temperature": 0.1
                }
            )
            
            # If we got here, the request succeeded - break out of retry loop
            break
            
        except Exception as e:
            last_error = e
            error_msg = str(e)
            
            # Check if it's a quota/rate limit error
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg or "quota" in error_msg.lower():
                print(f"⚠️ API key exhausted, trying next key... ({attempt + 1}/{len(GOOGLE_API_KEYS)})")
                if attempt < len(GOOGLE_API_KEYS) - 1:
                    continue  # Try next key
                else:
                    print(f"❌ All {len(GOOGLE_API_KEYS)} Google API keys exhausted!")
                    raise Exception("All Google API keys have reached their quota limit")
            else:
                # If it's not a quota error, don't retry
                raise e
    
    try:
        
        grounding_chunks = []
        if response.candidates and len(response.candidates) > 0:
            if response.candidates[0].grounding_metadata:
                grounding_chunks = response.candidates[0].grounding_metadata.grounding_chunks or []
        
        sources = []
        for chunk in grounding_chunks:
            if chunk.web:
                sources.append({"title": chunk.web.title, "uri": chunk.web.uri})
        
        text = response.text or ""
        
        verdict = 'UNCERTAIN'
        confidence = 0.5
        
        # Parse verdict
        verdict_match = re.search(r'VERDICT:\s*(REAL|FAKE|UNCERTAIN)', text, re.IGNORECASE)
        if verdict_match:
            verdict = verdict_match.group(1).upper()
        
        # Parse confidence
        confidence_match = re.search(r'CONFIDENCE:\s*([0-9]*\.?[0-9]+)', text, re.IGNORECASE)
        if confidence_match:
            confidence = float(confidence_match.group(1))
        
        # Extract explanation
        explanation = re.sub(r'VERDICT:.*(\n|$)', '', text, flags=re.IGNORECASE)
        explanation = re.sub(r'CONFIDENCE:.*(\n|$)', '', explanation, flags=re.IGNORECASE)
        explanation = explanation.strip()
        
        # NEW: Extract snippets from top sources (5-10 sources, sequential)
        if extract_snippets and sources and ENABLE_SNIPPET_EXTRACTION:
            num_sources = min(len(sources), MAX_SNIPPETS)  # Process up to MAX_SNIPPETS
            print(f"🔍 Extracting snippets from {num_sources} sources sequentially...")
            
            # Sequential extraction (not parallel) to avoid rate limits
            for i in range(num_sources):
                try:
                    snippet = await fetch_snippet_from_source(sources[i]['uri'], query)
                    sources[i]['snippet'] = snippet if snippet else "Snippet unavailable"
                    
                    # Add delay between requests to avoid rate limiting
                    if i < num_sources - 1:  # Don't delay after last request
                        await asyncio.sleep(SNIPPET_DELAY_SECONDS)
                        
                except Exception as e:
                    error_msg = str(e)
                    if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                        print(f"⚠️ Rate limit hit on snippet {i+1}, stopping extraction")
                        sources[i]['snippet'] = "Rate limit reached"
                        # Stop extracting more snippets if we hit rate limit
                        for j in range(i+1, num_sources):
                            sources[j]['snippet'] = "Extraction skipped (rate limit)"
                        break
                    else:
                        print(f"Error extracting snippet {i+1}: {e}")
                        sources[i]['snippet'] = "Snippet extraction failed"
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "explanation": explanation,
            "sources": sources[:15]  # Return up to 15 sources
        }
    except Exception as error:
        print(f"Check Agent Error: {error}")
        return {
            "verdict": "UNCERTAIN",
            "confidence": 0,
            "explanation": "Tool access failed.",
            "sources": []
        }

# --- AGENT 4: IMAGE AGENT ---
async def process_image_content(base64_image: str, user_message: str = "") -> Dict[str, Any]:
    try:
        # Use rotating API key
        client = get_ai_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents={
                "parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": base64_image}},
                    {"text": f"Extract and describe all text, claims, and factual information visible in this image. Focus on news headlines, social media posts, claims, or any information that could be fact-checked. User's question: '{user_message}' If no user question, just extract all verifiable claims from the image."}
                ]
            },
            config={"temperature": 0.2}
        )
        
        extracted_content = response.text or ""
        return {
            "extracted_content": extracted_content,
            "user_message": user_message,
            "combined_query": f"Image content: {extracted_content}. User question: {user_message}" if user_message else extracted_content
        }
    except Exception as error:
        print(f"Image Agent Error: {error}")
        return {
            "extracted_content": "Failed to process image",
            "user_message": user_message,
            "combined_query": user_message or "Failed to process image"
        }

# Update orchestrator schema to include image handling
orchestrator_schema = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ['DIRECT_REPLY', 'DELEGATE_TO_CHECKER', 'SCAN_CRISIS', 'PROCESS_IMAGE'],
            "description": "Use DELEGATE for specific checks. Use SCAN_CRISIS if user asks to 'scan', 'monitor', 'find trends', or 'check news' about a broad topic. Use PROCESS_IMAGE if user uploaded an image for fact-checking."
        },
        "reasoning": {"type": "string", "description": "Internal thought process."},
        "reply_text": {"type": "string", "description": "Response if DIRECT_REPLY."},
        "checker_query": {"type": "string", "description": "Optimized search query for the Check Agent."},
        "scan_topic": {"type": "string", "description": "The broad topic to scan for emerging misinformation."}
    },
    "required": ['action', 'reasoning']
}
async def scan_crisis_trends(topic: str) -> List[Dict[str, Any]]:
    try:
        # Use rotating API key
        client = get_ai_client()
        scan_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f'Find the top 3 trending rumors, news headlines, or viral claims currently circulating about: "{topic}". Return ONLY a JSON array of strings, no markdown.',
            config={
                "tools": CHECKER_TOOLS
            }
        )
        
        claims = []
        try:
            clean_text = scan_response.text or "[]"
            clean_text = clean_text.replace('```json', '').replace('```', '').strip()
            claims = json.loads(clean_text)
        except Exception as e:
            print(f"Parse error: {e}")
        
        if len(claims) == 0:
            return []
        
        async def check_claim(claim):
            check = await run_check_agent(claim)
            return {
                "id": ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=9)),
                "topic": topic,
                "claim": claim,
                "severity": 'HIGH' if check["verdict"] == 'FAKE' else 'MEDIUM',
                "verdict": check["verdict"],
                "confidence": check["confidence"],
                "explanation": check["explanation"],
                "sources": check["sources"],  # Include sources from fact check
                "volume": random.randint(500, 1500),
                "timestamp": None
            }
        
        check_promises = [check_claim(claim) for claim in claims]
        return await asyncio.gather(*check_promises)
        
    except Exception as error:
        print(f"Scanner Error: {error}")
        return []

# --- SYNTHESIS ---
async def run_main_agent_synthesis(user_query: str, check_result: Dict[str, Any]) -> str:
    try:
        print(f"🔍 Synthesis Input - User Query: {user_query[:100]}...")
        print(f"🔍 Synthesis Input - Check Result: {check_result}")

        # Sanitize inputs to prevent Gemini issues
        clean_user_query = str(user_query).replace('"', "'").strip()
        clean_verdict = str(check_result.get("verdict", "UNCERTAIN")).strip()
        clean_confidence = float(check_result.get("confidence", 0.5))
        clean_explanation = str(check_result.get("explanation", "No explanation provided")).replace('"', "'").strip()

        # Create a professional fact-checking response prompt
        synthesis_prompt = f"""
You are a professional fact-checker creating a clear, well-structured response.

USER ASKED: {clean_user_query}

FACT-CHECK RESULTS:
- Verdict: {clean_verdict}
- Confidence: {clean_confidence}
- Explanation: {clean_explanation}

Create a professional response that follows this structure:

**Start with clear verdict using emoji:**
- ✅ for TRUE/REAL claims
- ❌ for FALSE/FAKE claims
- ⚠️ for MIXED/UNCLEAR claims

**Then provide explanation in 2-3 clear paragraphs:**
- First paragraph: Direct answer to user's question
- Second paragraph: Key evidence and context
- Third paragraph (if needed): Additional important details

**Include confidence level** as a percentage.

**End with a note about sources** (don't list them, just mention they support the verdict).

Write in a conversational but authoritative tone, like a professional fact-checker explaining to a friend. Use proper paragraphs, not bullet points. Be clear and engaging.

Example format:
❌ **This claim is FALSE.**

[Explanation paragraph 1]

[Explanation paragraph 2]

**Confidence Level:** XX%

*This assessment is based on verification from multiple reliable sources.*
"""

        # Use Groq for synthesis (fast & free)
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a professional fact-checker. Create clear, well-structured responses with emojis and confidence levels."},
                {"role": "user", "content": synthesis_prompt}
            ],
            temperature=0.3,
            max_tokens=800
        )
        
        if response and response.choices and response.choices[0].message.content:
            return response.choices[0].message.content.strip()

        # If response is empty, raise exception to trigger fallback
        raise ValueError(f"Empty response from synthesis model")

    except Exception as e:
        print(f"Synthesis Error: {e}")
        # Fallback response
        verdict_emoji = "✅" if check_result["verdict"] == "REAL" else "❌" if check_result["verdict"] == "FAKE" else "⚠️"
        fallback_text = f"{verdict_emoji} **This claim is {check_result['verdict']}.**\n\n{check_result.get('explanation', 'Based on available information.')}\n\n**Confidence Level:** {int(check_result.get('confidence', 0.5) * 100)}%"
        print(f"Synthesis: Using fallback response: {fallback_text[:100]}...")
        return fallback_text

# ==================== FASTAPI ROUTES ====================

# Pydantic models for request/response
class TranscribeRequest(BaseModel):
    base64Audio: str
    mimeType: str = "audio/webm"

class MainAgentRequest(BaseModel):
    userText: str

class CheckAgentRequest(BaseModel):
    query: str

class ImageRequest(BaseModel):
    base64Image: str
    userMessage: str = ""

class ScanCrisisRequest(BaseModel):
    topic: str

class SynthesisRequest(BaseModel):
    userQuery: str
    checkResult: Dict[str, Any]

# REST Endpoints
@app.post("/api/transcribe")
async def api_transcribe(request: TranscribeRequest):
    text = await transcribe_audio(request.base64Audio, request.mimeType)
    return {"text": text}

@app.post("/api/main-agent")
async def api_main_agent(request: MainAgentRequest):
    result = await run_main_agent(request.userText)
    return result

@app.post("/api/check-agent")
async def api_check_agent(request: CheckAgentRequest):
    result = await run_check_agent(request.query)
    return result

@app.post("/api/process-image")
async def api_process_image(request: ImageRequest):
    result = await process_image_content(request.base64Image, request.userMessage)
    return result

@app.post("/api/scan-crisis")
async def api_scan_crisis(request: ScanCrisisRequest):
    result = await scan_crisis_trends(request.topic)
    return result

@app.post("/api/synthesis")
async def api_synthesis(request: SynthesisRequest):
    print(f"📩 Synthesis API called")
    print(f"📩 User Query: {request.userQuery[:100]}...")
    print(f"📩 Check Result Keys: {list(request.checkResult.keys()) if request.checkResult else 'None'}")
    print(f"📩 Check Result: {request.checkResult}")

    text = await run_main_agent_synthesis(request.userQuery, request.checkResult)

    print(f"📤 Synthesis API returning: {text[:100]}..." if text else "📤 Synthesis API returning: None/Empty")
    return {"text": text}

# WebSocket for Live Voice - CLEAN VERSION
@app.websocket("/ws/live-session")
async def websocket_live_session(websocket: WebSocket):
    await websocket.accept()
    print("🎤 VOICE: Connected")
    
    try:
        # Use the correct Gemini Live WebSocket URL (use GOOGLE_API_KEY_VOICE for voice)
        gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={GOOGLE_API_KEY_VOICE}"
        
        # Connect directly to Gemini Live WebSocket
        async with websockets.connect(gemini_ws_url) as gemini_ws:
            print("🎤 Connected to Gemini Live API")
            
            # Send setup message with native audio model
            setup_message = {
                "setup": {
                    "model": "models/gemini-2.5-flash-native-audio-preview-09-2025",
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {
                                    "voiceName": "Puck"
                                }
                            }
                        }
                    },
                    "systemInstruction": {
                        "parts": [{
                            "text": "You are the Voice Main Agent. You listen to the user. You have access to a tool called 'verify_fact'. If the user asks ANY question about facts, news, weather, or reality, you MUST use 'verify_fact' to check it. Do not answer from your own knowledge. Always cite the source provided by the tool. Be concise and conversational."
                        }]
                    },
                    "tools": LIVE_AGENT_TOOLS
                }
            }
            
            await gemini_ws.send(json.dumps(setup_message))
            await websocket.send_json({"type": "connected"})
            
            # Handle client audio streaming to Gemini
            async def forward_audio_to_gemini():
                try:
                    while True:
                        data = await websocket.receive_json()
                        if data.get("type") == "audio":
                            # Convert base64 to proper PCM format and send to Gemini
                            realtime_input = {
                                "realtimeInput": {
                                    "mediaChunks": [{
                                        "data": data["audio"],
                                        "mimeType": "audio/pcm;rate=16000"
                                    }]
                                }
                            }
                            await gemini_ws.send(json.dumps(realtime_input))
                            
                except WebSocketDisconnect:
                    print("Client WebSocket disconnected")
                    return
                except Exception as e:
                    print(f"Audio forwarding error: {e}")
                    return
            
            # Handle Gemini responses and forward to client
            async def process_gemini_responses():
                try:
                    async for message in gemini_ws:
                        try:
                            response = json.loads(message)
                            
                            # Handle setup complete
                            if "setupComplete" in response:
                                print("🎤 Gemini setup complete")
                                continue
                            
                            # Handle server content
                            if "serverContent" in response:
                                server_content = response["serverContent"]
                                
                                # User transcript from input transcription
                                if "inputTranscription" in server_content and server_content["inputTranscription"]:
                                    transcript = server_content["inputTranscription"].get("text", "")
                                    if transcript:
                                        print(f"👤 USER: {transcript}")
                                        await websocket.send_json({
                                            "type": "transcript", 
                                            "role": "user", 
                                            "text": transcript
                                        })
                                
                                # Agent audio response
                                if "modelTurn" in server_content:
                                    model_turn = server_content["modelTurn"]
                                    if "parts" in model_turn:
                                        for part in model_turn["parts"]:
                                            if "inlineData" in part:
                                                inline_data = part["inlineData"]
                                                if inline_data.get("mimeType", "").startswith("audio/pcm"):
                                                    # Send 24kHz PCM audio back to client
                                                    await websocket.send_json({
                                                        "type": "audio",
                                                        "audio": inline_data["data"]
                                                    })
                                
                                # Agent transcript from output transcription
                                if "outputTranscription" in server_content and server_content["outputTranscription"]:
                                    agent_text = server_content["outputTranscription"].get("text", "")
                                    if agent_text:
                                        print(f"🤖 AGENT: {agent_text}")
                                        await websocket.send_json({
                                            "type": "transcript", 
                                            "role": "agent", 
                                            "text": agent_text
                                        })
                            
                            # Handle tool calls
                            if "toolCall" in response:
                                tool_call = response["toolCall"]
                                if "functionCalls" in tool_call:
                                    for fc in tool_call["functionCalls"]:
                                        if fc["name"] == "verify_fact":
                                            query = fc["args"].get("query", "")
                                            print(f"🔍 Voice → Check: '{query}'")
                                            
                                            await websocket.send_json({
                                                "type": "agent_communication",
                                                "text": f"Voice Agent → Check Agent: \"{query}\""
                                            })
                                            
                                            # Call our check agent
                                            result = await run_check_agent(query)
                                            print(f"✅ Check → Voice: {result['verdict']}")
                                            
                                            await websocket.send_json({
                                                "type": "agent_result",
                                                "verdict": result["verdict"],
                                                "query": query
                                            })
                                            
                                            # Send tool response back to Gemini
                                            tool_response = {
                                                "toolResponse": {
                                                    "functionResponses": [{
                                                        "name": fc["name"],
                                                        "id": fc["id"],
                                                        "response": {
                                                            "verdict": result["verdict"],
                                                            "explanation": result["explanation"][:200],
                                                            "sources": result["sources"][:2]
                                                        }
                                                    }]
                                                }
                                            }
                                            await gemini_ws.send(json.dumps(tool_response))
                                            
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e}")
                        except Exception as e:
                            print(f"Response processing error: {e}")
                            
                except websockets.exceptions.ConnectionClosed:
                    print("Gemini WebSocket closed")
                    return
                except Exception as e:
                    print(f"❌ Gemini response error: {e}")
                    return
            
            # Run both tasks concurrently
            await asyncio.gather(
                forward_audio_to_gemini(), 
                process_gemini_responses(),
                return_exceptions=True
            )
    
    except Exception as e:
        print(f"❌ VOICE Error: {e}")
        try:
            await websocket.send_json({
                "type": "error", 
                "message": str(e)
            })
        except:
            pass
    finally:
        print("🔌 VOICE: Closed")

@app.get("/")
async def root():
    return {"status": "online", "service": "Agentic Verifier FastAPI", "version": "2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)