import { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle, Filter, RefreshCw, Eye, AlertOctagon, GitCompare, Send } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BudgetVerification = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [verificationQueue, setVerificationQueue] = useState(null);
  const [selectedAnomalies, setSelectedAnomalies] = useState([]);
  const [filter, setFilter] = useState('all');
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // Budget Comparison State
  const [comparisons, setComparisons] = useState([]);
  const [loadingComparisons, setLoadingComparisons] = useState(false);
  const [selectedComparisons, setSelectedComparisons] = useState([]);
  const [comparisonAnalysis, setComparisonAnalysis] = useState({});
  const [analyzingComparisons, setAnalyzingComparisons] = useState(false);
  const [sendingForVerification, setSendingForVerification] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, queueRes] = await Promise.all([
        api.get('/verification/dashboard'),
        api.get('/verification/queue')
      ]);
      // API interceptor already unwraps response.data, so we access directly
      setDashboardData(dashboardRes.data);
      setVerificationQueue(queueRes.data);
    } catch (error) {
      console.error('Error fetching verification data:', error);
      alert('Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (selectedAnomalies.length === 0) {
      alert('Please select anomalies to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await api.post('/verification/analyze', {
        anomalyIds: selectedAnomalies,
        threshold: 70
      });
      // API interceptor already unwraps response.data, so we access directly
      setAnalysisResults(response.data);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error analyzing anomalies:', error);
      alert('Failed to analyze anomalies with AI');
    } finally {
      setAnalyzing(false);
    }
  };

  const bulkVerify = async (action) => {
    if (selectedAnomalies.length === 0) {
      alert('Please select anomalies to verify');
      return;
    }

    const notes = prompt(`Enter notes for ${action} action:`);
    if (!notes) return;

    try {
      await api.post('/verification/bulk-verify', {
        anomalyIds: selectedAnomalies,
        action,
        notes
      });
      setSelectedAnomalies([]);
      setAnalysisResults(null);
      await fetchData();
      alert(`Successfully ${action}ed ${selectedAnomalies.length} anomalies`);
    } catch (error) {
      console.error('Error bulk verifying:', error);
      alert('Failed to verify anomalies');
    }
  };

  const toggleSelection = (anomalyId) => {
    setSelectedAnomalies(prev => 
      prev.includes(anomalyId) 
        ? prev.filter(id => id !== anomalyId)
        : [...prev, anomalyId]
    );
  };

  const selectAll = () => {
    if (!verificationQueue?.allItems) return;
    const filteredItems = getFilteredAnomalies();
    const allIds = filteredItems.map(a => a._id);
    setSelectedAnomalies(allIds);
  };

  const clearSelection = () => {
    setSelectedAnomalies([]);
  };

  // Budget Comparison Functions
  const fetchComparisons = async () => {
    try {
      setLoadingComparisons(true);
      const response = await api.get('/verification/compare-budgets');
      // API interceptor already unwraps response.data, so we access directly
      setComparisons(response.data?.comparisons || []);
    } catch (error) {
      console.error('Error fetching budget comparisons:', error);
      alert('Failed to load budget comparisons');
    } finally {
      setLoadingComparisons(false);
    }
  };

  const analyzeComparisonWithAI = async (comparisonIds) => {
    try {
      setAnalyzingComparisons(true);
      const response = await api.post('/verification/analyze-comparison', {
        comparisonIds: comparisonIds || selectedComparisons
      });
      
      // Store analysis results indexed by comparison ID
      // API interceptor already unwraps response.data, so we access directly
      const newAnalysis = {};
      const analyses = response.data?.analyses || [];
      analyses.forEach(analysis => {
        newAnalysis[analysis.comparisonId] = analysis;
      });
      setComparisonAnalysis(prev => ({ ...prev, ...newAnalysis }));
      
      alert(`Successfully analyzed ${(comparisonIds || selectedComparisons).length} comparisons with AI`);
    } catch (error) {
      console.error('Error analyzing comparisons:', error);
      alert('Failed to analyze comparisons with AI');
    } finally {
      setAnalyzingComparisons(false);
    }
  };

  const sendComparisonsForVerification = async () => {
    if (selectedComparisons.length === 0) {
      alert('Please select comparisons to send for verification');
      return;
    }

    try {
      setSendingForVerification(true);
      const response = await api.post('/verification/send-for-verification', {
        comparisonIds: selectedComparisons
      });
      
      setSelectedComparisons([]);
      await fetchData(); // Refresh verification queue
      // API interceptor already unwraps response.data, so we access directly
      const created = response.data?.created || selectedComparisons.length;
      alert(`Successfully sent ${created} items for verification`);
    } catch (error) {
      console.error('Error sending for verification:', error);
      alert('Failed to send comparisons for verification');
    } finally {
      setSendingForVerification(false);
    }
  };

  const toggleComparisonSelection = (comparisonId) => {
    setSelectedComparisons(prev =>
      prev.includes(comparisonId)
        ? prev.filter(id => id !== comparisonId)
        : [...prev, comparisonId]
    );
  };

  const selectAllComparisons = () => {
    const needsVerification = comparisons.filter(c => c.needsVerification);
    setSelectedComparisons(needsVerification.map(c => c.id));
  };

  const clearComparisonSelection = () => {
    setSelectedComparisons([]);
  };

  const getFilteredAnomalies = () => {
    if (!verificationQueue?.allItems) return [];
    
    switch (filter) {
      case 'critical':
        return verificationQueue.queue.critical;
      case 'high':
        return verificationQueue.queue.high;
      case 'medium':
        return verificationQueue.queue.medium;
      case 'low':
        return verificationQueue.queue.low;
      case 'needs_review':
        return verificationQueue.allItems.filter(a => a.verificationStatus === 'needs_review');
      case 'false_positive':
        return verificationQueue.allItems.filter(a => a.verificationStatus === 'likely_false_positive');
      default:
        return verificationQueue.allItems;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const filteredAnomalies = getFilteredAnomalies();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Budget Verification & AI Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Compare 2-year trends, filter false reports, and highlight items needing verification
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Year Comparison Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Year */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Current Year</h3>
          <p className="text-3xl font-bold">
            ₹{((stats?.currentYear?.total || 0) / 10000000).toFixed(2)} Cr
          </p>
          <p className="text-blue-100 text-sm mt-2">
            {stats?.currentYear?.budgetCount || 0} Budgets | {(stats?.currentYear?.avgUtilization || 0).toFixed(1)}% Avg Utilization
          </p>
        </div>

        {/* Last Year */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Last Year</h3>
          <p className="text-3xl font-bold">
            ₹{((stats?.lastYear?.total || 0) / 10000000).toFixed(2)} Cr
          </p>
          <p className="text-purple-100 text-sm mt-2">
            {stats?.lastYear?.budgetCount || 0} Budgets | {(stats?.lastYear?.avgUtilization || 0).toFixed(1)}% Avg Utilization
          </p>
        </div>

        {/* 2 Years Ago */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">2 Years Ago</h3>
          <p className="text-3xl font-bold">
            ₹{((stats?.twoYearsAgo?.total || 0) / 10000000).toFixed(2)} Cr
          </p>
          <p className="text-indigo-100 text-sm mt-2">
            {stats?.twoYearsAgo?.budgetCount || 0} Budgets | {(stats?.twoYearsAgo?.avgUtilization || 0).toFixed(1)}% Avg Utilization
          </p>
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Year-over-Year Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${(stats?.trends?.budgetGrowth || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-6 h-6 ${(stats?.trends?.budgetGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget Growth</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.trends?.budgetGrowth || 0).toFixed(2)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${(stats?.trends?.utilizationChange || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-6 h-6 ${(stats?.trends?.utilizationChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilization Change</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.trends?.utilizationChange || 0).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Pending</p>
          <p className="text-2xl font-bold text-gray-900">{verificationQueue?.stats?.totalPending || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-600">Critical</p>
          <p className="text-2xl font-bold text-red-700">{verificationQueue?.stats?.critical || 0}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4">
          <p className="text-sm text-orange-600">High Risk</p>
          <p className="text-2xl font-bold text-orange-700">{verificationQueue?.stats?.high || 0}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-600">Medium Risk</p>
          <p className="text-2xl font-bold text-yellow-700">{verificationQueue?.stats?.medium || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-600">Low Risk</p>
          <p className="text-2xl font-bold text-blue-700">{verificationQueue?.stats?.low || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Verification Queue</h2>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Anomalies</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Risk Only</option>
              <option value="medium">Medium Risk Only</option>
              <option value="low">Low Risk Only</option>
              <option value="needs_review">Needs Review</option>
              <option value="false_positive">Likely False Positives</option>
            </select>

            {/* Selection Actions */}
            {selectedAnomalies.length > 0 && (
              <>
                <span className="text-sm text-gray-600">{selectedAnomalies.length} selected</span>
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </>
            )}
            <button
              onClick={selectAll}
              className="px-4 py-2 text-primary hover:bg-primary-light rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={analyzeWithAI}
              disabled={analyzing || selectedAnomalies.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              {analyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedAnomalies.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-semibold text-gray-700">Bulk Actions:</span>
            <button
              onClick={() => bulkVerify('approve')}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => bulkVerify('reject')}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <XCircle className="w-4 h-4" />
              Dismiss
            </button>
            <button
              onClick={() => bulkVerify('escalate')}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              <AlertOctagon className="w-4 h-4" />
              Escalate
            </button>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysisResults && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">AI Analysis Results</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-blue-700">Needs Verification</p>
                <p className="text-2xl font-bold text-blue-900">{analysisResults.needsVerification}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">False Positives</p>
                <p className="text-2xl font-bold text-green-900">{analysisResults.falsePositives}</p>
              </div>
              <div>
                <p className="text-sm text-yellow-700">Uncertain</p>
                <p className="text-2xl font-bold text-yellow-900">{analysisResults.uncertain}</p>
              </div>
            </div>
            <button
              onClick={() => setAnalysisResults(null)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Results
            </button>
          </div>
        )}

        {/* Anomaly List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredAnomalies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No anomalies found matching the current filter</p>
            </div>
          ) : (
            filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly._id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedAnomalies.includes(anomaly._id)
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${anomaly.verificationStatus === 'likely_false_positive' ? 'opacity-60' : ''}`}
                onClick={() => toggleSelection(anomaly._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedAnomalies.includes(anomaly._id)}
                        onChange={() => toggleSelection(anomaly._id)}
                        className="w-4 h-4 text-primary focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        anomaly.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        anomaly.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                        anomaly.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.riskLevel?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{anomaly.type}</span>
                      {anomaly.verificationStatus === 'likely_false_positive' && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                          Likely False Positive
                        </span>
                      )}
                      {anomaly.verificationStatus === 'needs_review' && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                          Needs Review
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{anomaly.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                    {anomaly.aiInsights && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>AI Insights:</strong> {anomaly.aiInsights}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Amount: ₹{anomaly.amount?.toLocaleString('en-IN')}</span>
                      <span>Confidence: {anomaly.confidence}%</span>
                      {anomaly.aiRiskScore && <span>AI Risk Score: {anomaly.aiRiskScore}</span>}
                      <span>Detected: {new Date(anomaly.detectedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Budget Comparison Section - 50 Current vs 50 Past */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              Budget Comparison: Current vs Past Year
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Compare current year budgets with past year data and identify large discrepancies
            </p>
          </div>
          <button
            onClick={fetchComparisons}
            disabled={loadingComparisons}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingComparisons ? 'animate-spin' : ''}`} />
            {loadingComparisons ? 'Loading...' : 'Load Comparisons'}
          </button>
        </div>

        {/* Comparison Actions */}
        {comparisons.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-semibold text-gray-700">
              {selectedComparisons.length} selected
            </span>
            <button
              onClick={selectAllComparisons}
              className="px-3 py-1.5 text-primary hover:bg-primary-light rounded-lg transition-colors text-sm"
            >
              Select All (Needs Verification)
            </button>
            <button
              onClick={clearComparisonSelection}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              Clear Selection
            </button>
            <div className="flex-1" />
            <button
              onClick={() => analyzeComparisonWithAI()}
              disabled={analyzingComparisons || selectedComparisons.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Shield className="w-4 h-4" />
              {analyzingComparisons ? 'Analyzing...' : 'Analyze with AI'}
            </button>
            <button
              onClick={sendComparisonsForVerification}
              disabled={sendingForVerification || selectedComparisons.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Send className="w-4 h-4" />
              {sendingForVerification ? 'Sending...' : 'Send for Verification'}
            </button>
          </div>
        )}

        {/* Comparison Table */}
        {loadingComparisons ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : comparisons.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <GitCompare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No budget comparisons available</p>
            <button
              onClick={fetchComparisons}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Load Comparisons
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedComparisons.length > 0 && selectedComparisons.length === comparisons.filter(c => c.needsVerification).length}
                      onChange={selectAllComparisons}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Scheme
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Current Year
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Past Year
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisons.map((comparison) => {
                  const analysis = comparisonAnalysis[comparison.id];
                  return (
                    <tr
                      key={comparison.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedComparisons.includes(comparison.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleComparisonSelection(comparison.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedComparisons.includes(comparison.id)}
                          onChange={() => toggleComparisonSelection(comparison.id)}
                          className="w-4 h-4 text-primary focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {comparison.current.scheme}
                        </div>
                        <div className="text-xs text-gray-500">
                          {comparison.current.financialYear} vs {comparison.past.financialYear}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {comparison.current.department || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{(comparison.current.allocated / 10000000).toFixed(2)} Cr
                        </div>
                        <div className="text-xs text-gray-500">
                          {comparison.current.utilization || 0}% utilized
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{(comparison.past.allocated / 10000000).toFixed(2)} Cr
                        </div>
                        <div className="text-xs text-gray-500">
                          {comparison.past.utilization || 0}% utilized
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`text-sm font-bold ${
                          comparison.difference.direction === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {comparison.difference.direction === 'increase' ? '+' : '-'}
                          ₹{(Math.abs(comparison.difference.absolute) / 10000000).toFixed(2)} Cr
                        </div>
                        <div className={`text-xs font-semibold ${
                          comparison.difference.direction === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {comparison.difference.direction === 'increase' ? '+' : '-'}
                          {Math.abs(comparison.difference.percentage).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          comparison.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                          comparison.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                          comparison.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {comparison.riskLevel?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comparison.needsVerification ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                            Verification Required
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* AI Analysis Results for Selected Comparisons */}
            {Object.keys(comparisonAnalysis).length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Analysis Results</h3>
                {Object.entries(comparisonAnalysis).map(([comparisonId, analysis]) => {
                  const comparison = comparisons.find(c => c.id === comparisonId);
                  if (!comparison) return null;

                  return (
                    <div key={comparisonId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{comparison.current.scheme}</h4>
                          <p className="text-sm text-gray-600">
                            {comparison.current.financialYear} vs {comparison.past.financialYear}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${
                          analysis.isJustified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {analysis.isJustified ? 'Justified' : 'Suspicious'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-600">Confidence</p>
                          <p className="text-sm font-semibold text-gray-900">{analysis.confidence}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Risk Score</p>
                          <p className="text-sm font-semibold text-gray-900">{analysis.riskScore}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Risk Level</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{analysis.riskLevel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Action Required</p>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{analysis.actionRequired}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Reasoning:</p>
                          <p className="text-sm text-gray-600">{analysis.reasoning}</p>
                        </div>

                        {analysis.redFlags && analysis.redFlags.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-red-700">Red Flags:</p>
                            <ul className="list-disc list-inside text-sm text-red-600">
                              {analysis.redFlags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.justificationFactors && analysis.justificationFactors.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-green-700">Justification Factors:</p>
                            <ul className="list-disc list-inside text-sm text-green-600">
                              {analysis.justificationFactors.map((factor, idx) => (
                                <li key={idx}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-blue-700">Recommendations:</p>
                            <ul className="list-disc list-inside text-sm text-blue-600">
                              {analysis.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetVerification;
