const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Anomaly = require('../models/Anomaly');
const AIService = require('../services/aiService');

// @desc    Get verification dashboard data with past 2 years comparison
// @route   GET /api/verification/dashboard
// @access  Private
exports.getVerificationDashboard = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const twoYearsAgo = new Date(currentYear - 2, currentDate.getMonth(), currentDate.getDate());
    
    // Financial year strings (e.g., "2025-2026")
    const currentFY = `${currentYear}-${currentYear + 1}`;
    const lastYearFY = `${currentYear - 1}-${currentYear}`;
    const twoYearsAgoFY = `${currentYear - 2}-${currentYear - 1}`;

    // Get current year data
    const currentYearBudgets = await Budget.find({
      financialYear: currentFY
    }).populate('department');

    // Get previous 2 years data for comparison
    const lastYearBudgets = await Budget.find({
      financialYear: lastYearFY
    }).populate('department');

    const twoYearsAgoBudgets = await Budget.find({
      financialYear: twoYearsAgoFY
    }).populate('department');

    // Get all anomalies for these periods
    const anomalies = await Anomaly.find({
      detectedDate: { $gte: twoYearsAgo },
      status: { $in: ['pending', 'investigating', 'open'] }
    })
      .populate('transaction')
      .populate('budget')
      .sort({ detectedDate: -1 });

    // Calculate comparative statistics with safe division
    const currentTotal = currentYearBudgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
    const lastYearTotal = lastYearBudgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
    const twoYearsAgoTotal = twoYearsAgoBudgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);

    const currentAvgUtil = currentYearBudgets.length > 0 
      ? currentYearBudgets.reduce((sum, b) => sum + parseFloat(b.utilizationPercentage || 0), 0) / currentYearBudgets.length
      : 0;
    
    const lastYearAvgUtil = lastYearBudgets.length > 0
      ? lastYearBudgets.reduce((sum, b) => sum + parseFloat(b.utilizationPercentage || 0), 0) / lastYearBudgets.length
      : 0;
    
    const twoYearsAgoAvgUtil = twoYearsAgoBudgets.length > 0
      ? twoYearsAgoBudgets.reduce((sum, b) => sum + parseFloat(b.utilizationPercentage || 0), 0) / twoYearsAgoBudgets.length
      : 0;

    const budgetGrowth = lastYearTotal > 0 
      ? ((currentTotal - lastYearTotal) / lastYearTotal * 100).toFixed(2)
      : 0;

    const stats = {
      currentYear: {
        total: currentTotal,
        budgetCount: currentYearBudgets.length,
        avgUtilization: parseFloat(currentAvgUtil.toFixed(2))
      },
      lastYear: {
        total: lastYearTotal,
        budgetCount: lastYearBudgets.length,
        avgUtilization: parseFloat(lastYearAvgUtil.toFixed(2))
      },
      twoYearsAgo: {
        total: twoYearsAgoTotal,
        budgetCount: twoYearsAgoBudgets.length,
        avgUtilization: parseFloat(twoYearsAgoAvgUtil.toFixed(2))
      },
      trends: {
        budgetGrowth: parseFloat(budgetGrowth),
        utilizationChange: parseFloat((currentAvgUtil - lastYearAvgUtil).toFixed(2))
      }
    };

    res.json({
      success: true,
      data: {
        stats,
        anomalies,
        budgets: {
          current: currentYearBudgets,
          lastYear: lastYearBudgets,
          twoYearsAgo: twoYearsAgoBudgets
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze anomalies with AI and filter false positives
// @route   POST /api/verification/analyze
// @access  Private
exports.analyzeAnomaliesWithAI = async (req, res, next) => {
  try {
    const { anomalyIds, threshold = 70 } = req.body;

    if (!anomalyIds || anomalyIds.length === 0) {
      return res.status(400).json({ error: 'Anomaly IDs are required' });
    }

    const anomalies = await Anomaly.find({ _id: { $in: anomalyIds } })
      .populate('transaction')
      .populate('budget');

    const analysisResults = [];

    for (const anomaly of anomalies) {
      // Use AI to analyze if this is a real threat or false positive
      const analysis = await AIService.verifyAnomalyWithAI(anomaly);
      
      analysisResults.push({
        anomalyId: anomaly._id,
        originalData: {
          type: anomaly.type,
          riskLevel: anomaly.riskLevel,
          confidence: anomaly.confidence,
          description: anomaly.description
        },
        aiAnalysis: analysis,
        isFalsePositive: analysis.confidence < threshold,
        needsVerification: analysis.confidence >= threshold && analysis.riskScore >= 50
      });

      // Update anomaly with AI insights
      if (analysis.success) {
        anomaly.aiInsights = analysis.insights;
        anomaly.aiRiskScore = analysis.riskScore;
        anomaly.verificationStatus = analysis.confidence >= threshold ? 'needs_review' : 'likely_false_positive';
        await anomaly.save();
      }
    }

    // Separate anomalies that need verification
    const needsVerification = analysisResults.filter(r => r.needsVerification);
    const falsePositives = analysisResults.filter(r => r.isFalsePositive);
    const uncertain = analysisResults.filter(r => !r.needsVerification && !r.isFalsePositive);

    res.json({
      success: true,
      data: {
        total: analysisResults.length,
        needsVerification: needsVerification.length,
        falsePositives: falsePositives.length,
        uncertain: uncertain.length,
        results: analysisResults,
        categorized: {
          needsVerification,
          falsePositives,
          uncertain
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare budget patterns across years
// @route   POST /api/verification/compare-patterns
// @access  Private
exports.compareBudgetPatterns = async (req, res, next) => {
  try {
    const { budgetId, years = 2 } = req.body;

    if (!budgetId) {
      return res.status(400).json({ error: 'Budget ID is required' });
    }

    const currentBudget = await Budget.findById(budgetId).populate('department');
    if (!currentBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Extract year from financialYear string (e.g., "2025-2026" -> 2025)
    const currentYear = parseInt(currentBudget.financialYear.split('-')[0]);
    
    // Get historical data for the same scheme/department
    const historicalBudgets = await Budget.find({
      scheme: currentBudget.scheme,
      department: currentBudget.department._id,
      financialYear: { 
        $in: Array.from({ length: years }, (_, i) => {
          const year = currentYear - i - 1;
          return `${year}-${year + 1}`;
        })
      }
    }).sort({ financialYear: -1 });

    // Get transactions for all these budgets
    const allBudgetIds = [currentBudget._id, ...historicalBudgets.map(b => b._id)];
    const transactions = await Transaction.find({
      budget: { $in: allBudgetIds }
    }).populate('budget');

    // Use AI to analyze patterns and identify suspicious changes
    const patternAnalysis = await AIService.analyzeBudgetPatterns(
      currentBudget,
      historicalBudgets,
      transactions
    );

    res.json({
      success: true,
      data: {
        currentBudget,
        historicalBudgets,
        patternAnalysis,
        insights: patternAnalysis.insights
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prioritized verification queue
// @route   GET /api/verification/queue
// @access  Private
exports.getVerificationQueue = async (req, res, next) => {
  try {
    // Get all pending anomalies that need verification
    const anomalies = await Anomaly.find({
      status: { $in: ['pending', 'investigating'] },
      verificationStatus: { $ne: 'likely_false_positive' }
    })
      .populate('transaction')
      .populate('budget')
      .sort({ aiRiskScore: -1, confidence: -1, detectedDate: -1 });

    // Group by risk level and priority
    const prioritized = {
      critical: anomalies.filter(a => a.riskLevel === 'critical'),
      high: anomalies.filter(a => a.riskLevel === 'high'),
      medium: anomalies.filter(a => a.riskLevel === 'medium'),
      low: anomalies.filter(a => a.riskLevel === 'low')
    };

    // Calculate statistics
    const stats = {
      totalPending: anomalies.length,
      critical: prioritized.critical.length,
      high: prioritized.high.length,
      medium: prioritized.medium.length,
      low: prioritized.low.length,
      totalAmount: anomalies.reduce((sum, a) => sum + (a.amount || 0), 0)
    };

    res.json({
      success: true,
      data: {
        stats,
        queue: prioritized,
        allItems: anomalies
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk verify anomalies
// @route   POST /api/verification/bulk-verify
// @access  Private
exports.bulkVerifyAnomalies = async (req, res, next) => {
  try {
    const { anomalyIds, action, notes } = req.body;

    if (!anomalyIds || anomalyIds.length === 0) {
      return res.status(400).json({ error: 'Anomaly IDs are required' });
    }

    if (!['approve', 'reject', 'escalate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const updates = {
      status: action === 'approve' ? 'resolved' : action === 'reject' ? 'dismissed' : 'escalated',
      investigatedBy: req.user.id,
      investigationDate: new Date(),
      investigationNotes: notes
    };

    const result = await Anomaly.updateMany(
      { _id: { $in: anomalyIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} anomalies updated`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare current year vs past year budgets
// @route   GET /api/verification/compare-budgets
// @access  Private
exports.compareBudgets = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentFY = `${currentYear}-${currentYear + 1}`;
    const lastYearFY = `${currentYear - 1}-${currentYear}`;

    // Get 50 current year budgets
    const currentBudgets = await Budget.find({
      financialYear: currentFY
    })
      .populate('department')
      .limit(50)
      .sort({ allocatedAmount: -1 });

    // Find matching past year budgets (same scheme + department)
    const comparisons = [];
    
    for (const currentBudget of currentBudgets) {
      const pastBudget = await Budget.findOne({
        financialYear: lastYearFY,
        scheme: currentBudget.scheme,
        department: currentBudget.department._id
      }).populate('department');

      if (pastBudget) {
        const currentAmount = currentBudget.allocatedAmount || 0;
        const pastAmount = pastBudget.allocatedAmount || 0;
        
        // Calculate difference
        const absoluteDiff = currentAmount - pastAmount;
        const percentageDiff = pastAmount > 0 ? ((absoluteDiff / pastAmount) * 100) : 0;
        
        // Determine if this needs verification (>50% change or >10 Cr difference)
        const needsVerification = Math.abs(percentageDiff) > 50 || Math.abs(absoluteDiff) > 100000000;
        
        // Risk level based on change magnitude
        let riskLevel = 'low';
        if (Math.abs(percentageDiff) > 100) riskLevel = 'critical';
        else if (Math.abs(percentageDiff) > 75) riskLevel = 'high';
        else if (Math.abs(percentageDiff) > 50) riskLevel = 'medium';
        
        comparisons.push({
          id: `${currentBudget._id}-${pastBudget._id}`,
          current: {
            id: currentBudget._id,
            title: currentBudget.title,
            scheme: currentBudget.scheme,
            department: currentBudget.department.name,
            allocated: currentAmount,
            spent: currentBudget.spentAmount || 0,
            utilization: parseFloat(currentBudget.utilizationPercentage || 0),
            financialYear: currentBudget.financialYear,
            status: currentBudget.status
          },
          past: {
            id: pastBudget._id,
            title: pastBudget.title,
            scheme: pastBudget.scheme,
            department: pastBudget.department.name,
            allocated: pastAmount,
            spent: pastBudget.spentAmount || 0,
            utilization: parseFloat(pastBudget.utilizationPercentage || 0),
            financialYear: pastBudget.financialYear,
            status: pastBudget.status
          },
          difference: {
            absolute: absoluteDiff,
            percentage: parseFloat(percentageDiff.toFixed(2)),
            direction: absoluteDiff > 0 ? 'increase' : 'decrease'
          },
          needsVerification,
          riskLevel,
          verificationStatus: 'pending'
        });
      }
    }

    // Sort by percentage difference (highest first)
    comparisons.sort((a, b) => Math.abs(b.difference.percentage) - Math.abs(a.difference.percentage));

    // Summary statistics
    const stats = {
      total: comparisons.length,
      needsVerification: comparisons.filter(c => c.needsVerification).length,
      critical: comparisons.filter(c => c.riskLevel === 'critical').length,
      high: comparisons.filter(c => c.riskLevel === 'high').length,
      medium: comparisons.filter(c => c.riskLevel === 'medium').length,
      low: comparisons.filter(c => c.riskLevel === 'low').length,
      avgIncrease: comparisons.filter(c => c.difference.direction === 'increase')
        .reduce((sum, c) => sum + c.difference.percentage, 0) / comparisons.filter(c => c.difference.direction === 'increase').length || 0,
      avgDecrease: comparisons.filter(c => c.difference.direction === 'decrease')
        .reduce((sum, c) => sum + Math.abs(c.difference.percentage), 0) / comparisons.filter(c => c.difference.direction === 'decrease').length || 0
    };

    res.json({
      success: true,
      data: {
        comparisons,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze budget comparison with AI
// @route   POST /api/verification/analyze-comparison
// @access  Private
exports.analyzeBudgetComparison = async (req, res, next) => {
  try {
    const { comparisonIds } = req.body;

    if (!comparisonIds || comparisonIds.length === 0) {
      return res.status(400).json({ error: 'Comparison IDs are required' });
    }

    // Get fresh comparison data
    const currentYear = new Date().getFullYear();
    const currentFY = `${currentYear}-${currentYear + 1}`;
    const lastYearFY = `${currentYear - 1}-${currentYear}`;

    const analysisResults = [];

    for (const compId of comparisonIds) {
      const [currentId, pastId] = compId.split('-');
      
      const currentBudget = await Budget.findById(currentId).populate('department');
      const pastBudget = await Budget.findById(pastId).populate('department');

      if (!currentBudget || !pastBudget) continue;

      // Use AI to analyze the comparison
      const aiAnalysis = await AIService.analyzeBudgetComparison(currentBudget, pastBudget);

      analysisResults.push({
        comparisonId: compId,
        currentBudget: {
          id: currentBudget._id,
          title: currentBudget.title,
          allocated: currentBudget.allocatedAmount
        },
        pastBudget: {
          id: pastBudget._id,
          title: pastBudget.title,
          allocated: pastBudget.allocatedAmount
        },
        aiAnalysis
      });
    }

    res.json({
      success: true,
      data: analysisResults
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send budget comparison for verification
// @route   POST /api/verification/send-for-verification
// @access  Private
exports.sendForVerification = async (req, res, next) => {
  try {
    const { comparisonIds, notes } = req.body;

    if (!comparisonIds || comparisonIds.length === 0) {
      return res.status(400).json({ error: 'Comparison IDs are required' });
    }

    const verificationItems = [];

    for (const compId of comparisonIds) {
      const [currentId, pastId] = compId.split('-');
      
      const currentBudget = await Budget.findById(currentId).populate('department');
      const pastBudget = await Budget.findById(pastId).populate('department');

      if (!currentBudget || !pastBudget) continue;

      const percentageDiff = pastBudget.allocatedAmount > 0 
        ? (((currentBudget.allocatedAmount - pastBudget.allocatedAmount) / pastBudget.allocatedAmount) * 100)
        : 0;

      // Create an anomaly for this comparison
      const anomaly = await Anomaly.create({
        budget: currentBudget._id,
        type: 'unusual_spending_pattern',
        riskLevel: Math.abs(percentageDiff) > 100 ? 'critical' : Math.abs(percentageDiff) > 75 ? 'high' : 'medium',
        title: `Significant Budget Change Detected: ${currentBudget.scheme}`,
        description: `Budget ${percentageDiff > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentageDiff).toFixed(2)}% compared to last year (From ₹${(pastBudget.allocatedAmount / 10000000).toFixed(2)} Cr to ₹${(currentBudget.allocatedAmount / 10000000).toFixed(2)} Cr). ${notes || 'Requires verification.'}`,
        detectedDate: new Date(),
        amount: currentBudget.allocatedAmount,
        confidence: 85,
        status: 'pending',
        verificationStatus: 'needs_review',
        aiRiskScore: Math.min(Math.abs(percentageDiff), 100),
        investigationNotes: notes
      });

      verificationItems.push({
        comparisonId: compId,
        anomalyId: anomaly._id,
        currentBudget: currentBudget.title,
        pastBudget: pastBudget.title,
        change: percentageDiff.toFixed(2) + '%'
      });
    }

    res.json({
      success: true,
      message: `${verificationItems.length} items sent for verification`,
      data: verificationItems
    });
  } catch (error) {
    next(error);
  }
};
