/**
 * Enhanced Analytics View
 * 
 * Comprehensive analytics dashboard with frequency-aware insights,
 * interactive visualizations, and intelligent recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardContent } from '../ui';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useUserStore } from '../../stores/userStore';
import { calculateFrequencyAnalytics } from '../../utils/frequencyAnalyticsHelpers';
import { getDateRange } from '../../utils/analyticsHelpers';

// Enhanced components
import { HabitHeatmap } from './HabitHeatmap';
import { FrequencyAnalyticsCharts } from './FrequencyAnalyticsCharts';
import { GoalProgressIndicators } from './GoalProgressIndicators';
import { TrendAnalysisView } from './TrendAnalysisView';

// Original components for fallback
import { ProgressOverview } from './ProgressOverview';
import { HabitPerformanceChart } from './HabitPerformanceChart';
import { TimeBasedAnalytics } from './TimeBasedAnalytics';
import { AchievementTracker } from './AchievementTracker';
import { HabitCorrelationAnalysis } from './HabitCorrelationAnalysis';
import { GoalProgressTracker } from './GoalProgressTracker';
import { ReportExporter } from './ReportExporter';

// Badge and Level components
import { BadgeShowcase } from '../badges/BadgeShowcase';
import { LevelProgress } from '../levels/LevelProgress';

type TimeRange = 'week' | 'month' | '3months' | 'year' | 'all';
type AnalyticsTab = 'overview' | 'frequency' | 'heatmap' | 'goals' | 'trends' | 'performance' | 'achievements' | 'badges' | 'levels' | 'insights' | 'export';

export function EnhancedAnalyticsView() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [enhancedMode, setEnhancedMode] = useState(true);
  
  const {
    analyticsData,
    selectedTimeRange,
    isLoading,
    error,
    lastUpdated,
    loadAnalytics,
    setTimeRange
  } = useAnalyticsStore();
  
  const { currentUser, userProgress, userHabits } = useUserStore();

  // Calculate enhanced frequency analytics
  const frequencyAnalytics = useMemo(() => {
    if (!userHabits.length || !userProgress.length || !analyticsData) {
      return null;
    }

    const { start, end } = getDateRange(selectedTimeRange);
    return calculateFrequencyAnalytics(userHabits, userProgress, { start, end });
  }, [userHabits, userProgress, selectedTimeRange, analyticsData]);

  // Load analytics data when component mounts or data changes
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData || userProgress.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
              <p className="text-gray-600 mb-6">
                Start tracking habits to see detailed analytics and insights about your progress.
              </p>
              <p className="text-sm text-gray-500">
                Complete some habits and return here to see your performance metrics, trends, and frequency-aware insights.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enhancedTabs = [
    { id: 'overview' as const, name: 'Overview', icon: '📊', enhanced: false },
    { id: 'frequency' as const, name: 'Frequency Analysis', icon: '📈', enhanced: true },
    { id: 'heatmap' as const, name: 'Heatmap', icon: '🗓️', enhanced: true },
    { id: 'goals' as const, name: 'Goals', icon: '🎯', enhanced: true },
    { id: 'trends' as const, name: 'Trends', icon: '📉', enhanced: true },
    { id: 'performance' as const, name: 'Performance', icon: '⚡', enhanced: false },
    { id: 'achievements' as const, name: 'Achievements', icon: '🏆', enhanced: false },
    { id: 'badges' as const, name: 'Badges', icon: '🏅', enhanced: true },
    { id: 'levels' as const, name: 'Levels', icon: '📊', enhanced: true },
    { id: 'insights' as const, name: 'Insights', icon: '🔗', enhanced: false },
    { id: 'export' as const, name: 'Export', icon: '📤', enhanced: false }
  ];

  const timeRangeOptions: { id: TimeRange; name: string }[] = [
    { id: 'week', name: 'Last Week' },
    { id: 'month', name: 'Last Month' },
    { id: '3months', name: 'Last 3 Months' },
    { id: 'year', name: 'Last Year' },
    { id: 'all', name: 'All Time' }
  ];

  const { start, end } = getDateRange(selectedTimeRange);

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {enhancedMode ? '🚀 Enhanced Analytics' : '📊 Analytics Dashboard'}
          </h1>
          <p className="text-gray-600">
            {enhancedMode 
              ? 'Advanced insights with frequency-aware analysis and intelligent recommendations'
              : 'Detailed insights into your habit tracking performance'
            }
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Enhanced Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Enhanced:</span>
            <button
              onClick={() => setEnhancedMode(!enhancedMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enhancedMode ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enhancedMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex flex-wrap gap-1">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedTimeRange === option.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleTimeRangeChange(option.id)}
              >
                {option.name}
              </Button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800">
            <strong>Analyzing data from:</strong> {start.toLocaleDateString()} to {end.toLocaleDateString()}
          </span>
          <span className="text-blue-600">
            {analyticsData.totalDaysTracked} days • {analyticsData.totalCompletions} completions
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {enhancedTabs.map((tab) => {
            const showTab = enhancedMode || !tab.enhanced;
            if (!showTab) return null;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.enhanced && enhancedMode && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                    New
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Enhanced Analytics Content */}
        {enhancedMode && frequencyAnalytics && (
          <>
            {activeTab === 'frequency' && (
              <FrequencyAnalyticsCharts
                frequencyStats={frequencyAnalytics.frequencyBreakdown}
                weeklyGoalStats={frequencyAnalytics.weeklyGoalPerformance}
                periodicStats={frequencyAnalytics.periodicHabitStatus}
                consistencyPatterns={frequencyAnalytics.consistencyPatterns}
              />
            )}
            
            {activeTab === 'heatmap' && (
              <HabitHeatmap 
                heatmapData={frequencyAnalytics.heatmapData}
                title="Habit Completion Calendar"
                showLegend={true}
                interactive={true}
              />
            )}
            
            {activeTab === 'goals' && (
              <GoalProgressIndicators
                weeklyGoalStats={frequencyAnalytics.weeklyGoalPerformance}
                periodicStats={frequencyAnalytics.periodicHabitStatus}
                progressForecast={frequencyAnalytics.progressForecast}
              />
            )}
            
            {activeTab === 'trends' && (
              <TrendAnalysisView
                analyticsData={analyticsData}
                frequencyStats={frequencyAnalytics.frequencyBreakdown}
                optimalFrequencyInsights={frequencyAnalytics.optimalFrequencies}
                consistencyPatterns={frequencyAnalytics.consistencyPatterns}
              />
            )}
          </>
        )}

        {/* Original Analytics Content */}
        {activeTab === 'overview' && (
          <ProgressOverview analytics={analyticsData} />
        )}
        
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <HabitPerformanceChart habitPerformance={analyticsData.habitPerformance} />
            
            {/* Category Performance */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Category</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {analyticsData.categoryPerformance.map((category) => {
                    const getCategoryIcon = (cat: string) => {
                      const icons = {
                        stress: '🧘‍♀️',
                        productivity: '⚡',
                        health: '💪',
                        energy: '🔋',
                        sleep: '😴',
                        unknown: '✨'
                      };
                      return icons[cat as keyof typeof icons] || icons.unknown;
                    };

                    return (
                      <div key={category.category} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-xl">{getCategoryIcon(category.category)}</span>
                          <h4 className="font-medium text-gray-900 capitalize">{category.category}</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Habits:</span>
                            <span className="font-medium">{category.totalHabits}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completions:</span>
                            <span className="font-medium">{category.totalCompletions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avg Rate:</span>
                            <span className="font-medium">{Math.round(category.averageCompletionRate)}%</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              <strong>Best:</strong> {category.bestPerformingHabit}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {!enhancedMode && activeTab === 'trends' && (
          <TimeBasedAnalytics 
            dailyStats={analyticsData.dailyStats}
            weeklyStats={analyticsData.weeklyStats}
            monthlyStats={analyticsData.monthlyStats}
          />
        )}
        
        {activeTab === 'achievements' && (
          <AchievementTracker 
            achievements={analyticsData.achievements}
            totalCompletions={analyticsData.totalCompletions}
            longestStreak={analyticsData.longestOverallStreak}
            currentStreaks={analyticsData.currentStreaks}
          />
        )}
        
        {activeTab === 'insights' && (
          <HabitCorrelationAnalysis 
            habitPerformance={analyticsData.habitPerformance}
            dailyStats={analyticsData.dailyStats}
          />
        )}
        
        {(!enhancedMode && activeTab === 'goals') && (
          <GoalProgressTracker 
            analytics={analyticsData}
            habitPerformance={analyticsData.habitPerformance}
          />
        )}
        
        {activeTab === 'badges' && currentUser && (
          <BadgeShowcase userId={currentUser.id} />
        )}
        
        {activeTab === 'levels' && currentUser && (
          <div className="space-y-6">
            {userHabits.map(habit => (
              <LevelProgress 
                key={habit.id}
                userId={currentUser.id}
                categoryId={habit.category}
              />
            ))}
          </div>
        )}
        
        {activeTab === 'export' && (
          <ReportExporter 
            analytics={analyticsData}
            habitPerformance={analyticsData.habitPerformance}
            timeRange={selectedTimeRange}
          />
        )}
      </div>
    </div>
  );
}