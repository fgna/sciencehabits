/**
 * User Journey Visualization Component
 * 
 * Displays visual analytics and journey patterns for mock user profiles
 * including completion trends, behavioral insights, and pattern analysis.
 */

import React, { useMemo } from 'react';
import { MockUserProfile, DailyProgress } from '../../types/testing';

interface UserJourneyVisualizationProps {
  user: MockUserProfile;
  comparisonUsers?: MockUserProfile[];
  timeRange?: 'week' | 'month' | 'all';
}

export const UserJourneyVisualization: React.FC<UserJourneyVisualizationProps> = ({
  user,
  comparisonUsers = [],
  timeRange = 'week'
}) => {
  const chartData = useMemo(() => {
    const data = timeRange === 'week' 
      ? user.analytics.lastSevenDays 
      : user.analytics.monthlyProgress.slice(-30).map(m => ({
          date: `${m.month}-15`,
          habitsCompleted: m.habitsCompleted,
          habitsTotal: Math.ceil(m.habitsCompleted / (m.completionRate / 100)),
          completionRate: m.completionRate,
          streaksActive: 0,
          timeSpentInApp: 0,
          mood: 'neutral'
        }));
    
    return data.slice(-7); // Last 7 data points
  }, [user, timeRange]);

  const getCompletionTrend = () => {
    if (chartData.length < 2) return 'stable';
    
    const recent = chartData.slice(-3).map(d => d.completionRate);
    const earlier = chartData.slice(-6, -3).map(d => d.completionRate);
    
    const recentAvg = recent.reduce((sum, rate) => sum + rate, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, rate) => sum + rate, 0) / earlier.length;
    
    if (recentAvg > earlierAvg + 10) return 'improving';
    if (recentAvg < earlierAvg - 10) return 'declining';
    return 'stable';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getMaxValue = () => {
    return Math.max(...chartData.map(d => Math.max(d.habitsCompleted, d.habitsTotal)), 5);
  };

  const getInsights = () => {
    const insights = [];
    
    // Completion rate insights
    if (user.analytics.completionRate > 80) {
      insights.push({ type: 'positive', message: 'Excellent completion consistency' });
    } else if (user.analytics.completionRate < 40) {
      insights.push({ type: 'warning', message: 'Low completion rate indicates struggle' });
    }
    
    // Streak insights
    if (user.analytics.currentStreak > user.analytics.longestStreak * 0.8) {
      insights.push({ type: 'positive', message: 'Currently on best streak performance' });
    }
    
    // Behavioral insights
    if (user.behavior.strugglingAreas.length > 2) {
      insights.push({ type: 'warning', message: `Multiple struggling areas: ${user.behavior.strugglingAreas.slice(0, 2).join(', ')}` });
    }
    
    // Engagement insights
    if (user.behavior.engagementLevel === 'high' && user.analytics.completionRate > 70) {
      insights.push({ type: 'positive', message: 'High engagement translating to strong results' });
    }
    
    return insights;
  };

  const trend = getCompletionTrend();
  const maxValue = getMaxValue();
  const insights = getInsights();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Journey Visualization</h3>
            <p className="text-sm text-gray-600">{user.name} - {user.scenario.replace('_', ' ')} pattern</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
              <span>{getTrendIcon(trend)}</span>
              <span className="text-sm font-medium capitalize">{trend}</span>
            </div>
            
            <select 
              className="text-sm border border-gray-300 rounded px-2 py-1"
              value={timeRange}
              onChange={() => {}} // Would be handled by parent component
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="mb-6">
          <div className="flex items-end space-x-1 h-32 bg-gray-50 rounded p-4">
            {chartData.map((day, index) => {
              const completedHeight = (day.habitsCompleted / maxValue) * 100;
              const totalHeight = (day.habitsTotal / maxValue) * 100;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative mb-2" style={{ height: '80px' }}>
                    {/* Total habits bar (background) */}
                    <div 
                      className="absolute bottom-0 w-full bg-gray-200 rounded-sm"
                      style={{ height: `${totalHeight}%` }}
                    />
                    {/* Completed habits bar */}
                    <div 
                      className={`absolute bottom-0 w-full rounded-sm ${
                        day.completionRate >= 80 ? 'bg-green-500' :
                        day.completionRate >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ height: `${completedHeight}%` }}
                    />
                    
                    {/* Completion rate label */}
                    {day.completionRate > 0 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs text-gray-600">{day.completionRate}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Date label */}
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Chart Legend */}
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>Completed (80%+)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
              <span>Partial (60-79%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>Low (under 60%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
              <span>Target</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{user.analytics.currentStreak}</div>
            <div className="text-xs text-gray-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{user.analytics.completionRate}%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{user.habits.active.length}</div>
            <div className="text-xs text-gray-600">Active Habits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(user.analytics.averageSessionDuration / 60)}</div>
            <div className="text-xs text-gray-600">Avg Session (min)</div>
          </div>
        </div>

        {/* Behavioral Insights */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Behavioral Insights</h4>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`flex items-start space-x-2 p-2 rounded-md text-sm ${
                    insight.type === 'positive' ? 'bg-green-50 text-green-800' :
                    insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="text-xs">
                    {insight.type === 'positive' ? '✅' : 
                     insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <span>{insight.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habits Breakdown */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Habits Overview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-green-600">{user.habits.active.length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-blue-600">{user.habits.completed.length}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Paused:</span>
                <span className="font-medium text-yellow-600">{user.habits.paused.length}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Abandoned:</span>
                <span className="font-medium text-red-600">{user.habits.abandoned.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Motivation Factors */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Success Factors</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-medium text-green-700 mb-1">Motivation Triggers:</div>
              <div className="space-y-1">
                {user.behavior.motivationTriggers.slice(0, 3).map(trigger => (
                  <span key={trigger} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full mr-1">
                    {trigger.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <div className="font-medium text-blue-700 mb-1">Success Patterns:</div>
              <div className="space-y-1">
                {user.behavior.successPatterns.slice(0, 3).map(pattern => (
                  <span key={pattern} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-1">
                    {pattern.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Mode */}
        {comparisonUsers.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Comparison View</h4>
            <div className="text-xs text-gray-600">
              Comparing {user.name} with {comparisonUsers.length} other user{comparisonUsers.length > 1 ? 's' : ''}
            </div>
            {/* Comparison visualization would go here */}
          </div>
        )}
      </div>
    </div>
  );
};