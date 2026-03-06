import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, anomalyAPI, budgetAPI, transactionAPI } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatAmount, formatCurrency, getRiskColor, getStatusColor } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

const Dashboard = () => {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsAPI.getOverview
  });

  const { data: anomaliesData } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => anomalyAPI.getAll({ status: 'open' })
  });

  const { data: trendsData } = useQuery({
    queryKey: ['trends'],
    queryFn: () => analyticsAPI.getTrends({ groupBy: 'month' })
  });

  if (loadingOverview) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const stats = overview?.data?.summary;
  const recentActivity = overview?.data?.recentActivity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of budget allocation and spending</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Allocated */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatAmount(stats?.financial?.totalAllocated || 0)}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {stats?.budgets?.total || 0} active budgets
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatAmount(stats?.financial?.totalSpent || 0)}
              </h3>
              <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm font-medium ${
                  stats?.financial?.utilizationPercentage > 75 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {stats?.financial?.utilizationPercentage?.toFixed(1)}% utilized
                </span>
                {stats?.financial?.utilizationPercentage > 75 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-yellow-600" />
                )}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Available */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatAmount(stats?.financial?.available || 0)}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                {stats?.transactions?.pending || 0} pending transactions
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Anomalies */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Open Anomalies</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.anomalies?.open || 0}
              </h3>
              <p className="text-sm text-red-600 mt-2">
                {stats?.anomalies?.critical || 0} critical alerts
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalAmount" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Amount Spent"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Utilization */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Status</h3>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative inline-flex">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - (stats?.financial?.utilizationPercentage || 0) / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {stats?.financial?.utilizationPercentage?.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600">Utilized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentActivity?.transactions?.slice(0, 5).map((txn) => (
              <div key={txn._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{txn.budget?.title}</p>
                  <p className="text-xs text-gray-500">{txn.transactionId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatAmount(txn.amount)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(txn.status)}`}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Anomalies */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Anomalies</h3>
          <div className="space-y-3">
            {anomaliesData?.data?.slice(0, 5).map((anomaly) => (
              <div key={anomaly._id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-gray-900 text-sm">{anomaly.title}</p>
                  <span className={`text-xs px-2 py-1 rounded ${getRiskColor(anomaly.riskLevel)}`}>
                    {anomaly.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{anomaly.description}</p>
                <p className="text-xs text-gray-500">
                  Amount: {formatAmount(anomaly.amount)} • Confidence: {anomaly.confidence}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
