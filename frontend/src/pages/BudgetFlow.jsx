import { useQuery } from '@tanstack/react-query';
import { budgetAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatAmount, formatDate } from '../utils/formatters';
import { ArrowRight, TrendingUp } from 'lucide-react';

const BudgetFlow = () => {
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetAPI.getAll({ status: 'active' })
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading budget flow..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Budget Flow Tracking</h1>
        <p className="text-gray-600 mt-1">Monitor fund allocation and spending across budgets</p>
      </div>

      {/* Budget Cards */}
      <div className="space-y-4">
        {budgets?.data?.map((budget) => (
          <div key={budget._id} className="card hover:shadow-lg transition-shadow">
            {/* Budget Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{budget.title}</h3>
                <p className="text-sm text-gray-600">{budget.scheme}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>FY: {budget.financialYear}</span>
                  <span>•</span>
                  <span>{budget.district}, {budget.state}</span>
                  <span>•</span>
                  <span>{budget.daysRemaining} days remaining</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                budget.status === 'active' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {budget.status}
              </span>
            </div>

            {/* Flow Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {/* Allocated */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">ALLOCATED</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatAmount(budget.allocatedAmount)}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <p className="text-xs text-gray-500">SPENT</p>
                    <p className="text-lg font-bold text-green-600">
                      {budget.utilizationPercentage}%
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              </div>

              {/* Available */}
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium mb-1">AVAILABLE</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatAmount(budget.availableAmount)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-600">Utilization Progress</span>
                <span className="font-semibold text-gray-900">{budget.utilizationPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    parseFloat(budget.utilizationPercentage) >= 75 ? 'bg-green-500' :
                    parseFloat(budget.utilizationPercentage) >= 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, budget.utilizationPercentage)}%` }}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium text-sm text-gray-900">{budget.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="font-medium text-sm text-gray-900">{formatDate(budget.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="font-medium text-sm text-gray-900">{formatDate(budget.endDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Risk Score</p>
                <p className={`font-medium text-sm ${
                  budget.riskScore < 30 ? 'text-green-600' :
                  budget.riskScore < 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {budget.riskScore}/100
                </p>
              </div>
            </div>
          </div>
        ))}

        {budgets?.data?.length === 0 && (
          <div className="card text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No active budgets found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetFlow;
