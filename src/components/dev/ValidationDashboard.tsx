import React, { useState, useEffect } from 'react';
import { ValidationSummaryCard } from '../ui/ValidationStatus';
import { useContentValidation } from '../../hooks/useContentValidation';
import { ValidationSummary, DataInconsistency, InconsistencyReport } from '../../types/validation';

interface ValidationDashboardProps {
  className?: string;
}

export function ValidationDashboard({ className = '' }: ValidationDashboardProps) {
  const {
    validationSummary,
    validationResult,
    isValidating,
    error,
    validationStats
  } = useContentValidation({
    enableDevelopmentWarnings: true,
    autoValidateOnMount: false
  });

  const [showDetails, setShowDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const inconsistencies = validationResult?.inconsistencies || [];
  const filteredInconsistencies = selectedCategory === 'all' 
    ? inconsistencies 
    : inconsistencies.filter(i => i.type === selectedCategory);

  const inconsistencyTypes = Array.from(new Set(inconsistencies.map(i => i.type)));

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Content Validation Status</h2>
              <p className="text-sm text-gray-500">
                {isValidating ? 'Validating content...' : 'Real-time content validation monitoring'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isValidating && (
        <div className="p-4">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Validating content...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2">
            <span className="text-red-600">🚨</span>
            <span className="text-sm font-medium text-red-800">Validation Error</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {validationStats && (
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ValidationSummaryCard
              title="Critical Errors"
              count={validationStats.criticalErrors}
              status="error"
              description="Blocks build/deployment"
            />
            <ValidationSummaryCard
              title="Inconsistencies"
              count={validationStats.inconsistencies}
              status="warning"
              description="App continues with fallbacks"
            />
            <ValidationSummaryCard
              title="Content Warnings"
              count={validationStats.warnings}
              status="info"
              description="Quality improvements suggested"
            />
            <ValidationSummaryCard
              title="Habits Processed"
              count={validationStats.habitsProcessed}
              status="success"
              description={`${validationStats.researchProcessed} research articles`}
            />
          </div>
        </div>
      )}

      {/* Detailed View */}
      {showDetails && (
        <div className="border-t border-gray-200">
          {/* Category Filter */}
          {inconsistencyTypes.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Issues ({inconsistencies.length})</option>
                {inconsistencyTypes.map(type => (
                  <option key={type} value={type}>
                    {formatInconsistencyType(type)} ({inconsistencies.filter(i => i.type === type).length})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Inconsistencies Table */}
          {filteredInconsistencies.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInconsistencies.map((inconsistency, index) => (
                    <InconsistencyRow key={index} inconsistency={inconsistency} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
              <p className="text-gray-500">All content validation checks passed successfully.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface InconsistencyRowProps {
  inconsistency: DataInconsistency;
}

function InconsistencyRow({ inconsistency }: InconsistencyRowProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getSeverityBadge = (severity: string) => {
    const styles = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[severity as keyof typeof styles] || styles.medium}`}>
        {severity}
      </span>
    );
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatInconsistencyType(inconsistency.type)}
            </div>
            <div className="text-sm text-gray-500">{inconsistency.message}</div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-900">
            {inconsistency.habitId && (
              <div>
                <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                  {inconsistency.habitId}
                </span>
              </div>
            )}
            {inconsistency.researchId && (
              <div>
                <span className="font-mono text-xs bg-blue-100 px-1 rounded">
                  {inconsistency.researchId}
                </span>
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-500">{inconsistency.impact}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {getSeverityBadge(inconsistency.severity)}
            {inconsistency.suggestions.length > 0 && (
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showSuggestions ? 'Hide' : 'Fix'}
              </button>
            )}
          </div>
        </td>
      </tr>
      {showSuggestions && inconsistency.suggestions.length > 0 && (
        <tr>
          <td colSpan={4} className="px-4 py-3 bg-blue-50">
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-2">Suggested fixes:</div>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                {inconsistency.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatInconsistencyType(type: string): string {
  const formatMap: Record<string, string> = {
    'MISSING_RESEARCH': 'Missing Research',
    'ORPHANED_RESEARCH': 'Orphaned Research',
    'INVALID_GOAL_TAGS': 'Invalid Goal Tags',
    'DUPLICATE_IDS': 'Duplicate IDs',
    'MISSING_REQUIRED_FIELDS': 'Missing Required Fields'
  };

  return formatMap[type] || type.replace(/_/g, ' ');
}