# Budget Verification - Multi-Year Data Setup Guide

## 🎯 Overview

This guide will help you set up the Budget Verification feature with realistic multi-year data that includes:
- **3 years of budget data** (Current year + 2 past years)
- **Comparative analysis** between years
- **AI-powered fault detection** 
- **Automatic anomaly flagging** for verification

## 🚀 Quick Start

### Step 1: Ensure OpenAI API Key is Set

Make sure your `backend/.env` file has your OpenAI API key:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### Step 2: Run the Multi-Year Seed Script

Open a terminal in the `backend` directory and run:

```bash
cd backend
npm run seed:multiyear
```

This will:
1. Clear existing data
2. Create users (admin & auditor)
3. Create departments and districts
4. Generate **120 budgets** across 3 financial years
5. Create **realistic transactions** for each budget
6. **Detect budget faults** using AI logic
7. Flag anomalies that need verification

### Step 3: Start the Backend

```bash
npm run dev
```

### Step 4: Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

### Step 5: Login and Navigate

1. Open http://localhost:5173
2. Login with:
   - **Email**: `admin@govintel.gov.in`
   - **Password**: `admin123`
3. Click on **"Budget Verification"** in the sidebar (Shield icon)

## 📊 What Data Gets Generated

### Budget Distribution
- **Current Year (2026-2027)**: 40 active budgets
- **Last Year (2025-2026)**: 40 mostly closed budgets  
- **2 Years Ago (2024-2025)**: 40 closed budgets

### Realistic Patterns
✅ **Natural Growth**: Budgets grow 10-20% year-over-year normally  
⚠️ **Intentional Faults**: 10% have unusual growth (>100%)  
⚠️ **Budget Cuts**: 5% have unusual decreases (>50%)  
📈 **Utilization Variance**: Progressive utilization by year  

### Fault Detection Categories

The system automatically detects:

1. **Unusual Budget Growth** (High Severity)
   - Budget increased >100% compared to last year
   - Flagged for verification

2. **Unusual Budget Decrease** (Medium Severity)
   - Budget decreased >50% compared to last year
   - May indicate program cancellation

3. **Historical Deviation** (Medium Severity)
   - >75% deviation from historical average
   - Requires justification

4. **Low Utilization** (Medium Severity)
   - <30% utilized while still active
   - Risk of fund lapse

5. **Premature Exhaustion** (High Severity)
   - >95% utilized with 30+ days remaining
   - Possible overspending

6. **Transaction Anomalies** (Various)
   - High value transactions
   - Suspicious round figures
   - Potential duplicates

## 🤖 AI Analysis Features

### Automatic Detection
- Compares current budgets with 2 years of historical data
- Identifies statistical outliers
- Calculates risk scores (0-100)
- Assigns confidence levels

### Verification Queue
- Prioritized by risk level (Critical > High > Medium > Low)
- AI insights included for each anomaly
- Filter by verification status
- Bulk actions for efficient processing

### AI-Powered Actions

1. **Analyze with AI**: Select anomalies and get GPT analysis
   - Determines if it's a false positive
   - Provides risk assessment
   - Recommends action (investigate/dismiss/escalate)

2. **Compare Patterns**: Analyze budget trends
   - Multi-year comparison
   - Pattern recognition
   - Anomaly highlighting

## 📋 Using the Verification Dashboard

### Dashboard Sections

1. **Year Comparison Cards**
   - Total budget allocation per year
   - Number of budgets
   - Average utilization percentage

2. **Trend Analysis**
   - Budget growth percentage
   - Utilization change
   - Visual indicators (green/red)

3. **Verification Queue Stats**
   - Total pending items
   - Breakdown by risk level
   - Amount at risk

4. **Anomaly List**
   - Checkbox selection for bulk actions
   - Risk level badges
   - AI insights display
   - Quick filters

### Workflow

1. **Review Dashboard** - Check year-over-year trends
2. **Filter Anomalies** - Start with Critical/High risk
3. **Select Items** - Choose anomalies to analyze
4. **AI Analysis** - Click "Analyze with AI"
5. **Review Results** - Check false positives vs real issues
6. **Take Action** - Approve, Dismiss, or Escalate

### Bulk Actions

- **Approve**: Mark as legitimate, close investigation
- **Dismiss**: Mark as false positive
- **Escalate**: Flag for senior review

## 🔧 Troubleshooting

### NaN Values Showing
**Cause**: No data in database or incorrect financial year format  
**Solution**: Run `npm run seed:multiyear` again

### No Anomalies Detected
**Cause**: All budgets are within normal ranges  
**Solution**: The seed script intentionally creates some faults. Check the "All Anomalies" filter.

### AI Analysis Not Working
**Cause**: Missing or invalid OpenAI API key  
**Solution**: 
1. Check your `.env` file has `OPENAI_API_KEY`
2. Verify the key is valid at https://platform.openai.com/api-keys
3. Ensure you have API credits available

### Empty Verification Queue
**Cause**: Anomalies marked as "likely_false_positive"  
**Solution**: Use the filter dropdown and select "All Anomalies"

## 📈 Sample Statistics (After Seeding)

```
📊 Expected Results:
   - 120 budgets across 3 financial years
   - 360-840 transactions (3-7 per budget)
   - 20-30 anomalies detected for verification
   - 4-8 High Risk items
   - 8-12 Medium Risk items
   - 6-10 Low Risk items
```

## 🔐 Login Credentials

**Admin Account**
- Email: `admin@govintel.gov.in`
- Password: `admin123`

**Auditor Account**
- Email: `auditor@govintel.gov.in`
- Password: `auditor123`

## 🎨 Features Demonstration

### Past Year Comparison
Navigate to Budget Verification page to see:
- Side-by-side cards showing 3 years of data
- Growth trends with color indicators
- Utilization changes

### AI Fault Detection
The system has already:
- Analyzed 120 budgets
- Compared year-over-year patterns
- Flagged suspicious changes
- Calculated risk scores

### Smart Filtering
Try these filters:
- **Critical Only**: Most urgent items
- **Needs Review**: AI-confirmed issues
- **Likely False Positives**: Safe to dismiss
- **All Anomalies**: Complete list

## 🛠️ Development Notes

### Customizing Fault Detection

Edit `backend/seedMultiYear.js` function `detectBudgetFaults()` to adjust:
- Growth thresholds (default: >100% increase)
- Decrease thresholds (default: >50% decrease)
- Historical deviation limits (default: >75%)
- Utilization warnings (default: <30% or >95%)

### Adding More Years

Change the loop in `seedMultiYear.js`:
```javascript
for (let yearOffset = 2; yearOffset >= 0; yearOffset--) {
```
To:
```javascript
for (let yearOffset = 4; yearOffset >= 0; yearOffset--) { // 5 years total
```

### Adjusting Anomaly Count

Modify the number of anomalies created per budget:
```javascript
for (let i = 0; i < Math.min(15, currentYearTransactions.length); i++) {
```

## 📚 API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/verification/dashboard` | GET | Get 3-year comparison data |
| `/api/verification/queue` | GET | Get prioritized verification queue |
| `/api/verification/analyze` | POST | AI analysis of selected anomalies |
| `/api/verification/compare-patterns` | POST | Compare budget patterns |
| `/api/verification/bulk-verify` | POST | Bulk approve/dismiss/escalate |

## 🎯 Success Indicators

After setup, you should see:
- ✅ Non-zero values in all 3 year cards
- ✅ Positive or negative growth percentages
- ✅ 20+ items in verification queue
- ✅ Mix of risk levels (Critical/High/Medium/Low)
- ✅ AI insights available for items

## 🚨 Important Notes

1. **Run seed:multiyear ONLY**: Do not run other seed scripts as they don't create multi-year data
2. **OpenAI API Required**: AI analysis features require a valid API key
3. **Data Reset**: Seed script clears all existing data
4. **Financial Years**: Uses April-March cycle (standard Indian FY)

## 📞 Support

If you encounter issues:
1. Check backend console for errors
2. Verify MongoDB is running
3. Ensure OpenAI API key is set
4. Review network requests in browser DevTools
5. Check API endpoint responses

---

**Happy Auditing! 🎉**
