const Anomaly = require('../models/Anomaly');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { detectAnomalies } = require('../services/anomalyDetector');
const AIService = require('../services/aiService');

// @desc    Get all anomalies
// @route   GET /api/anomalies
// @access  Private
exports.getAnomalies = async (req, res, next) => {
  try {
    const { status, riskLevel, type, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.detectedDate = {};
      if (startDate) filter.detectedDate.$gte = new Date(startDate);
      if (endDate) filter.detectedDate.$lte = new Date(endDate);
    }

    const anomalies = await Anomaly.find(filter)
      .populate('transaction', 'transactionId amount description')
      .populate('budget', 'title scheme')
      .populate('investigatedBy', 'name email')
      .sort({ detectedDate: -1 });

    res.json({
      success: true,
      count: anomalies.length,
      data: anomalies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get anomaly by ID
// @route   GET /api/anomalies/:id
// @access  Private
exports.getAnomalyById = async (req, res, next) => {
  try {
    const anomaly = await Anomaly.findById(req.params.id)
      .populate('transaction')
      .populate('budget')
      .populate('investigatedBy', 'name email')
      .populate('relatedAnomalies');

    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }

    res.json({
      success: true,
      data: anomaly
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run anomaly detection
// @route   GET /api/anomalies/detect
// @access  Private
exports.runAnomalyDetection = async (req, res, next) => {
  try {
    const { budgetId, days = 30 } = req.query;

    // Get transactions for analysis
    const filter = {
      transactionDate: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    };

    if (budgetId) filter.budget = budgetId;

    const transactions = await Transaction.find(filter).populate('budget');

    // Run anomaly detection
    const detectedAnomalies = await detectAnomalies(transactions);

    // Save new anomalies
    const savedAnomalies = await Promise.all(
      detectedAnomalies.map(anomaly => Anomaly.create(anomaly))
    );

    res.json({
      success: true,
      message: `Detected ${savedAnomalies.length} anomalies`,
      data: savedAnomalies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get high-risk anomalies
// @route   GET /api/anomalies/high-risk
// @access  Private
exports.getHighRiskAnomalies = async (req, res, next) => {
  try {
    const anomalies = await Anomaly.find({
      status: 'open',
      riskLevel: { $in: ['high', 'critical'] }
    })
      .populate('transaction', 'transactionId amount description')
      .populate('budget', 'title scheme')
      .sort({ confidence: -1, amount: -1 })
      .limit(20);

    res.json({
      success: true,
      count: anomalies.length,
      data: anomalies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update anomaly status
// @route   PUT /api/anomalies/:id
// @access  Private
exports.updateAnomaly = async (req, res, next) => {
  try {
    const { status, investigationNotes, resolution } = req.body;

    const updateData = { status };
    if (investigationNotes) updateData.investigationNotes = investigationNotes;
    if (resolution) updateData.resolution = resolution;
    if (status === 'resolved') updateData.resolvedDate = new Date();
    
    updateData.investigatedBy = req.user.userId;

    const anomaly = await Anomaly.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }

    res.json({
      success: true,
      message: 'Anomaly updated successfully',
      data: anomaly
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark anomaly as resolved
// @route   PUT /api/anomalies/:id/resolve
// @access  Private
exports.resolveAnomaly = async (req, res, next) => {
  try {
    const { resolution } = req.body;

    const anomaly = await Anomaly.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolution,
        resolvedDate: new Date(),
        investigatedBy: req.user.userId
      },
      { new: true }
    );

    if (!anomaly) {
      return res.status(404).json({ error: 'Anomaly not found' });
    }

    res.json({
      success: true,
      message: 'Anomaly resolved successfully',
      data: anomaly
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get anomaly statistics
// @route   GET /api/anomalies/stats
// @access  Private
exports.getAnomalyStats = async (req, res, next) => {
  try {
    // Count by status
    const statusCounts = await Anomaly.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Count by risk level
    const riskCounts = await Anomaly.aggregate([
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Count by type
    const typeCounts = await Anomaly.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Average resolution time for resolved anomalies
    const avgResolutionTime = await Anomaly.aggregate([
      {
        $match: { status: 'resolved', resolvedDate: { $exists: true } }
      },
      {
        $project: {
          resolutionDays: {
            $divide: [
              { $subtract: ['$resolvedDate', '$detectedDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$resolutionDays' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: statusCounts,
        byRiskLevel: riskCounts,
        byType: typeCounts,
        avgResolutionDays: avgResolutionTime[0]?.avgDays?.toFixed(2) || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get year-over-year anomaly comparison with AI analysis
// @route   GET /api/anomalies/year-comparison
// @access  Private
exports.getYearComparison = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentFY = `${currentYear}-${currentYear + 1}`;
    const lastYearFY = `${currentYear - 1}-${currentYear}`;

    // Get current year budgets
    const currentYearBudgets = await Budget.find({
      financialYear: currentFY
    }).select('_id');

    // Get last year budgets
    const lastYearBudgets = await Budget.find({
      financialYear: lastYearFY
    }).select('_id');

    const currentBudgetIds = currentYearBudgets.map(b => b._id);
    const lastYearBudgetIds = lastYearBudgets.map(b => b._id);

    // Get anomalies for current year
    const currentYearAnomalies = await Anomaly.find({
      budget: { $in: currentBudgetIds }
    })
      .populate('transaction', 'transactionId amount description beneficiary transactionDate')
      .populate('budget', 'title scheme department financialYear')
      .sort({ detectedDate: -1 });

    // Get anomalies for last year
    const lastYearAnomalies = await Anomaly.find({
      budget: { $in: lastYearBudgetIds }
    })
      .populate('transaction', 'transactionId amount description beneficiary transactionDate')
      .populate('budget', 'title scheme department financialYear')
      .sort({ detectedDate: -1 });

    // Calculate statistics for current year
    const currentStats = {
      total: currentYearAnomalies.length,
      byRiskLevel: {
        critical: currentYearAnomalies.filter(a => a.riskLevel === 'critical').length,
        high: currentYearAnomalies.filter(a => a.riskLevel === 'high').length,
        medium: currentYearAnomalies.filter(a => a.riskLevel === 'medium').length,
        low: currentYearAnomalies.filter(a => a.riskLevel === 'low').length
      },
      byStatus: {
        open: currentYearAnomalies.filter(a => a.status === 'open' || a.status === 'pending').length,
        investigating: currentYearAnomalies.filter(a => a.status === 'investigating').length,
        resolved: currentYearAnomalies.filter(a => a.status === 'resolved').length,
        dismissed: currentYearAnomalies.filter(a => a.status === 'dismissed').length
      },
      byType: {},
      totalAmount: currentYearAnomalies.reduce((sum, a) => sum + (a.amount || 0), 0),
      avgConfidence: currentYearAnomalies.length > 0 
        ? currentYearAnomalies.reduce((sum, a) => sum + a.confidence, 0) / currentYearAnomalies.length 
        : 0
    };

    // Group by type
    currentYearAnomalies.forEach(a => {
      currentStats.byType[a.type] = (currentStats.byType[a.type] || 0) + 1;
    });

    // Calculate statistics for last year
    const lastYearStats = {
      total: lastYearAnomalies.length,
      byRiskLevel: {
        critical: lastYearAnomalies.filter(a => a.riskLevel === 'critical').length,
        high: lastYearAnomalies.filter(a => a.riskLevel === 'high').length,
        medium: lastYearAnomalies.filter(a => a.riskLevel === 'medium').length,
        low: lastYearAnomalies.filter(a => a.riskLevel === 'low').length
      },
      byStatus: {
        open: lastYearAnomalies.filter(a => a.status === 'open' || a.status === 'pending').length,
        investigating: lastYearAnomalies.filter(a => a.status === 'investigating').length,
        resolved: lastYearAnomalies.filter(a => a.status === 'resolved').length,
        dismissed: lastYearAnomalies.filter(a => a.status === 'dismissed').length
      },
      byType: {},
      totalAmount: lastYearAnomalies.reduce((sum, a) => sum + (a.amount || 0), 0),
      avgConfidence: lastYearAnomalies.length > 0 
        ? lastYearAnomalies.reduce((sum, a) => sum + a.confidence, 0) / lastYearAnomalies.length 
        : 0
    };

    lastYearAnomalies.forEach(a => {
      lastYearStats.byType[a.type] = (lastYearStats.byType[a.type] || 0) + 1;
    });

    // Calculate trends
    const trends = {
      totalChange: currentStats.total - lastYearStats.total,
      totalChangePercent: lastYearStats.total > 0 
        ? ((currentStats.total - lastYearStats.total) / lastYearStats.total * 100).toFixed(2) 
        : 0,
      criticalChange: currentStats.byRiskLevel.critical - lastYearStats.byRiskLevel.critical,
      highRiskChange: currentStats.byRiskLevel.high - lastYearStats.byRiskLevel.high,
      amountChange: currentStats.totalAmount - lastYearStats.totalAmount,
      amountChangePercent: lastYearStats.totalAmount > 0 
        ? ((currentStats.totalAmount - lastYearStats.totalAmount) / lastYearStats.totalAmount * 100).toFixed(2) 
        : 0
    };

    // Use AI to analyze the year-over-year comparison
    const aiPrompt = `Analyze this year-over-year anomaly detection comparison for a government budget monitoring system:

CURRENT YEAR (${currentFY}):
- Total Anomalies: ${currentStats.total}
- Critical: ${currentStats.byRiskLevel.critical}, High: ${currentStats.byRiskLevel.high}, Medium: ${currentStats.byRiskLevel.medium}, Low: ${currentStats.byRiskLevel.low}
- Total Amount Involved: ₹${(currentStats.totalAmount / 10000000).toFixed(2)} Cr
- Open Cases: ${currentStats.byStatus.open}
- Average Confidence: ${currentStats.avgConfidence.toFixed(2)}%

LAST YEAR (${lastYearFY}):
- Total Anomalies: ${lastYearStats.total}
- Critical: ${lastYearStats.byRiskLevel.critical}, High: ${lastYearStats.byRiskLevel.high}, Medium: ${lastYearStats.byRiskLevel.medium}, Low: ${lastYearStats.byRiskLevel.low}
- Total Amount Involved: ₹${(lastYearStats.totalAmount / 10000000).toFixed(2)} Cr
- Open Cases: ${lastYearStats.byStatus.open}
- Average Confidence: ${lastYearStats.avgConfidence.toFixed(2)}%

YEAR-OVER-YEAR CHANGES:
- Total Anomalies: ${trends.totalChange > 0 ? '+' : ''}${trends.totalChange} (${trends.totalChangePercent}%)
- Critical Cases: ${trends.criticalChange > 0 ? '+' : ''}${trends.criticalChange}
- High Risk Cases: ${trends.highRiskChange > 0 ? '+' : ''}${trends.highRiskChange}
- Amount Involved: ${trends.amountChange > 0 ? '+' : ''}₹${(Math.abs(trends.amountChange) / 10000000).toFixed(2)} Cr (${trends.amountChangePercent}%)

Provide analysis in JSON format:
{
  "overallAssessment": "improving/declining/stable",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "concerns": ["concern1", "concern2"],
  "positives": ["positive1", "positive2"],
  "riskLevel": "low/medium/high/critical",
  "recommendations": ["rec1", "rec2", "rec3"],
  "summary": "brief executive summary",
  "priorityActions": ["action1", "action2"]
}`;

    const systemContext = `You are a government financial oversight expert specializing in anomaly detection and fraud prevention. 
You analyze patterns in budget irregularities and provide actionable insights for improving financial controls.`;

    let aiAnalysis = {
      overallAssessment: 'stable',
      keyFindings: [],
      concerns: [],
      positives: [],
      riskLevel: 'medium',
      recommendations: [],
      summary: 'Analysis pending',
      priorityActions: []
    };

    try {
      const aiResponse = await AIService.generateResponse(aiPrompt, systemContext, {
        temperature: 0.4,
        maxTokens: 800
      });

      // Try to parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        aiAnalysis.summary = aiResponse.substring(0, 300);
      }
    } catch (aiError) {
      console.error('AI Analysis Error:', aiError);
      // Provide basic analysis if AI fails
      if (trends.totalChangePercent > 20) {
        aiAnalysis.overallAssessment = 'declining';
        aiAnalysis.keyFindings = ['Significant increase in anomalies detected'];
        aiAnalysis.concerns = ['Rising number of irregularities', 'Increased financial risk exposure'];
        aiAnalysis.recommendations = ['Strengthen internal controls', 'Conduct comprehensive audit'];
        aiAnalysis.summary = `Anomaly detection shows a ${trends.totalChangePercent}% increase from last year, indicating deteriorating financial controls.`;
      } else if (trends.totalChangePercent < -20) {
        aiAnalysis.overallAssessment = 'improving';
        aiAnalysis.keyFindings = ['Significant decrease in anomalies'];
        aiAnalysis.positives = ['Improved financial controls', 'Better compliance'];
        aiAnalysis.summary = `Anomaly detection shows a ${Math.abs(trends.totalChangePercent)}% decrease from last year, indicating improved financial management.`;
      }
    }

    res.json({
      success: true,
      data: {
        currentYear: {
          financialYear: currentFY,
          anomalies: currentYearAnomalies,
          stats: currentStats
        },
        lastYear: {
          financialYear: lastYearFY,
          anomalies: lastYearAnomalies,
          stats: lastYearStats
        },
        comparison: {
          trends,
          aiAnalysis
        }
      }
    });
  } catch (error) {
    console.error('Year Comparison Error:', error);
    next(error);
  }
};
