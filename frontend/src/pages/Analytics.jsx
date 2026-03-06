import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatAmount, formatCurrency } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

const Analytics = () => {
  const { data: comparison, isLoading: loadingComparison } = useQuery({
    queryKey: ['department-comparison'],
    queryFn: analyticsAPI.getDepartmentComparison
  });

  const { data: trends } = useQuery({
    queryKey: ['spending-trends'],
    queryFn: () => analyticsAPI.getTrends({ groupBy: 'month' })
  });

  const { data: predictions } = useQuery({
    queryKey: ['predictions'],
    queryFn: analyticsAPI.getPredictions
  });

  if (loadingComparison) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600 mt-1">Comprehensive budget analysis and forecasting</p>
      </div>

      {/* Department Comparison */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Budget Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparison?.data?.slice(0, 10) || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="code" />
            <YAxis />
            <Tooltip formatter={(value) => formatAmount(value)} />
            <Legend />
            <Bar dataKey="totalAllocated" fill="#3b82f6" name="Allocated" />
            <Bar dataKey="totalSpent" fill="#10b981" name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spending Trends */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trends?.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalAmount" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Total Spending"
            />
            <Line 
              type="monotone" 
              dataKey="avgAmount" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Average Transaction"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Utilization Rates */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Utilization Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparison?.data?.slice(0, 6).map((dept, index) => (
            <div key={dept.code} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{dept.department}</h4>
                <span className="text-xs text-gray-500">{dept.code}</span>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Utilization</span>
                  <span className="font-semibold">{dept.utilizationPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, dept.utilizationPercentage)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Allocated</p>
                  <p className="font-semibold">{formatAmount(dept.totalAllocated)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Spent</p>
                  <p className="font-semibold text-green-600">{formatAmount(dept.totalSpent)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fund Lapse Predictions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fund Lapse Risk Predictions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Budget</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Department</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Available</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Days Left</th>
                <th className="text-right p-3 text-sm font-semibold text-gray-700">Risk</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {predictions?.data?.slice(0, 10).map((pred) => (
                <tr key={pred.budgetId} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm">{pred.title}</td>
                  <td className="p-3 text-sm text-gray-600">{pred.department}</td>
                  <td className="p-3 text-sm text-right font-medium">
                    {formatAmount(pred.availableAmount)}
                  </td>
                  <td className="p-3 text-sm text-right">{pred.daysRemaining}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pred.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                      pred.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                      pred.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {pred.lapseProbability}%
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{pred.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
