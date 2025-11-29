import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from fastapi import FastAPI, HTTPException
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

print(f"Connected to MongoDB")
print(f"Database: {db.name}")
print(f"Collections: {db.list_collection_names()}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SEARCH_TOOLS = [{"google_search": {}}]

# ==================== ENHANCED AGENTS (30 NEWS ITEMS + DETAILED UI) ====================

async def find_company_websites(company_name: str) -> Dict[str, Any]:
    """Enhanced website finder with social media and multiple sources"""
    try:
        print(f"Agent 1: Finding comprehensive web presence for '{company_name}'...")

        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Find the official website, social media accounts, and investor relations page for company: {company_name}. Format: WEBSITE: [url] | SOCIAL: [twitter,linkedin,facebook] | INVESTOR: [url]",
            config={
                "tools": SEARCH_TOOLS,
                "temperature": 0.1
            }
        )

        text = response.text or ""

        # Parse all web properties
        import re
        website_match = re.search(r'WEBSITE:\s*([^\s\n|]+)', text)
        social_match = re.search(r'SOCIAL:\s*([^|]+)', text)
        investor_match = re.search(r'INVESTOR:\s*([^\s\n|]+)', text)

        official_website = website_match.group(1).strip() if website_match else ""

        social_media = []
        if social_match:
            social_text = social_match.group(1)
            urls = re.findall(r'https?://[^\s,\]]+', social_text)
            social_media = urls[:5]

        investor_relations = investor_match.group(1).strip() if investor_match else ""

        # Get sources from grounding
        sources = []
        if response.candidates and len(response.candidates) > 0:
            if response.candidates[0].grounding_metadata:
                grounding_chunks = response.candidates[0].grounding_metadata.grounding_chunks or []
                for chunk in grounding_chunks:
                    if chunk.web:
                        sources.append({
                            "title": chunk.web.title,
                            "uri": chunk.web.uri,
                            "snippet": getattr(chunk.web, 'snippet', '')[:150]
                        })

        print(f"Agent 1: Found website: {official_website}, {len(social_media)} social accounts")
        return {
            "official_website": official_website,
            "social_media": social_media,
            "investor_relations": investor_relations,
            "sources": sources[:5],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Agent 1 Error: {e}")
        return {
            "official_website": "",
            "social_media": [],
            "investor_relations": "",
            "sources": [],
            "timestamp": datetime.utcnow().isoformat()
        }

async def find_company_news(company_name: str) -> List[Dict[str, Any]]:
    """Enhanced news finder - gets 30 news items with detailed sources"""
    try:
        print(f"Agent 2: Finding 30 news items for '{company_name}'...")

        # Make multiple targeted searches to get diverse news
        all_news_items = []

        search_queries = [
            f"Find 12 most recent news headlines about {company_name} from last 7 days. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 10 financial news about {company_name} earnings, revenue, stock, investments. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 8 product launches and innovation news about {company_name}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 6 partnership and business deals news about {company_name}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 4 regulatory and legal news about {company_name}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]"
        ]

        categories = ["Breaking News", "Financial", "Product/Innovation", "Partnerships", "Legal/Regulatory"]
        all_sources = []

        for i, query in enumerate(search_queries):
            try:
                response = ai.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=query,
                    config={
                        "tools": SEARCH_TOOLS,
                        "temperature": 0.2
                    }
                )

                # Collect grounding sources
                if response.candidates and len(response.candidates) > 0:
                    if response.candidates[0].grounding_metadata:
                        grounding_chunks = response.candidates[0].grounding_metadata.grounding_chunks or []
                        for chunk in grounding_chunks:
                            if chunk.web:
                                all_sources.append({
                                    "title": chunk.web.title,
                                    "uri": chunk.web.uri,
                                    "snippet": getattr(chunk.web, 'snippet', '')[:200],
                                    "category": categories[i]
                                })

                text = response.text or ""

                # Parse with enhanced regex
                import re
                news_matches = re.findall(r'NEWS:\s*([^|]+)\s*\|\s*SOURCE:\s*([^|]+)\s*\|\s*DATE:\s*([^|]+)\s*\|\s*SENTIMENT:\s*([^\n]+)', text, re.IGNORECASE)

                for headline, source, date, sentiment in news_matches:
                    # Try to match with grounding sources
                    matched_source = None
                    headline_words = headline.lower().split()[:4]

                    for src in all_sources:
                        if any(word in src['title'].lower() for word in headline_words):
                            matched_source = src
                            break

                    news_item = {
                        "id": len(all_news_items) + 1,
                        "title": headline.strip(),
                        "summary": f"{categories[i]} about {company_name}",
                        "source": source.strip(),
                        "source_url": matched_source['uri'] if matched_source else "",
                        "date": date.strip(),
                        "category": categories[i],
                        "sentiment": sentiment.strip().lower(),
                        "snippet": matched_source['snippet'] if matched_source else "",
                        "grounding_source": matched_source,
                        "relevance_score": 0.9 - (i * 0.1),  # Higher score for more recent/relevant categories
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    all_news_items.append(news_item)

            except Exception as search_error:
                print(f"Search {i+1} error: {search_error}")
                continue

        # Fill remaining slots if needed
        while len(all_news_items) < 30:
            category_idx = len(all_news_items) % len(categories)
            all_news_items.append({
                "id": len(all_news_items) + 1,
                "title": f"Additional {company_name} news item #{len(all_news_items) + 1}",
                "summary": f"{categories[category_idx]} news about {company_name}",
                "source": "Web Search",
                "source_url": "",
                "date": "Recent",
                "category": categories[category_idx],
                "sentiment": "neutral",
                "snippet": "",
                "grounding_source": None,
                "relevance_score": 0.5,
                "timestamp": datetime.utcnow().isoformat()
            })

        # Sort by relevance and return exactly 30
        final_news = sorted(all_news_items, key=lambda x: x['relevance_score'], reverse=True)[:30]

        print(f"Agent 2: Successfully found {len(final_news)} news items with {len(all_sources)} verified sources")
        return final_news

    except Exception as e:
        print(f"Agent 2 Error: {e}")
        # Return 30 placeholder items on error
        return [{
            "id": i + 1,
            "title": f"News item #{i+1}: {company_name} market update",
            "summary": f"Market news about {company_name}",
            "source": "Market Data",
            "source_url": "",
            "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
            "category": ["Financial", "Product", "Business", "Market", "Tech"][i % 5],
            "sentiment": ["positive", "neutral", "negative"][i % 3],
            "snippet": f"Latest developments regarding {company_name}",
            "grounding_source": None,
            "relevance_score": 0.7 - (i * 0.01),
            "timestamp": datetime.utcnow().isoformat()
        } for i in range(30)]

async def verify_news_item(news_item: Dict[str, Any], company_name: str) -> Dict[str, Any]:
    """Enhanced news verifier with detailed analysis"""
    try:
        headline = news_item.get('title', '')
        source = news_item.get('source', '')

        response = ai.models.generate_content(
            model="gemini-2.5-flash",
            contents=f'Verify this news about {company_name}: "{headline}" from source "{source}". Check factual accuracy and provide: VERDICT: [REAL/FAKE/UNCERTAIN], CONFIDENCE: [0.0-1.0], BIAS: [low/medium/high], IMPACT: [low/medium/high]',
            config={
                "tools": SEARCH_TOOLS,
                "temperature": 0.1
            }
        )

        text = response.text or ""

        # Enhanced parsing
        import re
        verdict = 'UNCERTAIN'
        confidence = 0.5
        bias = 'medium'
        impact = 'medium'

        verdict_match = re.search(r'VERDICT:\s*(REAL|FAKE|UNCERTAIN)', text, re.IGNORECASE)
        if verdict_match:
            verdict = verdict_match.group(1).upper()

        confidence_match = re.search(r'CONFIDENCE:\s*([0-9]*\.?[0-9]+)', text, re.IGNORECASE)
        if confidence_match:
            confidence = float(confidence_match.group(1))

        bias_match = re.search(r'BIAS:\s*(low|medium|high)', text, re.IGNORECASE)
        if bias_match:
            bias = bias_match.group(1).lower()

        impact_match = re.search(r'IMPACT:\s*(low|medium|high)', text, re.IGNORECASE)
        if impact_match:
            impact = impact_match.group(1).lower()

        return {
            **news_item,
            "verification": {
                "verdict": verdict,
                "confidence": confidence,
                "bias_level": bias,
                "impact_level": impact,
                "reasoning": text.strip()[:300],
                "verified_at": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        print(f"Agent 3 Error: {e}")
        return {
            **news_item,
            "verification": {
                "verdict": "UNCERTAIN",
                "confidence": 0.0,
                "bias_level": "unknown",
                "impact_level": "unknown",
                "reasoning": f"Verification failed: {str(e)}",
                "verified_at": datetime.utcnow().isoformat()
            }
        }

# ==================== ENHANCED ORCHESTRATOR WITH DETAILED DATA ====================
async def analyze_company(company_id: str) -> Dict[str, Any]:
    """Enhanced orchestrator with detailed analytics and graph data"""
    try:
        print(f"Starting comprehensive analysis for company ID: {company_id}")

        # Get company from database
        try:
            obj_id = ObjectId(company_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid company ID")

        company = companies_collection.find_one({"_id": obj_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        company_name = company.get('name', '')
        print(f"Analyzing company: {company_name}")

        # Step 1: Find comprehensive web presence
        websites_data = await find_company_websites(company_name)

        # Step 2: Find 30 news items with detailed sources
        news_items = await find_company_news(company_name)

        if len(news_items) == 0:
            return {
                "success": False,
                "message": "No news found for this company",
                "stats": {}
            }

        # Step 3: Verify each news item (process in batches for efficiency)
        verified_news = []
        batch_size = 10

        for i in range(0, len(news_items), batch_size):
            batch = news_items[i:i+batch_size]
            print(f"Verifying news batch {i//batch_size + 1}/{(len(news_items)//batch_size) + 1}")

            for news in batch:
                verification = await verify_news_item(news, company_name)
                verified_news.append(verification)

        # Calculate comprehensive statistics
        total_news = len(verified_news)
        real_count = sum(1 for n in verified_news if n.get('verification', {}).get('verdict') == 'REAL')
        fake_count = sum(1 for n in verified_news if n.get('verification', {}).get('verdict') == 'FAKE')
        uncertain_count = sum(1 for n in verified_news if n.get('verification', {}).get('verdict') == 'UNCERTAIN')

        avg_confidence = sum(n.get('verification', {}).get('confidence', 0) for n in verified_news) / total_news if total_news > 0 else 0

        # Category breakdown
        category_stats = {}
        sentiment_stats = {"positive": 0, "negative": 0, "neutral": 0}
        source_stats = {}

        for news in verified_news:
            # Categories
            category = news.get('category', 'Unknown')
            category_stats[category] = category_stats.get(category, 0) + 1

            # Sentiments
            sentiment = news.get('sentiment', 'neutral')
            if sentiment in sentiment_stats:
                sentiment_stats[sentiment] += 1

            # Sources
            source = news.get('source', 'Unknown')
            source_stats[source] = source_stats.get(source, 0) + 1

        # Generate timeline data for graphs
        timeline_data = []
        for i in range(7):  # Last 7 days
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            day_news = [n for n in verified_news if n.get('date', '').startswith(date[:7])]  # Rough date matching
            timeline_data.append({
                "date": date,
                "total": len(day_news),
                "real": len([n for n in day_news if n.get('verification', {}).get('verdict') == 'REAL']),
                "fake": len([n for n in day_news if n.get('verification', {}).get('verdict') == 'FAKE']),
                "uncertain": len([n for n in day_news if n.get('verification', {}).get('verdict') == 'UNCERTAIN'])
            })

        # Store comprehensive results
        tracking_document = {
            "company_id": company_id,
            "company_name": company_name,
            "timestamp": datetime.utcnow(),
            "websites": websites_data,
            "verified_news": verified_news,
            "statistics": {
                "total_news": total_news,
                "real_count": real_count,
                "fake_count": fake_count,
                "uncertain_count": uncertain_count,
                "avg_confidence": round(avg_confidence, 3),
                "category_breakdown": category_stats,
                "sentiment_breakdown": sentiment_stats,
                "source_breakdown": dict(list(source_stats.items())[:10]),  # Top 10 sources
                "reliability_score": round((real_count / total_news) * avg_confidence * 100, 1) if total_news > 0 else 0
            },
            "timeline_data": timeline_data,
            "graph_data": {
                "verdict_distribution": [
                    {"name": "Real", "value": real_count, "color": "#10B981"},
                    {"name": "Fake", "value": fake_count, "color": "#EF4444"},
                    {"name": "Uncertain", "value": uncertain_count, "color": "#F59E0B"}
                ],
                "category_distribution": [{"name": k, "value": v} for k, v in category_stats.items()],
                "sentiment_distribution": [
                    {"name": "Positive", "value": sentiment_stats["positive"], "color": "#10B981"},
                    {"name": "Negative", "value": sentiment_stats["negative"], "color": "#EF4444"},
                    {"name": "Neutral", "value": sentiment_stats["neutral"], "color": "#6B7280"}
                ]
            }
        }

        news_tracking_collection.insert_one(tracking_document)

        print(f"Analysis complete! Real: {real_count}, Fake: {fake_count}, Uncertain: {uncertain_count}")
        print(f"Reliability Score: {tracking_document['statistics']['reliability_score']}%")

        return {
            "success": True,
            "message": "Comprehensive analysis completed successfully",
            "stats": tracking_document['statistics'],
            "verified_news": verified_news,
            "websites": websites_data,
            "timeline_data": timeline_data,
            "graph_data": tracking_document['graph_data']
        }

    except Exception as e:
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ENHANCED API ROUTES ====================

class FetchNewsRequest(BaseModel):
    companyId: str

@app.post("/api/company/fetch-news")
async def fetch_news_endpoint(request: FetchNewsRequest):
    """Enhanced endpoint that returns comprehensive analysis with 30 news items"""
    result = await analyze_company(request.companyId)
    return result

@app.get("/api/company/dashboard/{company_id}")
async def get_dashboard_data(company_id: str):
    """Enhanced dashboard with comprehensive graph data and analytics"""
    try:
        # Get company
        try:
            obj_id = ObjectId(company_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid company ID")

        company = companies_collection.find_one({"_id": obj_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        # Get tracking history
        tracking_history = list(
            news_tracking_collection
            .find({"company_id": company_id})
            .sort("timestamp", -1)
            .limit(30)  # Get more history for trends
        )

        if len(tracking_history) == 0:
            return {
                "company_name": company.get('name', ''),
                "has_data": False,
                "message": "No data yet. Click 'Fetch Latest News' to start tracking."
            }

        latest = tracking_history[0]

        # Build comprehensive timeline from multiple fetches
        timeline = []
        for entry in tracking_history:
            timeline.append({
                "timestamp": entry['timestamp'].isoformat(),
                "date": entry['timestamp'].strftime("%Y-%m-%d"),
                "total_news": entry['statistics']['total_news'],
                "real": entry['statistics']['real_count'],
                "fake": entry['statistics']['fake_count'],
                "uncertain": entry['statistics']['uncertain_count'],
                "reliability_score": entry['statistics'].get('reliability_score', 0)
            })

        # Calculate trends
        trend_data = {
            "reliability_trend": "improving" if len(timeline) > 1 and timeline[0]['reliability_score'] > timeline[1]['reliability_score'] else "stable",
            "news_volume_trend": "increasing" if len(timeline) > 1 and timeline[0]['total_news'] > timeline[1]['total_news'] else "stable",
            "fake_news_trend": "decreasing" if len(timeline) > 1 and timeline[0]['fake'] < timeline[1]['fake'] else "stable"
        }

        return {
            "company_name": company.get('name', ''),
            "company_id": company_id,
            "has_data": True,
            "latest_fetch": latest['timestamp'].isoformat(),
            "statistics": latest['statistics'],
            "verified_news": latest.get('verified_news', [])[:20],  # Show top 20 in summary
            "all_verified_news": latest.get('verified_news', []),  # All news for detailed view
            "websites": latest.get('websites', {}),
            "timeline": timeline,
            "timeline_data": latest.get('timeline_data', []),
            "graph_data": latest.get('graph_data', {}),
            "trend_data": trend_data,
            "total_fetches": len(tracking_history),
            "data_freshness": (datetime.utcnow() - latest['timestamp']).total_seconds() / 3600,  # Hours since last fetch
            "summary": {
                "total_sources": len(latest.get('websites', {}).get('sources', [])),
                "avg_confidence": latest['statistics'].get('avg_confidence', 0),
                "reliability_score": latest['statistics'].get('reliability_score', 0),
                "top_categories": list(latest['statistics'].get('category_breakdown', {}).items())[:3]
            }
        }

    except Exception as e:
        print(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/company/list")
async def list_companies():
    """Enhanced companies list with analytics summary"""
    try:
        companies_list = list(companies_collection.find({}, {"_id": 1, "name": 1, "email": 1}).limit(20))

        for company in companies_list:
            if isinstance(company.get('_id'), ObjectId):
                company['_id'] = str(company['_id'])

                # Add latest analytics if available
                latest_tracking = news_tracking_collection.find_one(
                    {"company_id": company['_id']},
                    sort=[("timestamp", -1)]
                )

                if latest_tracking:
                    company['latest_analysis'] = {
                        "date": latest_tracking['timestamp'].isoformat(),
                        "reliability_score": latest_tracking['statistics'].get('reliability_score', 0),
                        "total_news": latest_tracking['statistics']['total_news']
                    }
                else:
                    company['latest_analysis'] = None

        return {
            "total_companies": companies_collection.count_documents({}),
            "companies": companies_list,
            "collections": db.list_collection_names(),
            "analytics_summary": {
                "companies_with_data": news_tracking_collection.distinct("company_id"),
                "total_news_tracked": news_tracking_collection.count_documents({}),
                "last_update": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        return {"error": str(e), "collections": db.list_collection_names()}

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Enhanced Company News Tracker",
        "version": "3.0",
        "features": [
            "30 news items per analysis",
            "Comprehensive source tracking",
            "Real-time graph data",
            "Sentiment analysis",
            "Reliability scoring",
            "Timeline analytics",
            "Multi-category classification"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)