import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent } from '../ui';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useUserStore } from '../../stores/userStore';
import { ProgressOverview } from './ProgressOverview';
import { HabitPerformanceChart } from './HabitPerformanceChart';
import { TimeBasedAnalytics } from './TimeBasedAnalytics';
import { AchievementTracker } from './AchievementTracker';
import { HabitCorrelationAnalysis } from './HabitCorrelationAnalysis';
import { GoalProgressTracker } from './GoalProgressTracker';
import { getDateRange } from '../../utils/analyticsHelpers';

type TimeRange = 'week' | 'month' | '3months' | 'year' | 'all';

interface EnhancedAnalyticsViewProps {
  onBackToSimple?: () => void;
}

export function EnhancedAnalyticsView({ onBackToSimple }: EnhancedAnalyticsViewProps = {}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'trends' | 'achievements' | 'insights' | 'goals'>('goals');
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [showHeaderDetails, setShowHeaderDetails] = useState(false);
  
  const {
    analyticsData,
    selectedTimeRange,
    isLoading,
    error,
    lastUpdated,
    loadAnalytics,
    setTimeRange
  } = useAnalyticsStore();
  
  const { userProgress, userHabits } = useUserStore();

  // Load analytics data when component mounts or data changes
  useEffect(() => {
    if (userProgress.length > 0 && userHabits.length > 0) {
      loadAnalytics(userProgress, userHabits);
    }
  }, [userProgress, userHabits, selectedTimeRange, loadAnalytics]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    // Analytics will be reloaded by the useEffect above
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
                Complete some habits and return here to see your performance metrics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'goals' as const, name: 'Goals', icon: '🎯', isPrimary: true },
    { id: 'overview' as const, name: 'Overview', icon: '📊', isPrimary: false },
    { id: 'performance' as const, name: 'Performance', icon: '📈', isPrimary: false },
    { id: 'trends' as const, name: 'Trends', icon: '📉', isPrimary: false },
    { id: 'achievements' as const, name: 'Achievements', icon: '🏆', isPrimary: false },
    { id: 'insights' as const, name: 'Insights', icon: '🔗', isPrimary: false }
  ];

  const primaryTabs = tabs.filter(tab => tab.isPrimary);
  const secondaryTabs = tabs.filter(tab => !tab.isPrimary);

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
          <h1 className="text-2xl font-bold text-gray-900">Your progress</h1>
          <p className="text-gray-600">
            Detailed insights into your habit tracking performance
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          
          {/* Time Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{timeRangeOptions.find(opt => opt.id === selectedTimeRange)?.name || 'Time Range'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${
                  isTimeDropdownOpen ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="py-1">
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        handleTimeRangeChange(option.id);
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`flex items-center w-full px-3 py-2 text-sm transition-colors hover:bg-gray-50 hover:scale-105 transform ${
                        selectedTimeRange === option.id
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Collapsible Header Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg mb-6">
        <button
          onClick={() => setShowHeaderDetails(!showHeaderDetails)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-100 transition-colors rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <span className="text-blue-800 font-medium">
              Analyzing data from {start.toLocaleDateString()} to {end.toLocaleDateString()}
            </span>
            <span className="text-blue-600 text-sm">
              ({analyticsData.totalDaysTracked} days)
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-blue-600 transition-transform ${
              showHeaderDetails ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showHeaderDetails && (
          <div className="px-3 pb-3 space-y-2 text-sm border-t border-blue-200 pt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800">{analyticsData.totalCompletions}</div>
                <div className="text-blue-600">Total Completions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800">{Math.round(analyticsData.overallCompletionRate)}%</div>
                <div className="text-blue-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800">{analyticsData.longestOverallStreak}</div>
                <div className="text-blue-600">Longest Streak</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-800">{analyticsData.activeHabitsCount}</div>
                <div className="text-blue-600">Active Habits</div>
              </div>
            </div>
            {lastUpdated && (
              <div className="text-center pt-2 border-t border-blue-200">
                <span className="text-blue-600">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progressive Disclosure Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex items-center space-x-4">
          {/* Primary Tab - Always Visible */}
          {primaryTabs.map((tab) => (
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
            </button>
          ))}
          
          {/* Secondary Tabs - Collapsible Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNavExpanded(!isNavExpanded)}
              onMouseEnter={() => setIsNavExpanded(true)}
              className={`flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 hover:bg-gray-50 rounded-t-md ${
                secondaryTabs.some(tab => tab.id === activeTab)
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>📋</span>
              <span>More...</span>
              <svg 
                className={`w-4 h-4 transition-transform ${
                  isNavExpanded ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isNavExpanded && (
              <div 
                className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 animate-in fade-in-0 zoom-in-95 duration-200"
                onMouseLeave={() => setIsNavExpanded(false)}
              >
                <div className="py-1">
                  {secondaryTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsNavExpanded(false);
                      }}
                      className={`flex items-center space-x-3 w-full px-4 py-2 text-sm transition-colors hover:bg-gray-50 hover:scale-105 transform ${
                        activeTab === tab.id
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
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
        
        {activeTab === 'trends' && (
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
        
        {activeTab === 'goals' && (
          <GoalProgressTracker 
            analytics={analyticsData}
            habitPerformance={analyticsData.habitPerformance}
          />
        )}
        
      </div>
    </div>
  );
}