import os
import json
import random
import asyncio
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
import websockets

# Load environment variables from .env file
load_dotenv()
# Initialize API key  
API_KEY = os.getenv("GOOGLE_API_KEY") 
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY must be set")

print(f"✅ API Key loaded: {API_KEY[:10]}...")

ai = genai.Client(api_key=API_KEY)

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

# --- AGENT 0: TRANSCRIBER ---
async def transcribe_audio(base64_audio: str, mime_type: str = "audio/webm") -> str:
    try:
        clean_mime = mime_type.split(';')[0].strip()
        if not clean_mime:
            clean_mime = 'audio/webm'
        
        response = ai.models.generate_content(
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
        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_text,
            config={
                "system_instruction": "You are the Main Agent. Route queries. If factual/news/weather, DELEGATE_TO_CHECKER. If user asks to scan, monitor, or find latest rumors, use SCAN_CRISIS.",
                "response_mime_type": "application/json",
                "response_schema": orchestrator_schema,
                "temperature": 0.3
            }
        )
        
        text = response.text
        if not text:
            raise Exception("No response")
        
        return json.loads(text)
    except Exception as error:
        print(f"Main Agent Error: {error}")
        return {"action": "DIRECT_REPLY", "reasoning": "Error", "reply_text": "System error."}

# --- AGENT 2: CHECK AGENT ---
async def run_check_agent(query: str) -> Dict[str, Any]:
    try:
        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=f'Fact check: "{query}". Format: VERDICT: [REAL/FAKE/UNCERTAIN], CONFIDENCE: [0.0-1.0], EXPLANATION: [...]',
            config={
                "tools": CHECKER_TOOLS,
                "temperature": 0.1
            }
        )
        
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
        import re
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
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "explanation": explanation,
            "sources": sources[:5]
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
        response = ai.models.generate_content(
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
        scan_response = ai.models.generate_content(
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

        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=synthesis_prompt,
            config={
                "temperature": 0.3,
                "max_output_tokens": 800
            }
        )
        
        if response and response.text and response.text.strip():
            return response.text.strip()

        # If response.text is empty, raise exception to trigger fallback
        raise ValueError(f"Empty response from synthesis model. Response object: {bool(response)}, Response text: '{getattr(response, 'text', 'No text attribute')}'")

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
        # Use the correct Gemini Live WebSocket URL 
        gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={API_KEY}"
        
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