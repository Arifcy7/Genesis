import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY must be set")
if not MONGODB_URI:
    raise ValueError("MONGODB_URI must be set")

# Initialize Google GenAI
ai = genai.Client(api_key=API_KEY)

# Initialize MongoDB
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client['test']
companies_collection = db['companies']
news_tracking_collection = db['news_tracking']

print(f"✅ Connected to MongoDB")
print(f"📊 Database: {db.name}")
print(f"📂 Collections: {db.list_collection_names()}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATA QUERY AGENT ====================

class QueryRequest(BaseModel):
    companyId: str
    userQuery: str

class TranscribeRequest(BaseModel):
    base64Audio: str
    mimeType: str = "audio/webm"

# Agent schema for routing queries
query_agent_schema = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ['QUERY_NEWS_DATA', 'QUERY_COMPANY_INFO', 'QUERY_STATISTICS', 'GENERAL_RESPONSE'],
            "description": "Determine what type of data query the user wants"
        },
        "reasoning": {"type": "string", "description": "Why this action was chosen"},
        "query_type": {
            "type": "string",
            "enum": ['latest_news', 'fake_news', 'real_news', 'sources', 'statistics', 'timeline', 'company_details', 'general'],
            "description": "Specific query type"
        },
        "filters": {
            "type": "object",
            "properties": {
                "verdict": {"type": "string"},
                "limit": {"type": "integer"},
                "days_back": {"type": "integer"}
            }
        }
    },
    "required": ['action', 'reasoning', 'query_type']
}

async def transcribe_audio(base64_audio: str, mime_type: str = "audio/webm") -> str:
    """Transcribe audio to text"""
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

async def query_routing_agent(user_query: str, company_name: str) -> Dict[str, Any]:
    """AI agent to understand and route data queries"""
    try:
        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"User asks about {company_name}: '{user_query}'. Determine what data they want to query.",
            config={
                "system_instruction": f"You are a data query router for {company_name}'s news database. Route queries to appropriate data endpoints.",
                "response_mime_type": "application/json",
                "response_schema": query_agent_schema,
                "temperature": 0.2
            }
        )
        
        return json.loads(response.text or "{}")
    except Exception as error:
        print(f"Query Routing Error: {error}")
        return {"action": "GENERAL_RESPONSE", "reasoning": "Error", "query_type": "general"}

async def fetch_company_data(company_id: str) -> Dict[str, Any]:
    """Fetch company information from database"""
    try:
        company = companies_collection.find_one({"_id": ObjectId(company_id)})
        if not company:
            return None
        
        # Convert ObjectId to string for JSON serialization
        company['_id'] = str(company['_id'])
        return company
    except Exception as e:
        print(f"Error fetching company: {e}")
        return None

async def fetch_news_tracking(company_id: str, filters: Dict = None) -> List[Dict[str, Any]]:
    """Fetch news tracking data with filters"""
    try:
        # First try to find by company_id as ObjectId
        query = {"company_id": ObjectId(company_id)}
        tracking_records = list(news_tracking_collection.find(query).sort('timestamp', -1))
        
        # If no results, try finding by company_id as string
        if not tracking_records:
            query = {"company_id": company_id}
            tracking_records = list(news_tracking_collection.find(query).sort('timestamp', -1))
        
        print(f"🔍 Found {len(tracking_records)} tracking records for company {company_id}")
        
        # Apply filters if provided
        if filters and tracking_records:
            if 'verdict' in filters:
                filtered_records = []
                for record in tracking_records:
                    filtered_news = [n for n in record.get('verified_news', []) 
                                   if n.get('verification', {}).get('verdict') == filters['verdict']]
                    if filtered_news:
                        record['verified_news'] = filtered_news
                        filtered_records.append(record)
                tracking_records = filtered_records
            
            if 'days_back' in filters:
                from_date = datetime.utcnow() - timedelta(days=filters['days_back'])
                tracking_records = [r for r in tracking_records 
                                  if r.get('timestamp', datetime.min) >= from_date]
        
        # Convert ObjectIds to strings
        for record in tracking_records:
            record['_id'] = str(record['_id'])
            if isinstance(record.get('company_id'), ObjectId):
                record['company_id'] = str(record['company_id'])
        
        return tracking_records
    except Exception as e:
        print(f"Error fetching news tracking: {e}")
        import traceback
        traceback.print_exc()
        return []

async def analyze_data_with_ai(user_query: str, data: Dict[str, Any], company_name: str) -> str:
    """Use AI to analyze and respond to user queries about data"""
    try:
        # Extract key statistics for clear context
        news_data = data.get('news_data', {})
        stats = news_data.get('statistics', {})
        sources = news_data.get('sources_breakdown', {})
        
        # Build a focused data summary
        data_summary = {
            "company": data.get('company', {}),
            "statistics": {
                "total_news_items": stats.get('total_verified', 0),
                "real_news_count": stats.get('real_count', 0),
                "fake_news_count": stats.get('fake_count', 0),
                "uncertain_news_count": stats.get('uncertain_count', 0)
            },
            "sources_breakdown": sources,
            "timestamp": news_data.get('timestamp'),
            "sample_news_items": news_data.get('verified_news_sample', [])[:5],  # Only show 5 samples
            "note": f"Statistics are based on ALL {stats.get('total_verified', 0)} news items. Sample shows first 5 items only."
        }
        
        data_context = json.dumps(data_summary, indent=2, default=str)[:4000]
        
        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"""You are a data analyst assistant for {company_name}. 

USER QUESTION: {user_query}

AVAILABLE DATA AND STATISTICS:
{data_context}

IMPORTANT: The statistics (real_news_count, fake_news_count, etc.) represent ALL news items in the database, NOT just the sample shown.

Provide a clear, conversational answer based on the statistics. Include:
- Direct answer with ACTUAL numbers from statistics
- Key insights from the data
- Reference the total count of items analyzed
- Use bullet points for clarity
- Be conversational but professional

Format your response in markdown.""",
            config={"temperature": 0.3}
        )
        
        return response.text or "I couldn't analyze the data."
    except Exception as error:
        print(f"AI Analysis Error: {error}")
        return "I encountered an error analyzing the data."

async def process_data_query(company_id: str, user_query: str) -> Dict[str, Any]:
    """Main function to process data queries"""
    try:
        print(f"\n{'='*60}")
        print(f"🔍 Processing query for company_id: {company_id}")
        print(f"📝 User query: {user_query}")
        
        # Fetch company info
        company = await fetch_company_data(company_id)
        if not company:
            print(f"❌ Company not found with ID: {company_id}")
            return {
                "success": False,
                "message": "Company not found",
                "response": "I couldn't find information about this company in the database."
            }
        
        company_name = company.get('name', 'your company')
        print(f"✅ Found company: {company_name}")
        
        # Route the query
        routing = await query_routing_agent(user_query, company_name)
        print(f"🔍 Query routing: {routing['action']} - {routing['query_type']}")
        
        # Fetch relevant data based on routing
        data_to_analyze = {
            "company": {
                "name": company.get('name'),
                "email": company.get('email'),
                "industry": company.get('industry'),
                "size": company.get('size')
            }
        }
        
        # Always try to fetch news tracking data - don't apply filters initially
        tracking_records = await fetch_news_tracking(company_id, None)
        
        # After fetching, apply any specific filters based on routing
        if tracking_records and len(tracking_records) > 0:
            print(f"📊 Found {len(tracking_records)} tracking records")
            latest_tracking = tracking_records[0]
            verified_news = latest_tracking.get('verified_news', [])
            print(f"📰 Total verified news items: {len(verified_news)}")
            
            # Calculate statistics
            real_count = sum(1 for n in verified_news if n.get('verification', {}).get('verdict') == 'REAL')
            fake_count = sum(1 for n in verified_news if n.get('verification', {}).get('verdict') == 'FAKE')
            uncertain_count = sum(1 for n in verified_news if n.get('verification', {}).get('verdict') == 'UNCERTAIN')
            
            print(f"✅ Real: {real_count}, ❌ Fake: {fake_count}, ⚠️ Uncertain: {uncertain_count}")
            
            # Extract sources from all news items
            sources_list = {}
            for news in verified_news:
                source = news.get('source') or news.get('news_source', 'Unknown')
                verdict = news.get('verification', {}).get('verdict', 'UNCERTAIN')
                if source not in sources_list:
                    sources_list[source] = {'real': 0, 'fake': 0, 'uncertain': 0, 'total': 0}
                sources_list[source][verdict.lower()] = sources_list[source].get(verdict.lower(), 0) + 1
                sources_list[source]['total'] += 1
            
            data_to_analyze['news_data'] = {
                "total_news": len(verified_news),
                "verified_news_sample": verified_news[:10],  # Show only 10 sample items to AI
                "timestamp": latest_tracking.get('timestamp'),
                "statistics": {
                    "real_count": real_count,
                    "fake_count": fake_count,
                    "uncertain_count": uncertain_count,
                    "total_verified": len(verified_news)
                },
                "sources_breakdown": sources_list,
                "all_fetches_count": len(tracking_records),
                "note": f"Showing 10 sample news items out of {len(verified_news)} total items"
            }
        else:
            print("⚠️ No news tracking data found")
            data_to_analyze['news_data'] = {
                "total_news": 0,
                "verified_news": [],
                "statistics": {
                    "real_count": 0,
                    "fake_count": 0,
                    "uncertain_count": 0
                },
                "message": "No news data has been analyzed yet. Please run a news analysis first from the dashboard."
            }
        
        # Use AI to generate response
        response_text = await analyze_data_with_ai(user_query, data_to_analyze, company_name)
        
        print(f"✨ Generated response (first 100 chars): {response_text[:100]}...")
        print(f"{'='*60}\n")
        
        return {
            "success": True,
            "message": "Query processed successfully",
            "response": response_text,
            "data_summary": {
                "company_name": company_name,
                "query_type": routing['query_type'],
                "data_points": data_to_analyze.get('news_data', {}).get('statistics', {}).get('total_verified', 0),
                "real_count": data_to_analyze.get('news_data', {}).get('statistics', {}).get('real_count', 0),
                "fake_count": data_to_analyze.get('news_data', {}).get('statistics', {}).get('fake_count', 0),
                "uncertain_count": data_to_analyze.get('news_data', {}).get('statistics', {}).get('uncertain_count', 0)
            }
        }
        
    except Exception as error:
        print(f"❌ Query Processing Error: {error}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "message": str(error),
            "response": f"I encountered an error processing your query: {error}"
        }

# ==================== API ENDPOINTS ====================

@app.post("/api/data-query")
async def api_data_query(request: QueryRequest):
    """Process text-based data queries"""
    result = await process_data_query(request.companyId, request.userQuery)
    return result

@app.post("/api/transcribe")
async def api_transcribe(request: TranscribeRequest):
    """Transcribe voice to text"""
    text = await transcribe_audio(request.base64Audio, request.mimeType)
    return {"text": text}

@app.get("/api/company/{company_id}/summary")
async def api_company_summary(company_id: str):
    """Get quick summary of company data"""
    try:
        company = await fetch_company_data(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        tracking_records = await fetch_news_tracking(company_id)
        
        summary = {
            "company_name": company.get('name'),
            "total_analyses": len(tracking_records),
            "latest_analysis": None
        }
        
        if tracking_records:
            latest = tracking_records[0]
            summary['latest_analysis'] = {
                "timestamp": latest.get('timestamp'),
                "total_news": len(latest.get('verified_news', [])),
                "statistics": {
                    "real": sum(1 for n in latest.get('verified_news', []) 
                               if n.get('verification', {}).get('verdict') == 'REAL'),
                    "fake": sum(1 for n in latest.get('verified_news', []) 
                               if n.get('verification', {}).get('verdict') == 'FAKE'),
                    "uncertain": sum(1 for n in latest.get('verified_news', []) 
                                    if n.get('verification', {}).get('verdict') == 'UNCERTAIN')
                }
            }
        
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Company Data Query API",
        "version": "1.0",
        "endpoints": ["/api/data-query", "/api/transcribe", "/api/company/{id}/summary"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
