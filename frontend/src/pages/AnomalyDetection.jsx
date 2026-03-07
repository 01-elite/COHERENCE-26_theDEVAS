import { useState, useEffect } from 'react';
import { anomalyAPI } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Search, TrendingUp, TrendingDown, Shield, Eye, XCircle, Zap } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatAmount, formatDateTime, getRiskColor } from '../utils/formatters';

const AnomalyDetection = () => {
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'lastYear'
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchYearComparison();
  }, []);

  const fetchYearComparison = async () => {
    try {
      setLoading(true);
      const response = await anomalyAPI.getYearComparison();
      setComparisonData(response.data);
    } catch (error) {
      console.error('Error fetching year comparison:', error);
      alert('Failed to load anomaly comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await anomalyAPI.resolve(id, 'Manually resolved by user');
      await fetchYearComparison();
    } catch (error) {
      console.error('Error resolving anomaly:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading anomaly detection data..." />
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No anomaly data available</p>
        </div>
      </div>
    );
  }

  const { currentYear, lastYear, comparison } = comparisonData;
  const currentAnomalies = currentYear.anomalies || [];
  const lastYearAnomalies = lastYear.anomalies || [];
  const trends = comparison.trends;
  const aiAnalysis = comparison.aiAnalysis;

  // Filter anomalies based on active tab
  const activeAnomalies = activeTab === 'current' ? currentAnomalies : lastYearAnomalies;
  const filteredAnomalies = activeAnomalies.filter(anomaly => {
    const matchesFilter = filter === 'all' || anomaly.riskLevel === filter;
    const matchesSearch = anomaly.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         anomaly.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeStats = activeTab === 'current' ? currentYear.stats : lastYear.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Anomaly Detection with AI Analysis
        </h1>
        <p className="text-gray-600 mt-1">Year-over-year comparison with AI-powered insights</p>
      </div>

      {/* Year-over-Year Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Year Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Current Year</h3>
          <p className="text-sm text-blue-100 mb-2">{currentYear.financialYear}</p>
          <p className="text-4xl font-bold mb-2">{currentYear.stats.total}</p>
          <p className="text-sm text-blue-100">Total Anomalies</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-blue-100">Critical</p>
              <p className="font-semibold">{currentYear.stats.byRiskLevel.critical}</p>
            </div>
            <div>
              <p className="text-blue-100">High</p>
              <p className="font-semibold">{currentYear.stats.byRiskLevel.high}</p>
            </div>
          </div>
        </div>

        {/* Last Year Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Last Year</h3>
          <p className="text-sm text-purple-100 mb-2">{lastYear.financialYear}</p>
          <p className="text-4xl font-bold mb-2">{lastYear.stats.total}</p>
          <p className="text-sm text-purple-100">Total Anomalies</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-purple-100">Critical</p>
              <p className="font-semibold">{lastYear.stats.byRiskLevel.critical}</p>
            </div>
            <div>
              <p className="text-purple-100">High</p>
              <p className="font-semibold">{lastYear.stats.byRiskLevel.high}</p>
            </div>
          </div>
        </div>

        {/* Year-over-Year Change Card */}
        <div className={`bg-gradient-to-br ${
          trends.totalChange > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'
        } rounded-xl p-6 text-white shadow-lg`}>
          <h3 className="text-lg font-semibold mb-2">Year-over-Year</h3>
          <p className="text-sm opacity-90 mb-2">Change Analysis</p>
          <div className="flex items-center gap-2 mb-2">
            {trends.totalChange > 0 ? (
              <TrendingUp className="w-8 h-8" />
            ) : (
              <TrendingDown className="w-8 h-8" />
            )}
            <p className="text-4xl font-bold">
              {trends.totalChange > 0 ? '+' : ''}{trends.totalChange}
            </p>
          </div>
          <p className="text-sm opacity-90">
            {trends.totalChange > 0 ? 'Increase' : 'Decrease'} of {Math.abs(trends.totalChangePercent)}%
          </p>
          <div className="mt-4 text-sm">
            <p className="opacity-90">Amount Change</p>
            <p className="font-semibold">
              {trends.amountChange > 0 ? '+' : '-'}₹{(Math.abs(trends.amountChange) / 10000000).toFixed(2)} Cr
            </p>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Analysis & Insights</h2>
              <p className="text-sm text-gray-600">Powered by GPT-3.5-turbo</p>
            </div>
            <span className={`ml-auto px-4 py-2 rounded-full text-sm font-semibold ${
              aiAnalysis.overallAssessment === 'improving' ? 'bg-green-100 text-green-800' :
              aiAnalysis.overallAssessment === 'declining' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {aiAnalysis.overallAssessment?.toUpperCase()}
            </span>
          </div>

          <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-100">
            <h3 className="font-semibold text-gray-900 mb-2">Executive Summary</h3>
            <p className="text-gray-700">{aiAnalysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings */}
            {aiAnalysis.keyFindings && aiAnalysis.keyFindings.length > 0 && (
              <div className="p-4 bg-white rounded-lg border border-indigo-100">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Key Findings
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {aiAnalysis.keyFindings.map((finding, idx) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {aiAnalysis.concerns && aiAnalysis.concerns.length > 0 && (
              <div className="p-4 bg-white rounded-lg border border-red-100">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Concerns
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {aiAnalysis.concerns.map((concern, idx) => (
                    <li key={idx}>{concern}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Positives */}
            {aiAnalysis.positives && aiAnalysis.positives.length > 0 && (
              <div className="p-4 bg-white rounded-lg border border-green-100">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Positive Trends
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                  {aiAnalysis.positives.map((positive, idx) => (
                    <li key={idx}>{positive}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div className="p-4 bg-white rounded-lg border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Recommendations
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-indigo-700">
                  {aiAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Priority Actions */}
          {aiAnalysis.priorityActions && aiAnalysis.priorityActions.length > 0 && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2">Priority Actions Required</h3>
              <div className="space-y-2">
                {aiAnalysis.priorityActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-orange-900">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Gaps & Hidden Risks */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiAnalysis.dataGaps && aiAnalysis.dataGaps.length > 0 && (
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Data Gaps (What We Don't See)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-pink-700">
                  {aiAnalysis.dataGaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiAnalysis.hiddenRisks && aiAnalysis.hiddenRisks.length > 0 && (
              <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                <h3 className="font-semibold text-rose-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Hidden Risks & Sophistication
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-rose-700">
                  {aiAnalysis.hiddenRisks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Prediction Analysis */}
          {aiAnalysis.predictedTrend && (
            <div className="mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <h3 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Predictive Analysis (Next 6-12 Months)
              </h3>
              <p className="text-cyan-800 font-medium mb-2">{aiAnalysis.predictedTrend}</p>
              <p className="text-sm text-cyan-700">
                <strong>Confidence Level:</strong> {aiAnalysis.predictionConfidence?.toUpperCase() || 'Medium'}
              </p>
            </div>
          )}

          {/* Outsider Insights */}
          {aiAnalysis.outsiderInsights && aiAnalysis.outsiderInsights.length > 0 && (
            <div className="mt-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
              <h3 className="font-semibold text-violet-900 mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                What Insiders Know (Hidden Knowledge)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-violet-700">
                {aiAnalysis.outsiderInsights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Detailed Written Report Section */}
      {comparisonData.comparison?.detailedReport && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
            {/* Report Header */}
            <div className="mb-6 pb-6 border-b-2 border-gray-300">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {comparisonData.comparison?.detailedReport?.reportTitle}
              </h2>
              <p className="text-gray-600">
                Generated: {new Date(comparisonData.comparison?.detailedReport?.reportDate).toLocaleDateString()}
              </p>
            </div>

            {/* Executive Summary For Citizens */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-blue-900 mb-3">Summary for Citizens</h3>
              <p className="text-gray-800 leading-relaxed">
                {comparisonData.comparison?.detailedReport?.executiveSummaryForCitizens}
              </p>
            </div>

            {/* Key Metrics Table */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Key Metrics Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(comparisonData.comparison?.detailedReport?.keyMetrics || {}).map(([key, value]) => (
                  <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Analysis</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Trend Analysis</h4>
                  <p className="text-gray-800">{comparisonData.comparison?.detailedReport?.detailedAnalysis?.trendAnalysis}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Amount Analysis</h4>
                  <p className="text-gray-800">{comparisonData.comparison?.detailedReport?.detailedAnalysis?.amountAnalysis}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Resolution Progress</h4>
                  <p className="text-gray-800">{comparisonData.comparison?.detailedReport?.detailedAnalysis?.resolutionAnalysis}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Year-over-Year Comparison</h4>
                  <p className="text-gray-800">{comparisonData.comparison?.detailedReport?.detailedAnalysis?.comparisonWithPreviousYear}</p>
                </div>
              </div>
            </div>

            {/* What The Data Does Not Show */}
            <div className="mb-8 p-6 bg-red-50 rounded-lg border-2 border-red-300">
              <h3 className="text-xl font-bold text-red-900 mb-4">What The Data Does NOT Show</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Data Gaps (Hidden From Detection)
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.whatTheDataDoesNotShow?.dataGaps?.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Sophisticated Fraud Schemes
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.whatTheDataDoesNotShow?.sophisticatedSchemes?.map((scheme, idx) => (
                      <li key={idx}>{scheme}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    System Limitations
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.whatTheDataDoesNotShow?.limitations?.map((limit, idx) => (
                      <li key={idx}>{limit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Predictive Analysis */}
            <div className="mb-8 p-6 bg-amber-50 rounded-lg border-2 border-amber-300">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Predictive Analysis - What's Coming
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-white rounded border border-amber-200">
                  <p className="font-semibold text-amber-900 mb-2">Next 6-12 Months Forecast</p>
                  <p className="text-gray-800">
                    {comparisonData.comparison?.detailedReport?.predictiveAnalysis?.nextSixMonthsForecast}
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-amber-900 mb-3">Key Factors Influencing Prediction</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.predictiveAnalysis?.factors?.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Outsider Insights */}
            <div className="mb-8 p-6 bg-indigo-50 rounded-lg border-2 border-indigo-300">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">What Insiders Know But Data Doesn't Show</h3>
              <ul className="list-disc list-inside space-y-3 text-gray-800">
                {comparisonData.comparison?.detailedReport?.outsiderInsights?.map((insight, idx) => (
                  <li key={idx} className="text-base">{insight}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="mb-8 p-6 bg-green-50 rounded-lg border-2 border-green-300">
              <h3 className="text-xl font-bold text-green-900 mb-4">Actionable Recommendations</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-green-800 mb-3 text-lg">Immediate Actions (Next 30 Days)</h4>
                  <ul className="list-decimal list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.recommendations?.immediate?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-800 mb-3 text-lg">Short-term Improvements (3-6 Months)</h4>
                  <ul className="list-decimal list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.recommendations?.shortTerm?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-green-800 mb-3 text-lg">Long-term Strategy (6-12 Months+)</h4>
                  <ul className="list-decimal list-inside space-y-2 text-gray-800">
                    {comparisonData.comparison?.detailedReport?.recommendations?.longTerm?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Confidence & Uncertainties */}
            <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <h3 className="text-xl font-bold text-yellow-900 mb-4">Analysis Confidence & Uncertainties</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-white rounded border border-yellow-200">
                  <p className="font-semibold text-yellow-900">Overall Confidence Level</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">
                    {comparisonData.comparison?.detailedReport?.confidenceAndUncertainties?.analysisConfidence}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Known Uncertainties</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                    {comparisonData.comparison?.detailedReport?.confidenceAndUncertainties?.uncertainties?.map((unc, idx) => (
                      <li key={idx}>{unc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">Key Assumptions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                    {comparisonData.comparison?.detailedReport?.confidenceAndUncertainties?.assumptions?.map((assumption, idx) => (
                      <li key={idx}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{activeStats.total}</p>
        </div>
        <div className="card bg-red-50">
          <p className="text-sm text-red-600">Critical</p>
          <p className="text-2xl font-bold text-red-700">{activeStats.byRiskLevel.critical}</p>
        </div>
        <div className="card bg-orange-50">
          <p className="text-sm text-orange-600">High</p>
          <p className="text-2xl font-bold text-orange-700">{activeStats.byRiskLevel.high}</p>
        </div>
        <div className="card bg-yellow-50">
          <p className="text-sm text-yellow-600">Medium</p>
          <p className="text-2xl font-bold text-yellow-700">{activeStats.byRiskLevel.medium}</p>
        </div>
        <div className="card bg-blue-50">
          <p className="text-sm text-blue-600">Low</p>
          <p className="text-2xl font-bold text-blue-700">{activeStats.byRiskLevel.low}</p>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'current'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Current Year ({currentYear.financialYear})
        </button>
        <button
          onClick={() => setActiveTab('lastYear')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'lastYear'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last Year ({lastYear.financialYear})
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map((riskLevel) => (
              <button
                key={riskLevel}
                onClick={() => setFilter(riskLevel)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === riskLevel
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No anomalies found matching your criteria</p>
          </div>
        ) : (
          filteredAnomalies.map((anomaly) => (
            <div key={anomaly._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{anomaly.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(anomaly.riskLevel)}`}>
                      {anomaly.riskLevel}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      anomaly.status === 'open' || anomaly.status === 'pending' ? 'bg-red-100 text-red-700' :
                      anomaly.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {anomaly.status}
                    </span>
                    {anomaly.aiInsights && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        AI Analyzed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                  {anomaly.aiInsights && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm">
                      <strong className="text-purple-900">AI Insights: </strong>
                      <span className="text-purple-700">{anomaly.aiInsights}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
                    <span>Type: {anomaly.type.replace(/_/g, ' ')}</span>
                    <span>Amount: {formatAmount(anomaly.amount)}</span>
                    <span>Confidence: {anomaly.confidence}%</span>
                    {anomaly.aiRiskScore && <span>AI Risk: {anomaly.aiRiskScore}</span>}
                    <span>Detected: {formatDateTime(anomaly.detectedDate)}</span>
                  </div>
                </div>
                {(anomaly.status === 'open' || anomaly.status === 'pending') && activeTab === 'current' && (
                  <button
                    onClick={() => handleResolve(anomaly._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
              {anomaly.transaction && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <span className="font-medium text-gray-700">Transaction: </span>
                  <span className="text-gray-600">{anomaly.transaction.transactionId}</span>
                  {anomaly.transaction.description && (
                    <span className="ml-4 text-gray-600">- {anomaly.transaction.description}</span>
                  )}
                </div>
              )}
              {anomaly.budget && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                  <span className="font-medium text-blue-700">Budget: </span>
                  <span className="text-blue-600">{anomaly.budget.title}</span>
                  <span className="ml-4 text-blue-600">({anomaly.budget.scheme})</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnomalyDetection;
