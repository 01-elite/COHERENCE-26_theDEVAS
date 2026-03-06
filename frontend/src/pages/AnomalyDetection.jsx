import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { anomalyAPI } from '../services/api';
import { AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatAmount, formatDateTime, getRiskColor } from '../utils/formatters';

const AnomalyDetection = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: anomalies, isLoading, refetch } = useQuery({
    queryKey: ['anomalies', filter],
    queryFn: () => {
      const params = {};
      if (filter !== 'all') params.status = filter;
      return anomalyAPI.getAll(params);
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['anomaly-stats'],
    queryFn: anomalyAPI.getStats
  });

  const handleResolve = async (id) => {
    try {
      await anomalyAPI.resolve(id, 'Manually resolved by user');
      refetch();
    } catch (error) {
      console.error('Error resolving anomaly:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading anomalies..." />
      </div>
    );
  }

  const filteredAnomalies = anomalies?.data?.filter(anomaly =>
    anomaly.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anomaly.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Anomaly Detection</h1>
        <p className="text-gray-600 mt-1">AI-powered detection of suspicious budget activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Anomalies</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {anomalies?.count || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.data?.byStatus?.find(s => s._id === 'open')?.count || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.data?.byStatus?.find(s => s._id === 'resolved')?.count || 0}
              </h3>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Resolution</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.data?.avgResolutionDays || 0} days
              </h3>
            </div>
          </div>
        </div>
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
            {['all', 'open', 'investigating', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filteredAnomalies.map((anomaly) => (
          <div key={anomaly._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{anomaly.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(anomaly.riskLevel)}`}>
                    {anomaly.riskLevel}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    anomaly.status === 'open' ? 'bg-red-100 text-red-700' :
                    anomaly.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {anomaly.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Type: {anomaly.type.replace(/_/g, ' ')}</span>
                  <span>Amount: {formatAmount(anomaly.amount)}</span>
                  <span>Confidence: {anomaly.confidence}%</span>
                  <span>Detected: {formatDateTime(anomaly.detectedDate)}</span>
                </div>
              </div>
              {anomaly.status === 'open' && (
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
                <span className="font-medium text-gray-700">Transaction ID: </span>
                <span className="text-gray-600">{anomaly.transaction.transactionId}</span>
              </div>
            )}
          </div>
        ))}
        
        {filteredAnomalies.length === 0 && (
          <div className="card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No anomalies found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyDetection;
