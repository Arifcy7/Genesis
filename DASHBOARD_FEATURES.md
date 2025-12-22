# Company Dashboard Features Documentation

## Overview
The Company Dashboard is a comprehensive analytics platform that provides AI-powered news monitoring, sentiment analysis, crisis detection, and competitive intelligence for companies.

---

## Core Features

### 1. **Analysis Period Options**
Users can perform analysis for different time periods:

- **Today**: Analyzes news from the last 24 hours
- **This Week**: Analyzes news from the last 7 days
- **This Month**: Analyzes news from the last 30 days
- **This Year**: Analyzes news from the last 365 days

**How it works:**
- When clicking "Analyze Now", users see a modal with 4 period options
- Backend filters news based on the selected date range
- Each analysis is stored with its period for historical reference

**Implementation:**
```javascript
// Frontend: app/company-dashboard/page.js
- State: analysisPeriod (tracks selected period)
- Modal UI with 4-option selector
- Sends period to backend via API

// Backend: app/backend/company.py
- find_company_news() filters by date range
- Date calculations: today=24hrs, week=7days, month=30days, year=365days
- Stores analysis_period in MongoDB
```

---

### 2. **Competitor Analysis**
Compare your company with up to 3 competitors:

**Features:**
- Input up to 3 competitor names
- Side-by-side comparison of:
  - Overall Sentiment Score (0-100)
  - Total Mentions
  - Crisis Level (LOW/MEDIUM/HIGH)
  - Crisis Risk Score
- Visual comparison bar chart

**How it works:**
1. User enters competitor names in the analysis modal
2. Backend performs separate analysis for each competitor
3. Results are displayed in a comparison section below main analytics

**Implementation:**
```python
# Backend: app/backend/company.py
competitor_analysis = []
for competitor_name in competitors:
    # Find and analyze competitor news
    comp_news = find_company_news(competitor_name, analysis_period)
    comp_results = analyze_company(competitor_name, comp_news)
    competitor_analysis.append({
        "name": competitor_name,
        "sentiment_score": comp_results['overall_sentiment_score'],
        "total_mentions": len(comp_news),
        "crisis_level": comp_results['crisis_alert']['risk_level'],
        "crisis_score": comp_results['crisis_alert']['risk_score']
    })
```

---

### 3. **Smart Report Management**

**Today's Analysis Detection:**
- Dashboard automatically checks if analysis was done today
- If yes: Shows latest report immediately
- If no: Shows "Analyze Now" button

**Past Reports History:**
- Dropdown showing last 10 analyses
- Each report displays:
  - Date and time
  - Analysis period (Today/Week/Month/Year)
  - Crisis level badge
  - Total news items
  - Sentiment score
- Click to load any past report
- "Back to Today" button to return to current view

**Implementation:**
```javascript
// MongoDB Query
const today_analysis = news_tracking_collection.find_one({
    "company_id": company_id,
    "timestamp": {
        "$gte": today_start,
        "$lte": today_end
    }
}, sort=[("timestamp", -1)])

// Dashboard displays:
if (has_today_analysis) {
    // Show latest analysis
} else {
    // Show "Analyze Now" button
}
```

---

### 4. **Overall Sentiment Visualization**

**Visual Gauge Display:**
- Animated semi-circular gauge (0-100 scale)
- Color-coded:
  - Green (70-100): Positive sentiment
  - Yellow (40-69): Neutral sentiment
  - Red (0-39): Negative sentiment
- Real-time needle animation

**Sentiment Calculation:**
```python
positive_weight = 1.0
neutral_weight = 0.5
negative_weight = 0.0

overall_sentiment_score = (
    (positive_count * positive_weight) + 
    (neutral_count * neutral_weight) + 
    (negative_count * negative_weight)
) / total_news * 100
```

---

### 5. **Mentions Tracking**

**Display:**
- Today's Mentions count
- This Week's Mentions count
- Trending indicator (↑ Increasing / ↓ Decreasing / → Stable)

**Calculation:**
- Compares current period with previous period
- Shows percentage change
- Color-coded trend indicators

---

### 6. **Crisis Alert System**

**3-Level Risk System:**
- **HIGH** (Risk Score 70-100): Red alert, immediate action needed
- **MEDIUM** (Risk Score 40-69): Yellow warning, monitor closely
- **LOW** (Risk Score 0-39): Green, situation normal

**Crisis Score Calculation:**
```python
negative_ratio = negative_count / total_news
volume_factor = min(total_news / 50, 1.0)  # Cap at 50 news items
risk_score = (negative_ratio * 0.7 + volume_factor * 0.3) * 100

if risk_score >= 70:
    risk_level = "HIGH"
elif risk_score >= 40:
    risk_level = "MEDIUM"
else:
    risk_level = "LOW"
```

**Display:**
- Large colored card with risk level
- Risk score number (0-100)
- Warning messages and recommended actions
- Affected topics list
- Time remaining for action (if HIGH risk)

---

### 7. **Live News Feed**

**Features:**
- Real-time news items with sentiment badges
- Each item shows:
  - Publication date
  - Sentiment label (Positive/Neutral/Negative)
  - News headline
  - Source website
  - Verification status (Real/Fake/Uncertain)
  - Confidence score
- Color-coded sentiment indicators
- Expandable for full details

**Fake News Tracking:**
- Separate section highlighting fake news
- Shows top 5 fake news items
- Displays:
  - Headline
  - Source
  - Why it's fake (AI reasoning)
  - Confidence score

---

### 8. **Sentiment Breakdown Charts**

#### **By Day (Timeline)**
- Line chart showing sentiment trend over time
- Daily sentiment scores
- Identifies positive/negative spikes

#### **By Source**
- Pie chart showing sentiment distribution by news source
- Helps identify which sources are most positive/negative
- Useful for media relations strategy

#### **By Topic**
- Bar chart of sentiment by topic/category
- Topics include: Business, Technology, Finance, Legal, etc.
- Identifies which areas need attention

---

### 9. **Negative News Spike Detection**

**Alert System:**
- Automatically detects sudden increases in negative news
- Triggers if negative news increases >50% compared to average
- Shows:
  - Spike percentage
  - Alert message
  - Timeline graph highlighting the spike
  - Recommended actions

**Calculation:**
```python
negative_counts = [day['negative'] for day in sentiment_by_day]
avg_negative = sum(negative_counts) / len(negative_counts)
max_negative = max(negative_counts)

if max_negative > avg_negative * 1.5:
    spike_detected = True
    spike_percentage = ((max_negative - avg_negative) / avg_negative) * 100
```

---

## Data Storage Structure

### MongoDB Collections

#### 1. **companies** Collection
```json
{
    "_id": ObjectId,
    "name": "Company Name",
    "email": "company@example.com",
    "password": "hashed_password",
    "officialWebsite": "https://company.com",
    "profilePic": "cloudinary_url",
    "createdAt": ISODate
}
```

#### 2. **news_tracking** Collection
```json
{
    "company_id": "company_object_id",
    "company_name": "Company Name",
    "timestamp": ISODate,
    "analysis_period": "today|week|month|year",
    
    "statistics": {
        "total_news": 30,
        "real_count": 25,
        "fake_count": 3,
        "uncertain_count": 2,
        "positive_count": 15,
        "neutral_count": 8,
        "negative_count": 7,
        "overall_sentiment_score": 65.5,
        "reliability_score": 83.3,
        "avg_confidence": 0.78,
        "category_breakdown": {
            "Business": 10,
            "Technology": 8,
            "Finance": 7
        }
    },
    
    "crisis_alert": {
        "risk_score": 45.5,
        "risk_level": "MEDIUM",
        "is_crisis": false,
        "affected_topics": ["Finance", "Legal"],
        "recommended_actions": ["Monitor situation", "Prepare response"]
    },
    
    "negative_spike": {
        "detected": true,
        "spike_percentage": 75.2,
        "alert_message": "Significant increase in negative news detected"
    },
    
    "fake_news_details": [
        {
            "headline": "Fake news title",
            "source": "unreliable-source.com",
            "reason": "AI-detected false claims",
            "confidence": 0.92
        }
    ],
    
    "sentiment_by_day": [
        {
            "date": "2024-01-15",
            "positive": 5,
            "neutral": 3,
            "negative": 2,
            "sentiment_score": 70
        }
    ],
    
    "sentiment_by_source": {
        "reuters.com": {"positive": 5, "neutral": 2, "negative": 1},
        "bloomberg.com": {"positive": 3, "neutral": 4, "negative": 2}
    },
    
    "sentiment_by_topic": {
        "Business": {"positive": 8, "neutral": 5, "negative": 3},
        "Technology": {"positive": 6, "neutral": 4, "negative": 2}
    },
    
    "competitor_analysis": [
        {
            "name": "Competitor A",
            "sentiment_score": 72.5,
            "total_mentions": 25,
            "crisis_level": "LOW",
            "crisis_score": 25.3
        }
    ],
    
    "verified_news": [
        {
            "title": "News headline",
            "url": "https://source.com/article",
            "source": "source.com",
            "published_date": "2024-01-15",
            "verification_status": "REAL|FAKE|UNCERTAIN",
            "confidence_score": 0.85,
            "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
            "category": "Business",
            "summary": "AI-generated summary"
        }
    ]
}
```

---

## API Endpoints

### 1. **GET /api/company/dashboard**
Returns current dashboard data with today's analysis check.

**Response:**
```json
{
    "company_name": "Company Name",
    "has_data": true,
    "has_today_analysis": true,
    "analysis_period": "today",
    "is_today": true,
    "statistics": {...},
    "crisis_alert": {...},
    "negative_spike": {...},
    "sentiment_by_day": [...],
    "sentiment_by_source": {...},
    "sentiment_by_topic": {...},
    "competitor_analysis": [...],
    "fake_news_details": [...],
    "verified_news": [...],
    "past_reports": [...]
}
```

### 2. **POST /api/company/fetch-news**
Triggers new analysis with period and competitors.

**Request:**
```json
{
    "analysisPeriod": "today|week|month|year",
    "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"]
}
```

### 3. **GET /api/company/report/[companyId]/[timestamp]**
Loads a specific past report.

**Response:**
Similar to dashboard endpoint but for historical data.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Hooks

### Backend
- **API**: FastAPI (Python)
- **AI Model**: Google Gemini 2.5 Flash
- **Database**: MongoDB Atlas
- **ODM**: Mongoose (Node.js) + PyMongo (Python)

### Authentication
- **Method**: JWT + HTTP-only cookies
- **Middleware**: requireCompanyAuth
- **Hashing**: bcrypt

---

## Usage Guide

### For First-Time Users:

1. **Register Company Account**
   - Provide: Company Name, Email, Password, Official Website
   - Website is used for news searches

2. **Initial Analysis**
   - Click "Analyze Now"
   - Select analysis period (Today/Week/Month/Year)
   - Optionally add up to 3 competitors
   - Click "Start Analysis"
   - Wait 30-60 seconds for AI processing

3. **View Dashboard**
   - Overall sentiment gauge
   - Crisis alerts (if any)
   - Mentions tracking
   - News feed with sentiment labels
   - Sentiment breakdown charts
   - Competitor comparison (if analyzed)
   - Fake news tracking

4. **View Past Reports**
   - Click "Past Reports" button
   - Select any previous analysis
   - Compare trends over time
   - Filter by analysis period

### Best Practices:

- **Daily Monitoring**: Run "Today" analysis each morning
- **Weekly Review**: Run "This Week" analysis every Monday
- **Crisis Response**: Check "Crisis Alert" section first
- **Competitor Tracking**: Add competitors regularly to track relative performance
- **Trend Analysis**: Use past reports to identify patterns
- **Fake News Vigilance**: Review fake news section to prevent misinformation

---

## Key Metrics Explained

### 1. **Sentiment Score (0-100)**
- 70-100: Strong positive sentiment
- 40-69: Neutral to mixed sentiment
- 0-39: Negative sentiment requiring attention

### 2. **Reliability Score (0-100)**
- Percentage of verified real news vs. fake/uncertain
- Higher is better
- Target: >80%

### 3. **Crisis Risk Score (0-100)**
- Based on negative news ratio and volume
- 70+: Immediate action required
- 40-69: Monitor closely
- 0-39: Normal situation

### 4. **Confidence Score (0-1)**
- AI's confidence in verification
- >0.8: High confidence
- 0.5-0.8: Moderate confidence
- <0.5: Low confidence, human review needed

---

## Future Enhancements (Planned)

1. **Real-time Alerts**: Email/SMS notifications for crisis situations
2. **Export Reports**: Download PDF/Excel reports
3. **Custom Alerts**: User-defined alert thresholds
4. **Advanced Filters**: Filter news by source, category, sentiment
5. **Sentiment Trends**: Predictive analytics for sentiment forecasting
6. **Social Media Integration**: Track Twitter, LinkedIn mentions
7. **API Access**: RESTful API for third-party integrations
8. **Team Collaboration**: Multiple users per company account

---

## Troubleshooting

### Common Issues:

**1. No data showing**
- Ensure company website is correct
- Run an analysis first
- Check internet connection

**2. Analysis takes too long**
- Normal processing time: 30-60 seconds
- For "Year" analysis, may take up to 2 minutes
- Ensure backend server is running (port 8002)

**3. Competitor data missing**
- Ensure competitor names are spelled correctly
- Competitor must have recent news coverage
- Try different competitor names

**4. Past reports not loading**
- Clear browser cache
- Check MongoDB connection
- Verify report timestamp format

---

## Support

For technical support or feature requests:
- Email: support@veritas-ai.com
- Documentation: /docs
- GitHub Issues: [repository-link]

---

**Last Updated**: January 2024
**Version**: 3.0
**Author**: Veritas AI Team
