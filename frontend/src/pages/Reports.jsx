import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiAPI, analyticsAPI } from '../services/api';
import { FileText, Download, Sparkles } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports = () => {
  const [reportType, setReportType] = useState('summary');
  const [generatedReport, setGeneratedReport] = useState(null);

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsAPI.getOverview
  });

  const generateReportMutation = useMutation({
    mutationFn: (data) => aiAPI.generateReport(data),
    onSuccess: (data) => {
      setGeneratedReport(data.data);
    }
  });

  const handleGenerateReport = () => {
    generateReportMutation.mutate({
      type: reportType
    });
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const blob = new Blob([generatedReport.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `govintel-report-${reportType}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Documentation</h1>
        <p className="text-gray-600 mt-1">Generate AI-powered comprehensive budget reports</p>
      </div>

      {/* Report Generator */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="summary">Executive Summary</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="anomalies">Anomaly Report</option>
              <option value="predictions">Forecast & Predictions</option>
              <option value="department">Department-wise Report</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Sparkles className="w-5 h-5" />
              {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Generated Report */}
        {generateReportMutation.isPending && (
          <div className="py-12 text-center">
            <LoadingSpinner size="lg" text="AI is generating your report..." />
          </div>
        )}

        {generatedReport && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Generated Report</h4>
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Report
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {generatedReport.report}
              </pre>
            </div>

            {/* Metadata */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Report Type</p>
                <p className="font-medium text-gray-900 capitalize">{generatedReport.metadata?.type}</p>
              </div>
              <div>
                <p className="text-gray-500">Generated At</p>
                <p className="font-medium text-gray-900">
                  {new Date(generatedReport.metadata?.generatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Budgets Analyzed</p>
                <p className="font-medium text-gray-900">{generatedReport.metadata?.budgetCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Value</p>
                <p className="font-medium text-gray-900">
                  ₹{(generatedReport.metadata?.totalAllocated / 10000000).toFixed(2)} Cr
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Total Budgets</p>
            <p className="text-2xl font-bold text-blue-700">
              {overview?.data?.summary?.budgets?.total || 0}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Total Allocated</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{((overview?.data?.summary?.financial?.totalAllocated || 0) / 10000000).toFixed(2)} Cr
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Utilization Rate</p>
            <p className="text-2xl font-bold text-purple-700">
              {overview?.data?.summary?.financial?.utilizationPercentage?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Report Types Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Executive Summary</h4>
            <p className="text-sm text-gray-600">High-level overview of budget status, key metrics, and strategic insights.</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Detailed Analysis</h4>
            <p className="text-sm text-gray-600">Comprehensive breakdown of all budgets, transactions, and spending patterns.</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Anomaly Report</h4>
            <p className="text-sm text-gray-600">Detailed analysis of detected anomalies, risk factors, and recommended actions.</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Forecast & Predictions</h4>
            <p className="text-sm text-gray-600">AI-powered predictions for fund lapse risks, spending forecasts, and trends.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
