# Testing Guide for Analysis Period & Competitor Features

## Quick Start Testing

### Prerequisites
1. MongoDB running and connected
2. Python backend running on port 8002
3. Next.js frontend running on port 3000
4. Company account created with official website

---

## Test Scenario 1: Analysis Period Options

### Test "Today" Analysis
```bash
1. Login to company dashboard
2. Click "Analyze Now" button
3. Select "Today" option (24 hours)
4. Click "Start Analysis"
5. Wait for completion (~30 seconds)

Expected Results:
✅ Modal shows 4 period options
✅ "Today" card is highlighted
✅ Analysis runs successfully
✅ Dashboard shows "Today's Analysis" badge
✅ News items are from last 24 hours only
```

### Test "This Week" Analysis
```bash
1. Click "Analyze Now" again
2. Select "This Week" option (7 days)
3. Click "Start Analysis"

Expected Results:
✅ New analysis is created
✅ More news items than "Today" (7 days of data)
✅ Dashboard shows "This Week's Analysis" badge
✅ Past reports dropdown now shows both analyses
```

### Test "This Month" Analysis
```bash
1. Click "Analyze Now"
2. Select "This Month" option (30 days)
3. Click "Start Analysis"

Expected Results:
✅ Significantly more news items
✅ Sentiment trends show 30-day pattern
✅ "This Month's Analysis" badge appears
```

### Test "This Year" Analysis
```bash
1. Click "Analyze Now"
2. Select "This Year" option (365 days)
3. Click "Start Analysis"
4. Wait longer (~60-90 seconds for more data)

Expected Results:
✅ Maximum news items (up to 100)
✅ Long-term sentiment trends visible
✅ "This Year's Analysis" badge displayed
```

---

## Test Scenario 2: Competitor Analysis

### Test with 1 Competitor
```bash
1. Click "Analyze Now"
2. Select any period (e.g., "This Week")
3. Toggle "Add Competitors" switch
4. Enter competitor name: "Microsoft"
5. Click "Start Analysis"

Expected Results:
✅ Competitor input field appears
✅ Analysis includes competitor data
✅ Competitor comparison section shows:
   - Your company's data
   - Microsoft's sentiment score
   - Microsoft's mentions count
   - Microsoft's crisis level
✅ Comparison bar chart displays both
```

### Test with 3 Competitors
```bash
1. Click "Analyze Now"
2. Select "Today"
3. Toggle "Add Competitors"
4. Enter:
   - Competitor 1: "Apple"
   - Competitor 2: "Google"
   - Competitor 3: "Amazon"
5. Click "Start Analysis"

Expected Results:
✅ 3 competitor input fields show
✅ All 4 companies analyzed (yours + 3 competitors)
✅ Comparison section shows 4 columns
✅ Bar chart compares all 4 companies
✅ Each competitor has sentiment score, mentions, crisis level
```

### Test with Non-existent Competitor
```bash
1. Click "Analyze Now"
2. Add competitor: "XYZ_NonExistent_Company_12345"
3. Start analysis

Expected Results:
✅ Analysis completes without error
✅ Competitor shows 0 mentions
✅ Competitor shows "No data available" message
✅ Other data is not affected
```

---

## Test Scenario 3: Past Reports History

### View Past Reports
```bash
1. After running 3-4 different analyses
2. Click "Past Reports" button in header

Expected Results:
✅ Dropdown shows all past reports
✅ Each report card displays:
   - Date and time
   - Analysis period badge (Today/Week/Month/Year)
   - Crisis level (colored badge)
   - Total news items
   - Sentiment score
✅ Cards are sorted by date (newest first)
```

### Load Specific Past Report
```bash
1. Click on any past report card
2. Dashboard reloads with that report's data

Expected Results:
✅ Header shows "Viewing Past Report: [date]"
✅ All charts update to that report's data
✅ Sentiment gauge shows that report's score
✅ Crisis alerts reflect that report's status
✅ "Back to Today" button appears
✅ If report had competitors, they are shown
```

### Return to Current View
```bash
1. While viewing a past report
2. Click "Back to Today" button

Expected Results:
✅ Dashboard reloads with latest/today's analysis
✅ "Viewing Past Report" message disappears
✅ All data updates to current
```

---

## Test Scenario 4: Smart Report Detection

### Test "Already Analyzed Today"
```bash
1. Run "Today" analysis at 9:00 AM
2. Close browser
3. Come back at 2:00 PM same day
4. Open dashboard

Expected Results:
✅ Dashboard automatically shows 9:00 AM analysis
✅ Green badge: "Today's Analysis Available"
✅ No "Analyze Now" button shown immediately
✅ Can still run new analysis if needed
```

### Test "No Today Analysis"
```bash
1. Next day, open dashboard (no analysis run yet)

Expected Results:
✅ Dashboard shows "No Analysis Today"
✅ "Analyze Now" button is prominent
✅ Shows latest past analysis if available
✅ Message: "Click Analyze Now to start tracking"
```

---

## Test Scenario 5: Combined Features

### Full Analysis Workflow
```bash
1. Login to dashboard
2. Click "Analyze Now"
3. Select "This Week"
4. Toggle "Add Competitors"
5. Add 2 competitors: "Tesla", "Ford"
6. Click "Start Analysis"
7. Wait for completion
8. View results:
   - Sentiment gauge
   - Crisis alerts
   - Mentions tracking
   - Sentiment breakdowns
   - Competitor comparison
9. Run another analysis:
   - Period: "Today"
   - Competitors: "BMW", "Honda", "Toyota"
10. Click "Past Reports"
11. View first analysis (This Week + Tesla/Ford)
12. Switch back to second analysis

Expected Results:
✅ Both analyses are stored separately
✅ Each has its own period and competitors
✅ Can switch between them easily
✅ Data is accurate for each
✅ Charts update correctly
✅ No data mixing between reports
```

---

## Edge Cases to Test

### 1. Empty Competitor Name
```bash
- Leave competitor field empty
- Should be ignored or show validation error
```

### 2. Special Characters in Competitor
```bash
- Enter: "Company@#$%"
- Should handle gracefully
```

### 3. Very Long Competitor Name
```bash
- Enter: "Very Long Company Name With Multiple Words That Exceeds Normal Length"
- Should truncate or handle UI overflow
```

### 4. Rapid Analysis Requests
```bash
- Click "Analyze Now" multiple times quickly
- Should prevent duplicate requests or queue properly
```

### 5. Network Interruption
```bash
- Start analysis
- Disconnect internet mid-analysis
- Reconnect
- Should show error and allow retry
```

---

## Verification Checklist

### Analysis Period Verification
- [ ] "Today" shows only today's news (check dates)
- [ ] "Week" shows 7 days of news
- [ ] "Month" shows 30 days of news
- [ ] "Year" shows up to 365 days of news
- [ ] Period badge displays correctly on dashboard
- [ ] Period is saved in MongoDB (check `analysis_period` field)
- [ ] Past reports show correct period badge

### Competitor Analysis Verification
- [ ] Can add 0-3 competitors
- [ ] Competitor names are sent to backend
- [ ] Backend analyzes each competitor
- [ ] Competitor data is saved in MongoDB (`competitor_analysis` array)
- [ ] Dashboard displays comparison section
- [ ] Sentiment scores are calculated correctly
- [ ] Crisis levels are determined for each
- [ ] Bar chart displays all companies
- [ ] Colors are consistent and readable

### Past Reports Verification
- [ ] All analyses are saved to MongoDB
- [ ] Past reports dropdown shows last 10
- [ ] Can load any past report
- [ ] Past report data is complete
- [ ] Can return to today's view
- [ ] Period and competitors are preserved
- [ ] Timestamps are accurate

### UI/UX Verification
- [ ] Loading states show during analysis
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Charts are responsive
- [ ] Mobile view works correctly
- [ ] Colors are accessible
- [ ] Tooltips are helpful
- [ ] Buttons are clearly labeled

---

## Backend Verification (MongoDB)

### Check MongoDB Structure
```javascript
// Connect to MongoDB
use veritas_ai;

// Check latest analysis
db.news_tracking.findOne({}, {sort: {timestamp: -1}});

// Verify fields exist:
// - analysis_period: "today"|"week"|"month"|"year"
// - competitor_analysis: [{name, sentiment_score, total_mentions, crisis_level, crisis_score}]
// - timestamp: ISODate
// - company_id: ObjectId

// Check all periods are working
db.news_tracking.distinct("analysis_period");
// Should return: ["today", "week", "month", "year"]

// Check competitor analysis is saved
db.news_tracking.find({"competitor_analysis.0": {$exists: true}}).count();
// Should return count > 0 if competitors were analyzed
```

### Verify Date Filtering
```javascript
// Check "Today" analysis has recent news
db.news_tracking.findOne(
    {analysis_period: "today"},
    {verified_news: 1}
).verified_news.forEach(news => {
    print(news.published_date);
    // All dates should be within last 24 hours
});

// Check "Year" analysis has older news
db.news_tracking.findOne(
    {analysis_period: "year"},
    {verified_news: 1}
).verified_news.forEach(news => {
    print(news.published_date);
    // Dates can be up to 365 days old
});
```

---

## Performance Testing

### Analysis Time Benchmarks
```
Expected completion times:
- Today: 30-45 seconds
- Week: 45-60 seconds
- Month: 60-90 seconds
- Year: 90-120 seconds

With competitors (add per competitor):
- +10-15 seconds per competitor
```

### Resource Usage
```
- Memory: Monitor for leaks during multiple analyses
- CPU: Should normalize after analysis completes
- Network: Check for unnecessary repeated requests
- Database: Verify indexes are used
```

---

## Debugging Tips

### Frontend Console Errors
```javascript
// Check for errors
console.log(analytics);

// Verify period is sent
console.log('Period:', analysisPeriod);

// Check competitors array
console.log('Competitors:', competitors);
```

### Backend Logs
```bash
# Python backend logs
tail -f backend.log

# Look for:
- "Analysis period: [period]"
- "Competitors: [list]"
- Date range calculations
- Competitor analysis loops
```

### MongoDB Queries
```javascript
// Find analyses by period
db.news_tracking.find({analysis_period: "week"}).count();

// Find analyses with competitors
db.news_tracking.find({"competitor_analysis": {$ne: []}}).count();

// Check latest analysis
db.news_tracking.find().sort({timestamp: -1}).limit(1).pretty();
```

---

## Success Criteria

### Feature Complete When:
✅ All 4 analysis periods work correctly
✅ Competitor analysis (0-3 competitors) functions properly
✅ Past reports can be viewed and navigated
✅ Data is accurately filtered by date range
✅ UI displays all information clearly
✅ MongoDB stores all data correctly
✅ No performance degradation
✅ Error handling is robust
✅ Mobile experience is good

---

## Reporting Issues

### Issue Template
```markdown
**Feature**: Analysis Period / Competitor Analysis / Past Reports
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
**Actual Result**:
**Screenshots**: (if applicable)
**Browser**: Chrome/Firefox/Safari
**Console Errors**: (if any)
```

---

**Happy Testing!** 🚀

If you find any issues, document them and we'll fix them together.
