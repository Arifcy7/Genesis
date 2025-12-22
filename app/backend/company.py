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

# ==================== ENHANCED AGENTS (DETAILED UI, NO NEWS CAP) ====================

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

async def find_company_news(company_name: str, official_website: str = "", analysis_period: str = "today") -> List[Dict[str, Any]]:
    """Enhanced news finder - returns all available news for the selected period (no 30-item cap)"""
    try:
        print(f"Agent 2: Finding news items for '{company_name}' (Period: {analysis_period})...")
        if official_website:
            print(f"Using official website context: {official_website}")

        # Calculate date range based on analysis period (using local time)
        from datetime import datetime as dt
        
        # Get current time in local timezone
        today = dt.now()
        if analysis_period == 'today':
            date_filter = "published today or in the last 24 hours"
            days_back = 1
        elif analysis_period == 'week':
            date_filter = "published in the last 7 days"
            days_back = 7
        elif analysis_period == 'month':
            date_filter = "published in the last 30 days"
            days_back = 30
        elif analysis_period == 'year':
            date_filter = "published in the last 365 days or this year"
            days_back = 365
        else:
            date_filter = "published today or in the last 24 hours"
            days_back = 1
        
        print(f"Date filter: {date_filter} (Current time: {today})")

        # Make multiple targeted searches to get diverse news
        all_news_items = []

        # Enhanced search queries with official website context and date filter
        website_context = f" site:{official_website.replace('https://', '').replace('http://', '').split('/')[0]}" if official_website else ""
        
        search_queries = [
            f"Find 12 most recent news headlines about {company_name} {date_filter}{website_context}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 10 financial news about {company_name} earnings, revenue, stock, investments {date_filter}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 8 product launches and innovation news about {company_name} {date_filter}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 6 partnership and business deals news about {company_name} {date_filter}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]",
            f"Find 4 regulatory and legal news about {company_name} {date_filter}. Format: NEWS: [headline] | SOURCE: [source] | DATE: [date] | SENTIMENT: [positive/negative/neutral]"
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

        # Apply strict server-side date filtering based on analysis period
        from datetime import datetime as dt
        
        today = dt.now().date()
        filtered_news = []
        
        for news in all_news_items:
            try:
                news_date_str = news.get('date', '')
                if not news_date_str:
                    continue
                    
                # Try to parse date (handle various formats)
                news_date = None
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y', '%Y/%m/%d']:
                    try:
                        news_date = dt.strptime(news_date_str.strip(), fmt).date()
                        break
                    except:
                        continue
                
                if not news_date:
                    # If we can't parse the date, skip this item for strict filtering
                    continue
                
                # Calculate days difference
                days_diff = (today - news_date).days
                
                # Filter based on period
                if analysis_period == 'today' and days_diff == 0:
                    filtered_news.append(news)
                elif analysis_period == 'week' and days_diff <= 7:
                    filtered_news.append(news)
                elif analysis_period == 'month' and days_diff <= 30:
                    filtered_news.append(news)
                elif analysis_period == 'year' and days_diff <= 365:
                    filtered_news.append(news)
                    
            except Exception as e:
                print(f"Date parsing error for news item: {e}")
                continue
        
        # Sort by relevance and return all filtered items
        final_news = sorted(filtered_news, key=lambda x: x['relevance_score'], reverse=True)

        print(f"Agent 2: Successfully found {len(final_news)} news items (after strict date filtering) with {len(all_sources)} verified sources")
        return final_news

    except Exception as e:
        print(f"Agent 2 Error: {e}")
        # Return empty list on error to avoid misleading caps
        return []

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
async def analyze_company(company_id: str, analysis_period: str = "today", competitors: List[str] = []) -> Dict[str, Any]:
    """Enhanced orchestrator with detailed analytics and graph data"""
    try:
        print(f"Starting comprehensive analysis for company ID: {company_id} (Period: {analysis_period})")
        if competitors:
            print(f"Including competitor analysis: {competitors}")

        # Get company from database
        try:
            obj_id = ObjectId(company_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid company ID")

        company = companies_collection.find_one({"_id": obj_id})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        company_name = company.get('name', '')
        official_website = company.get('officialWebsite', '')
        print(f"Analyzing company: {company_name}")
        print(f"Using official website: {official_website}")

        # Step 1: Use stored website data instead of searching
        websites_data = {
            "official_website": official_website,
            "social_media": [],
            "investor_relations": "",
            "sources": [
                {
                    "title": f"{company_name} Official Website",
                    "uri": official_website,
                    "snippet": f"Official website for {company_name}"
                }
            ]
        }

        # Step 2: Find news items (no cap) with detailed sources
        news_items = await find_company_news(company_name, official_website, analysis_period)

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
        
        # NEW: Topic-wise sentiment tracking
        topic_sentiment = {}
        
        # NEW: Date-wise tracking for today and this week
        today = datetime.now().date()
        today_news = []
        week_news = []
        
        # NEW: Track negative news by date for spike detection
        negative_by_date = {}
        
        # NEW: Fake news tracking
        fake_news_list = []

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
            
            # NEW: Topic-wise sentiment
            if category not in topic_sentiment:
                topic_sentiment[category] = {"positive": 0, "negative": 0, "neutral": 0}
            if sentiment in topic_sentiment[category]:
                topic_sentiment[category][sentiment] += 1
            
            # NEW: Parse date for today/week filtering
            try:
                news_date_str = news.get('date', '')
                if news_date_str:
                    # Try to parse date
                    news_date = datetime.strptime(news_date_str, "%Y-%m-%d").date()
                    
                    # Check if today
                    if news_date == today:
                        today_news.append(news)
                    
                    # Check if this week (last 7 days)
                    days_diff = (today - news_date).days
                    if days_diff <= 7:
                        week_news.append(news)
                    
                    # Track negative news by date
                    if sentiment == 'negative':
                        date_key = news_date_str
                        negative_by_date[date_key] = negative_by_date.get(date_key, 0) + 1
            except:
                pass
            
            # NEW: Track fake news
            if news.get('verification', {}).get('verdict') == 'FAKE':
                fake_news_list.append({
                    "title": news.get('title', ''),
                    "source": news.get('source', ''),
                    "date": news.get('date', ''),
                    "confidence": news.get('verification', {}).get('confidence', 0),
                    "reasoning": news.get('verification', {}).get('reasoning', '')[:200]
                })
        
        # NEW: Calculate today's mentions
        mentions_today = len(today_news)
        mentions_week = len(week_news)
        
        # NEW: Calculate sentiment for today
        today_positive = sum(1 for n in today_news if n.get('sentiment') == 'positive')
        today_negative = sum(1 for n in today_news if n.get('sentiment') == 'negative')
        today_neutral = sum(1 for n in today_news if n.get('sentiment') == 'neutral')
        
        # NEW: Crisis Alert Calculation
        crisis_risk = "LOW"
        crisis_score = 0
        
        if mentions_today > 0:
            negative_ratio = today_negative / mentions_today
            if negative_ratio > 0.6 and mentions_today >= 5:
                crisis_risk = "HIGH"
                crisis_score = 85
            elif negative_ratio > 0.4 or mentions_today >= 10:
                crisis_risk = "MEDIUM"
                crisis_score = 50
            else:
                crisis_risk = "LOW"
                crisis_score = 15
        
        # Add fake news factor to crisis
        if fake_count > 5:
            crisis_score = min(100, crisis_score + 20)
            if crisis_score >= 70:
                crisis_risk = "HIGH"
        
        # NEW: Negative news spike detection
        sorted_dates = sorted(negative_by_date.items())
        negative_spike_detected = False
        spike_info = {}
        
        if len(sorted_dates) >= 2:
            recent_neg = negative_by_date.get(sorted_dates[-1][0], 0)
            prev_neg = negative_by_date.get(sorted_dates[-2][0], 0) if len(sorted_dates) > 1 else 0
            
            if prev_neg > 0:
                spike_percentage = ((recent_neg - prev_neg) / prev_neg) * 100
                if spike_percentage > 50:
                    negative_spike_detected = True
                    spike_info = {
                        "detected": True,
                        "increase": f"+{spike_percentage:.0f}%",
                        "from": prev_neg,
                        "to": recent_neg
                    }

        # Generate timeline data for graphs
        timeline_data = []
        sentiment_by_day = []
        
        for i in range(7):  # Last 7 days
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            day_news = [n for n in verified_news if n.get('date', '').startswith(date)]
            
            day_positive = len([n for n in day_news if n.get('sentiment') == 'positive'])
            day_negative = len([n for n in day_news if n.get('sentiment') == 'negative'])
            day_neutral = len([n for n in day_news if n.get('sentiment') == 'neutral'])
            
            timeline_data.append({
                "date": date,
                "total": len(day_news),
                "real": len([n for n in day_news if n.get('verification', {}).get('verdict') == 'REAL']),
                "fake": len([n for n in day_news if n.get('verification', {}).get('verdict') == 'FAKE']),
                "uncertain": len([n for n in day_news if n.get('verification', {}).get('verdict') == 'UNCERTAIN'])
            })
            
            sentiment_by_day.append({
                "date": date,
                "positive": day_positive,
                "negative": day_negative,
                "neutral": day_neutral
            })
        
        # NEW: Source-wise sentiment breakdown
        source_sentiment = {}
        for news in verified_news:
            source = news.get('source', 'Unknown')
            sentiment = news.get('sentiment', 'neutral')
            
            if source not in source_sentiment:
                source_sentiment[source] = {"positive": 0, "negative": 0, "neutral": 0}
            if sentiment in source_sentiment[source]:
                source_sentiment[source][sentiment] += 1
        
        # Overall sentiment score (0-100, where 50 is neutral)
        overall_sentiment_score = 50
        if total_news > 0:
            positive_weight = sentiment_stats["positive"] * 100
            negative_weight = sentiment_stats["negative"] * 0
            neutral_weight = sentiment_stats["neutral"] * 50
            overall_sentiment_score = round((positive_weight + negative_weight + neutral_weight) / total_news, 1)

        # NEW: Competitor Analysis
        competitor_analysis = []
        if competitors:
            for competitor_name in competitors[:3]:  # Limit to 3 competitors
                try:
                    print(f"Analyzing competitor: {competitor_name}")
                    comp_news = await find_company_news(competitor_name, "", analysis_period)
                    
                    if len(comp_news) > 0:
                        # Quick sentiment calculation
                        comp_positive = sum(1 for n in comp_news if n.get('sentiment') == 'positive')
                        comp_negative = sum(1 for n in comp_news if n.get('sentiment') == 'negative')
                        comp_neutral = sum(1 for n in comp_news if n.get('sentiment') == 'neutral')
                        comp_total = len(comp_news)
                        
                        comp_sentiment_score = 50
                        if comp_total > 0:
                            comp_sentiment_score = round((comp_positive * 100 + comp_neutral * 50) / comp_total, 1)
                        
                        # Crisis level for competitor
                        comp_crisis = "LOW"
                        if comp_total > 0:
                            neg_ratio = comp_negative / comp_total
                            if neg_ratio > 0.6:
                                comp_crisis = "HIGH"
                            elif neg_ratio > 0.4:
                                comp_crisis = "MEDIUM"
                        
                        competitor_analysis.append({
                            "name": competitor_name,
                            "total_news": comp_total,
                            "sentiment_score": comp_sentiment_score,
                            "positive": comp_positive,
                            "negative": comp_negative,
                            "neutral": comp_neutral,
                            "crisis_level": comp_crisis
                        })
                except Exception as e:
                    print(f"Error analyzing competitor {competitor_name}: {e}")
                    competitor_analysis.append({
                        "name": competitor_name,
                        "total_news": 0,
                        "sentiment_score": 0,
                        "error": "Analysis failed"
                    })

        # Store comprehensive results
        tracking_document = {
            "company_id": company_id,
            "company_name": company_name,
            "timestamp": datetime.utcnow(),
            "analysis_period": analysis_period,
            "websites": websites_data,
            "verified_news": verified_news,
            "competitor_analysis": competitor_analysis,
            "statistics": {
                "total_news": total_news,
                "real_count": real_count,
                "fake_count": fake_count,
                "uncertain_count": uncertain_count,
                "avg_confidence": round(avg_confidence, 3),
                "category_breakdown": category_stats,
                "sentiment_breakdown": sentiment_stats,
                "source_breakdown": dict(list(source_stats.items())[:10]),
                "reliability_score": round((real_count / total_news) * avg_confidence * 100, 1) if total_news > 0 else 0,
                "mentions_today": mentions_today,
                "mentions_week": mentions_week,
                "overall_sentiment_score": overall_sentiment_score
            },
            "crisis_alert": {
                "risk_level": crisis_risk,
                "risk_score": crisis_score,
                "mentions_today": mentions_today,
                "negative_today": today_negative,
                "positive_today": today_positive,
                "sentiment_ratio": round(today_negative / mentions_today * 100, 1) if mentions_today > 0 else 0,
                "fake_news_count": fake_count,
                "message": f"{'⚠️ URGENT: ' if crisis_risk == 'HIGH' else '⚡ ' if crisis_risk == 'MEDIUM' else '✓ '}Crisis risk is {crisis_risk}"
            },
            "negative_spike": spike_info if negative_spike_detected else {"detected": False},
            "fake_news_details": fake_news_list[:5],
            "timeline_data": timeline_data,
            "sentiment_by_day": sentiment_by_day,
            "sentiment_by_source": dict(list(source_sentiment.items())[:10]),
            "sentiment_by_topic": topic_sentiment,
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
                ],
                "negative_by_date": [{"date": k, "count": v} for k, v in sorted(negative_by_date.items())]
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
            "sentiment_by_day": sentiment_by_day,
            "sentiment_by_source": dict(list(source_sentiment.items())[:10]),
            "sentiment_by_topic": topic_sentiment,
            "crisis_alert": tracking_document['crisis_alert'],
            "negative_spike": tracking_document['negative_spike'],
            "fake_news_details": fake_news_list[:5],
            "competitor_analysis": competitor_analysis,
            "graph_data": tracking_document['graph_data']
        }

    except Exception as e:
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ENHANCED API ROUTES ====================

class FetchNewsRequest(BaseModel):
    companyId: str
    analysisPeriod: str = 'today'
    competitors: List[str] = []

@app.post("/api/company/fetch-news")
async def fetch_news_endpoint(request: FetchNewsRequest):
    """Enhanced endpoint that returns comprehensive analysis with all news for the selected period"""
    result = await analyze_company(request.companyId, request.analysisPeriod, request.competitors)
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

        # Check if there's analysis from today (using local time)
        from datetime import datetime as dt
        today_start = dt.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = dt.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        
        print(f"Checking for today's analysis between {today_start} and {today_end}")
        
        today_analysis = news_tracking_collection.find_one({
            "company_id": company_id,
            "timestamp": {
                "$gte": today_start,
                "$lte": today_end
            }
        }, sort=[("timestamp", -1)])

        # Get all tracking history
        tracking_history = list(
            news_tracking_collection
            .find({"company_id": company_id})
            .sort("timestamp", -1)
            .limit(30)
        )

        if len(tracking_history) == 0:
            return {
                "company_name": company.get('name', ''),
                "has_data": False,
                "has_today_analysis": False,
                "message": "No data yet. Click 'Analyze Now' to start tracking."
            }

        # Use today's analysis if available, otherwise use latest
        latest = today_analysis if today_analysis else tracking_history[0]
        has_today_analysis = today_analysis is not None

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
            "has_today_analysis": has_today_analysis,
            "analysis_date": latest['timestamp'].isoformat(),
            "analysis_period": latest.get('analysis_period', 'today'),
            "is_today": has_today_analysis,
            "latest_fetch": latest['timestamp'].isoformat(),
            "statistics": latest['statistics'],
            "crisis_alert": latest.get('crisis_alert', {}),
            "negative_spike": latest.get('negative_spike', {"detected": False}),
            "fake_news_details": latest.get('fake_news_details', []),
            "verified_news": latest.get('verified_news', []),
            "all_verified_news": latest.get('verified_news', []),
            "websites": latest.get('websites', {}),
            "timeline": timeline,
            "timeline_data": latest.get('timeline_data', []),
            "sentiment_by_day": latest.get('sentiment_by_day', []),
            "sentiment_by_source": latest.get('sentiment_by_source', {}),
            "sentiment_by_topic": latest.get('sentiment_by_topic', {}),
            "graph_data": latest.get('graph_data', {}),
            "competitor_analysis": latest.get('competitor_analysis', []),
            "trend_data": trend_data,
            "total_fetches": len(tracking_history),
            "data_freshness": (datetime.utcnow() - latest['timestamp']).total_seconds() / 3600,
            "past_reports": [
                {
                    "date": entry['timestamp'].strftime("%Y-%m-%d %H:%M"),
                    "timestamp": entry['timestamp'].isoformat(),
                    "total_news": entry['statistics']['total_news'],
                    "sentiment_score": entry['statistics'].get('overall_sentiment_score', 50),
                    "crisis_level": entry.get('crisis_alert', {}).get('risk_level', 'LOW'),
                    "analysis_period": entry.get('analysis_period', 'today')
                }
                for entry in tracking_history[:10]
            ],
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

@app.get("/api/company/report/{company_id}/{report_timestamp}")
async def get_specific_report(company_id: str, report_timestamp: str):
    """Get a specific past report by timestamp"""
    try:
        # Parse the timestamp
        report_date = datetime.fromisoformat(report_timestamp.replace('Z', '+00:00'))
        
        # Find the specific report
        report = news_tracking_collection.find_one({
            "company_id": company_id,
            "timestamp": report_date
        })
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "company_name": report.get('company_name', ''),
            "company_id": company_id,
            "has_data": True,
            "is_today": False,
            "analysis_date": report['timestamp'].isoformat(),
            "analysis_period": report.get('analysis_period', 'today'),
            "latest_fetch": report['timestamp'].isoformat(),
            "statistics": report['statistics'],
            "crisis_alert": report.get('crisis_alert', {}),
            "negative_spike": report.get('negative_spike', {"detected": False}),
            "fake_news_details": report.get('fake_news_details', []),
            "verified_news": report.get('verified_news', []),
            "all_verified_news": report.get('verified_news', []),
            "websites": report.get('websites', {}),
            "timeline_data": report.get('timeline_data', []),
            "sentiment_by_day": report.get('sentiment_by_day', []),
            "sentiment_by_source": report.get('sentiment_by_source', {}),
            "sentiment_by_topic": report.get('sentiment_by_topic', {}),
            "graph_data": report.get('graph_data', {}),
            "competitor_analysis": report.get('competitor_analysis', [])
        }
    
    except Exception as e:
        print(f"Report fetch error: {e}")
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
            "No cap on news per analysis period",
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