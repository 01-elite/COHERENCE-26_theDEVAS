const openai = require('../config/openai');

/**
 * AI Service for OpenAI interactions
 */
class AIService {
  /**
   * Generate contextual response using GPT
   */
  static async generateResponse(prompt, systemContext, options = {}) {
    try {
      const {
        temperature = 0.7,
        maxTokens = 500,
        model = 'gpt-3.5-turbo'
      } = options;

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens
      });

      return {
        success: true,
        response: completion.choices[0].message.content,
        usage: completion.usage
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze anomaly and provide explanation
   */
  static async explainAnomaly(anomaly, transaction, budget) {
    const prompt = `Analyze this budget anomaly and provide a clear explanation:

Anomaly Type: ${anomaly.type}
Risk Level: ${anomaly.riskLevel}
Description: ${anomaly.description}

Transaction Details:
- Amount: ₹${transaction.amount.toLocaleString('en-IN')}
- Date: ${new Date(transaction.transactionDate).toLocaleDateString()}
- Beneficiary: ${transaction.beneficiary?.name || 'N/A'}

Budget Context:
- Allocated: ₹${budget.allocatedAmount.toLocaleString('en-IN')}
- Spent: ₹${budget.spentAmount.toLocaleString('en-IN')}
- Utilization: ${budget.utilizationPercentage}%

Provide:
1. Why this is flagged as an anomaly
2. Potential implications
3. Recommended actions`;

    const systemContext = 'You are a financial auditor specializing in government budget analysis and fraud detection.';

    return await this.generateResponse(prompt, systemContext, {
      temperature: 0.6,
      maxTokens: 400
    });
  }

  /**
   * Generate budget recommendations
   */
  static async generateBudgetRecommendations(budget, spendingData) {
    const prompt = `Generate actionable recommendations for this government budget:

Budget: ${budget.title}
Department: ${budget.department?.name}
Allocated: ₹${(budget.allocatedAmount / 10000000).toFixed(2)} Cr
Spent: ₹${(budget.spentAmount / 10000000).toFixed(2)} Cr
Utilization: ${budget.utilizationPercentage}%
Days Remaining: ${budget.daysRemaining}

Recent Spending Pattern:
${spendingData}

Provide 5 specific, actionable recommendations to optimize budget utilization and prevent fund lapse.`;

    const systemContext = 'You are a government budget optimization consultant with expertise in public finance management.';

    return await this.generateResponse(prompt, systemContext, {
      temperature: 0.7,
      maxTokens: 600
    });
  }

  /**
   * Summarize budget performance
   */
  static async summarizeBudgetPerformance(budgets) {
    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const utilization = totalAllocated > 0 ? ((totalSpent / totalAllocated) * 100).toFixed(2) : 0;

    const prompt = `Summarize the budget performance:

Total Budgets: ${budgets.length}
Total Allocated: ₹${(totalAllocated / 10000000).toFixed(2)} Cr
Total Spent: ₹${(totalSpent / 10000000).toFixed(2)} Cr
Overall Utilization: ${utilization}%

Provide a concise executive summary highlighting:
1. Overall performance
2. Key concerns
3. Positive trends
4. Priority actions`;

    const systemContext = 'You are a senior financial analyst preparing executive summaries for government officials.';

    return await this.generateResponse(prompt, systemContext, {
      temperature: 0.5,
      maxTokens: 400
    });
  }

  /**
   * Predict fund lapse risk
   */
  static async predictFundLapseRisk(budget) {
    const prompt = `Assess the risk of fund lapse for this budget:

Budget: ${budget.title}
Allocated: ₹${(budget.allocatedAmount / 10000000).toFixed(2)} Cr
Spent: ₹${(budget.spentAmount / 10000000).toFixed(2)} Cr
Available: ₹${(budget.availableAmount / 10000000).toFixed(2)} Cr
Utilization: ${budget.utilizationPercentage}%
Days Remaining: ${budget.daysRemaining}
Status: ${budget.status}

Provide:
1. Risk assessment (Low/Medium/High/Critical)
2. Probability of fund lapse (%)
3. Key risk factors
4. Urgent actions needed`;

    const systemContext = 'You are a predictive analytics expert specializing in government budget management and fund lapse prevention.';

    return await this.generateResponse(prompt, systemContext, {
      temperature: 0.5,
      maxTokens: 500
    });
  }

  /**
   * Generate natural language query insights
   */
  static async answerBudgetQuery(query, contextData) {
    const systemContext = `You are GovIntel AI, an intelligent assistant for government budget analysis.
You have access to budget data and can provide insights about spending, allocations, and trends.
Context Data: ${JSON.stringify(contextData, null, 2)}
Provide accurate, concise answers based on the available data.`;

    return await this.generateResponse(query, systemContext, {
      temperature: 0.6,
      maxTokens: 400
    });
  }

  /**
   * Verify anomaly with AI and determine if it's a false positive
   */
  static async verifyAnomalyWithAI(anomaly) {
    try {
      const transaction = anomaly.transaction;
      const budget = anomaly.budget;

      const prompt = `Analyze this flagged budget anomaly and determine if it's a legitimate concern or a false positive:

ANOMALY DETAILS:
- Type: ${anomaly.type}
- Risk Level: ${anomaly.riskLevel}
- Original Confidence: ${anomaly.confidence}%
- Description: ${anomaly.description}
- Amount: ₹${anomaly.amount?.toLocaleString('en-IN') || 'N/A'}

TRANSACTION CONTEXT:
- Transaction ID: ${transaction?.transactionId || 'N/A'}
- Amount: ₹${transaction?.amount?.toLocaleString('en-IN') || 'N/A'}
- Date: ${transaction?.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString() : 'N/A'}
- Description: ${transaction?.description || 'N/A'}
- Beneficiary: ${transaction?.beneficiary?.name || 'N/A'}

BUDGET CONTEXT:
- Budget: ${budget?.title || 'N/A'}
- Scheme: ${budget?.scheme || 'N/A'}
- Allocated: ₹${budget?.allocatedAmount?.toLocaleString('en-IN') || 'N/A'}
- Spent: ₹${budget?.spentAmount?.toLocaleString('en-IN') || 'N/A'}
- Utilization: ${budget?.utilizationPercentage || 0}%

ANALYSIS REQUIRED:
Provide your analysis in the following JSON format:
{
  "isLegitimate": true/false,
  "confidence": 0-100,
  "riskScore": 0-100,
  "reasoning": "detailed explanation",
  "falsePositiveReasons": ["reason1", "reason2"] or [],
  "redFlags": ["flag1", "flag2"] or [],
  "recommendedAction": "investigate/dismiss/escalate",
  "insights": "summary of findings"
}

Consider:
1. Is this transaction pattern normal for government operations?
2. Are there legitimate business reasons for this transaction?
3. Does the timing, amount, or beneficiary raise genuine concerns?
4. Are there any contextual factors that explain this anomaly?`;

      const systemContext = `You are an expert financial forensic analyst with 20+ years of experience in government audit and fraud detection.
Your specialty is distinguishing between legitimate government transactions and actual fraudulent activities.
You understand that government budgets often have legitimate reasons for patterns that may appear unusual.
Provide balanced, evidence-based analysis.`;

      const result = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 600
      });

      const aiResponse = result.choices[0].message.content;
      
      // Try to parse JSON response
      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback if AI doesn't return proper JSON
          analysis = {
            isLegitimate: false,
            confidence: 50,
            riskScore: 50,
            reasoning: aiResponse,
            falsePositiveReasons: [],
            redFlags: [],
            recommendedAction: 'investigate',
            insights: aiResponse.substring(0, 200)
          };
        }
      } catch (parseError) {
        analysis = {
          isLegitimate: false,
          confidence: 50,
          riskScore: 50,
          reasoning: aiResponse,
          falsePositiveReasons: [],
          redFlags: [],
          recommendedAction: 'investigate',
          insights: aiResponse.substring(0, 200)
        };
      }

      return {
        success: true,
        ...analysis,
        rawResponse: aiResponse
      };
    } catch (error) {
      console.error('AI Verification Error:', error);
      return {
        success: false,
        error: error.message,
        confidence: 0,
        riskScore: 0,
        insights: 'AI analysis failed'
      };
    }
  }

  /**
   * Analyze budget patterns across multiple years
   */
  static async analyzeBudgetPatterns(currentBudget, historicalBudgets, transactions) {
    try {
      const historicalData = historicalBudgets.map(b => ({
        year: b.fiscalYear,
        allocated: b.allocatedAmount,
        spent: b.spentAmount,
        utilization: b.utilizationPercentage
      }));

      const prompt = `Analyze budget patterns and identify any suspicious changes:

CURRENT BUDGET (${currentBudget.fiscalYear}):
- Scheme: ${currentBudget.scheme}
- Department: ${currentBudget.department?.name}
- Allocated: ₹${(currentBudget.allocatedAmount / 10000000).toFixed(2)} Cr
- Spent: ₹${(currentBudget.spentAmount / 10000000).toFixed(2)} Cr
- Utilization: ${currentBudget.utilizationPercentage}%

HISTORICAL PATTERN:
${historicalData.map(d => 
  `Year ${d.year}: Allocated ₹${(d.allocated / 10000000).toFixed(2)} Cr, Spent ₹${(d.spent / 10000000).toFixed(2)} Cr, Utilization ${d.utilization}%`
).join('\n')}

TRANSACTION SUMMARY:
- Total Transactions: ${transactions.length}
- Current Year Transactions: ${transactions.filter(t => t.budget._id.toString() === currentBudget._id.toString()).length}

ANALYSIS REQUIRED (JSON format):
{
  "trendAnalysis": "overall trend description",
  "anomalousChanges": ["change1", "change2"],
  "suspiciousPatterns": ["pattern1", "pattern2"],
  "normalVariations": ["variation1", "variation2"],
  "riskLevel": "low/medium/high/critical",
  "riskScore": 0-100,
  "keyFindings": ["finding1", "finding2"],
  "recommendations": ["rec1", "rec2"],
  "insights": "executive summary"
}

Consider:
1. Year-over-year growth patterns
2. Sudden spikes or drops in allocation or spending
3. Changes in utilization patterns
4. Seasonality and timing of expenditures`;

      const systemContext = `You are a senior data analyst specializing in government budget forensics and trend analysis.
You excel at identifying patterns, anomalies, and suspicious changes in multi-year budget data.`;

      const result = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 700
      });

      const aiResponse = result.choices[0].message.content;
      
      // Try to parse JSON response
      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          analysis = {
            trendAnalysis: aiResponse,
            anomalousChanges: [],
            suspiciousPatterns: [],
            normalVariations: [],
            riskLevel: 'medium',
            riskScore: 50,
            keyFindings: [],
            recommendations: [],
            insights: aiResponse.substring(0, 200)
          };
        }
      } catch (parseError) {
        analysis = {
          trendAnalysis: aiResponse,
          anomalousChanges: [],
          suspiciousPatterns: [],
          normalVariations: [],
          riskLevel: 'medium',
          riskScore: 50,
          keyFindings: [],
          recommendations: [],
          insights: aiResponse.substring(0, 200)
        };
      }

      return {
        success: true,
        ...analysis,
        rawResponse: aiResponse
      };
    } catch (error) {
      console.error('Pattern Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        insights: 'Pattern analysis failed'
      };
    }
  }

  /**
   * Analyze budget comparison between current and past year
   */
  static async analyzeBudgetComparison(currentBudget, pastBudget) {
    try {
      const currentAmount = currentBudget.allocatedAmount || 0;
      const pastAmount = pastBudget.allocatedAmount || 0;
      const difference = currentAmount - pastAmount;
      const percentageChange = pastAmount > 0 ? ((difference / pastAmount) * 100).toFixed(2) : 0;

      const prompt = `Analyze this year-over-year budget comparison and determine if the change is justified or suspicious:

CURRENT YEAR BUDGET (${currentBudget.financialYear}):
- Scheme: ${currentBudget.scheme}
- Department: ${currentBudget.department?.name || 'N/A'}
- Allocated: ₹${(currentAmount / 10000000).toFixed(2)} Cr
- Spent: ₹${(currentBudget.spentAmount / 10000000).toFixed(2)} Cr (${currentBudget.utilizationPercentage || 0}%)
- Status: ${currentBudget.status}

PAST YEAR BUDGET (${pastBudget.financialYear}):
- Allocated: ₹${(pastAmount / 10000000).toFixed(2)} Cr
- Spent: ₹${(pastBudget.spentAmount / 10000000).toFixed(2)} Cr (${pastBudget.utilizationPercentage || 0}%)
- Status: ${pastBudget.status}

YEAR-OVER-YEAR CHANGE:
- Absolute Difference: ₹${(Math.abs(difference) / 10000000).toFixed(2)} Cr
- Percentage Change: ${percentageChange}%
- Direction: ${difference > 0 ? 'INCREASE' : 'DECREASE'}

ANALYSIS REQUIRED:
Provide your analysis in the following JSON format:
{
  "isJustified": true/false,
  "confidence": 0-100,
  "riskLevel": "low/medium/high/critical",
  "riskScore": 0-100,
  "reasoning": "detailed explanation of why this change is justified or suspicious",
  "justificationFactors": ["factor1", "factor2"] or [],
  "redFlags": ["flag1", "flag2"] or [],
  "recommendations": ["recommendation1", "recommendation2"],
  "insights": "summary of key findings",
  "actionRequired": "none/monitor/investigate/escalate"
}

Consider:
1. Is this percentage change normal for government budgets?
2. Past year utilization patterns (did they need this much?)
3. Common reasons for budget increases/decreases (policy changes, inflation, program expansion)
4. Red flags: excessive increases without justification, drastic cuts to essential services
5. Indian government budget context and typical year-over-year variations`;

      const systemContext = `You are an expert in Indian government financial planning and budget analysis with deep knowledge of:
- Public financial management and budget allocation processes
- Normal year-over-year budget variations in government schemes
- Policy-driven budget changes and their impacts
- Suspicious patterns indicating potential misallocation or fraud
- Indian fiscal policy and inflation-adjusted budget planning
Provide balanced, context-aware analysis considering legitimate government needs.`;

      const result = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 700
      });

      const aiResponse = result.choices[0].message.content;
      
      // Try to parse JSON response
      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback if AI doesn't return proper JSON
          analysis = {
            isJustified: percentageChange < 50,
            confidence: 50,
            riskLevel: Math.abs(percentageChange) > 100 ? 'critical' : Math.abs(percentageChange) > 75 ? 'high' : 'medium',
            riskScore: Math.min(Math.abs(percentageChange), 100),
            reasoning: aiResponse,
            justificationFactors: [],
            redFlags: [],
            recommendations: [],
            insights: aiResponse.substring(0, 200),
            actionRequired: Math.abs(percentageChange) > 75 ? 'investigate' : 'monitor'
          };
        }
      } catch (parseError) {
        analysis = {
          isJustified: percentageChange < 50,
          confidence: 50,
          riskLevel: Math.abs(percentageChange) > 100 ? 'critical' : Math.abs(percentageChange) > 75 ? 'high' : 'medium',
          riskScore: Math.min(Math.abs(percentageChange), 100),
          reasoning: aiResponse,
          justificationFactors: [],
          redFlags: [],
          recommendations: [],
          insights: aiResponse.substring(0, 200),
          actionRequired: Math.abs(percentageChange) > 75 ? 'investigate' : 'monitor'
        };
      }

      return {
        success: true,
        comparison: {
          currentAmount,
          pastAmount,
          difference,
          percentageChange: parseFloat(percentageChange)
        },
        ...analysis,
        rawResponse: aiResponse
      };
    } catch (error) {
      console.error('Budget Comparison Analysis Error:', error);
      return {
        success: false,
        error: error.message,
        insights: 'Budget comparison analysis failed'
      };
    }
  }
}

module.exports = AIService;
