import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent } from '../ui';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useUserStore } from '../../stores/userStore';

// Core components only - no overkill features
import { ProgressOverview } from './ProgressOverview';
import { HabitPerformanceChart } from './HabitPerformanceChart';
import { GoalProgressTracker } from './GoalProgressTracker';
import { ReportExporter } from './ReportExporter';

type TimeRange = 'week' | 'month' | '3months' | 'year';

export function SimpleAnalyticsView() {
  const [showExport, setShowExport] = useState(false);
  
  const {
    analyticsData,
    selectedTimeRange,
    isLoading,
    error,
    loadAnalytics,
    setTimeRange
  } = useAnalyticsStore();
  
  const { userProgress, userHabits } = useUserStore();

  // Load analytics data
  useEffect(() => {
    if (userProgress.length > 0 && userHabits.length > 0) {
      loadAnalytics(userProgress, userHabits);
    }
  }, [userProgress, userHabits, selectedTimeRange, loadAnalytics]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleRefresh = () => {
    if (userProgress.length > 0 && userHabits.length > 0) {
      loadAnalytics(userProgress, userHabits);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Analytics</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData || userProgress.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h2>
              <p className="text-gray-600">
                Start tracking habits to see your analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeRangeOptions: { id: TimeRange; name: string }[] = [
    { id: 'week', name: 'Last 7 Days' },
    { id: 'month', name: 'Last 30 Days' },
    { id: '3months', name: 'Last 3 Months' },
    { id: 'year', name: 'Last Year' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your habit progress and performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          
          {/* Export Button */}
          <Button
            onClick={() => setShowExport(!showExport)}
            variant="secondary"
            size="sm"
          >
            📤 Export Report
          </Button>
        </div>
      </div>

      {/* Export Panel */}
      {showExport && (
        <Card>
          <CardContent>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Export Analytics Report</h3>
              <ReportExporter 
                analytics={analyticsData}
                habitPerformance={analyticsData.habitPerformance || []}
                timeRange={selectedTimeRange}
              />
              <button
                onClick={() => setShowExport(false)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Close export options
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardContent>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <ProgressOverview analytics={analyticsData} />
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardContent>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Habit Performance</h2>
            <HabitPerformanceChart habitPerformance={analyticsData.habitPerformance || []} />
          </div>
        </CardContent>
      </Card>

      {/* Goal Progress */}
      <Card>
        <CardContent>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h2>
            <GoalProgressTracker 
              analytics={analyticsData}
              habitPerformance={analyticsData.habitPerformance || []}
            />
          </div>
        </CardContent>
      </Card>

      {/* Simple Stats */}
      {analyticsData && (
        <Card>
          <CardContent>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.totalCompletions}
                  </div>
                  <div className="text-sm text-gray-600">Total Completions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(analyticsData.overallCompletionRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.activeHabitsCount}
                  </div>
                  <div className="text-sm text-gray-600">Active Habits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.max(...(analyticsData.currentStreaks || [0]))}
                  </div>
                  <div className="text-sm text-gray-600">Best Streak</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}