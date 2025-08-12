/**
 * Trend-Focused Progress View
 * 
 * Shows weekly/monthly trends instead of daily streaks,
 * calculates consistency percentages over time periods,
 * and visualizes progress in a way that emphasizes overall trajectory
 * rather than perfect streaks.
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, Button } from '../ui';
import { TrendData, RecoveryInsight } from '../../types/recovery';
import { useRecoveryStore } from '../../stores/recoveryStore';
import { useUserStore } from '../../stores/userStore';

interface TrendProgressViewProps {
  habitId: string;
  className?: string;
}

export function TrendProgressView({ habitId, className = '' }: TrendProgressViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [showInsights, setShowInsights] = useState(true);
  
  const { 
    calculateTrendData, 
    generateRecoveryInsights,
    getRelevantResearchForSituation 
  } = useRecoveryStore();
  
  const { userHabits, userProgress } = useUserStore();
  
  const habit = userHabits.find(h => h.id === habitId);
  const trendData = useMemo(() => calculateTrendData(habitId, selectedPeriod), [habitId, selectedPeriod]);
  const insights = useMemo(() => generateRecoveryInsights(habitId), [habitId]);
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };
  
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getCompletionRateMessage = (rate: number) => {
    if (rate >= 80) return 'Excellent consistency! 🌟';
    if (rate >= 60) return 'Good momentum building 💪';
    if (rate >= 40) return 'Making progress 📊';
    return 'Every step counts 🌱';
  };
  
  const generateProgressInsights = (data: TrendData): string[] => {
    const insights = [];
    
    if (data.completionRate >= 70) {
      insights.push(`Great consistency! You completed ${data.completedDays} out of ${data.totalDays} days.`);
    } else if (data.completionRate >= 50) {
      insights.push(`You're building momentum with ${Math.round(data.completionRate)}% consistency.`);
    } else {
      insights.push(`Focus on small wins - even 50% consistency builds habits over time.`);
    }
    
    if (data.trend === 'improving' && data.trendPercentage > 0) {
      insights.push(`📈 You're ${Math.abs(data.trendPercentage).toFixed(1)}% more consistent than last ${data.period}!`);
    } else if (data.trend === 'declining' && data.trendPercentage < 0) {
      insights.push(`💡 You're ${Math.abs(data.trendPercentage).toFixed(1)}% less consistent, but this is normal during habit formation.`);
    }
    
    if (data.longestStreak > 0) {
      insights.push(`🔥 Your longest streak was ${data.longestStreak} days - you have the capability for consistency!`);
    }
    
    return insights;
  };
  
  const progressInsights = generateProgressInsights(trendData);
  
  if (!habit) {
    return <div>Habit not found</div>;
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Progress Trends</h2>
          <p className="text-gray-600">Focus on consistency over perfection</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'quarter'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'Quarter'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{habit.title}</h3>
            <div className={`flex items-center space-x-2 ${getTrendColor(trendData.trend)}`}>
              <span>{getTrendIcon(trendData.trend)}</span>
              <span className="text-sm font-medium capitalize">{trendData.trend}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Completion Rate Display */}
          <div className="text-center mb-6">
            <div className={`text-4xl font-bold mb-2 ${getCompletionRateColor(trendData.completionRate)}`}>
              {Math.round(trendData.completionRate)}%
            </div>
            <div className="text-gray-600 mb-1">
              {trendData.completedDays} of {trendData.totalDays} days this {selectedPeriod}
            </div>
            <div className={`text-sm ${getCompletionRateColor(trendData.completionRate)}`}>
              {getCompletionRateMessage(trendData.completionRate)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{trendData.completedDays}/{trendData.totalDays}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  trendData.completionRate >= 80 ? 'bg-green-500' :
                  trendData.completionRate >= 60 ? 'bg-blue-500' :
                  trendData.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${trendData.completionRate}%` }}
              />
            </div>
          </div>
          
          {/* Trend Comparison */}
          {trendData.trendPercentage !== 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <span className={getTrendColor(trendData.trend)}>
                  {trendData.trend === 'improving' ? '⬆️' : trendData.trend === 'declining' ? '⬇️' : '➡️'}
                </span>
                <span className="text-sm text-gray-700">
                  {Math.abs(trendData.trendPercentage).toFixed(1)}% 
                  {trendData.trend === 'improving' ? ' better' : trendData.trend === 'declining' ? ' lower' : ' same'} 
                  {' '}than last {selectedPeriod}
                </span>
              </div>
            </div>
          )}
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">{trendData.longestStreak}</div>
              <div className="text-xs text-blue-800">Longest Streak</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">{trendData.totalStreaks}</div>
              <div className="text-xs text-green-800">Total Streaks</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {trendData.averageGapBetweenMisses.toFixed(1)}
              </div>
              <div className="text-xs text-purple-800">Avg Gap (days)</div>
            </div>
          </div>
          
          {/* Progress Insights */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Progress Insights</h4>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showInsights ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showInsights && (
              <div className="space-y-2">
                {progressInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="text-gray-700">{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recovery Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium flex items-center">
              <span className="mr-2">💡</span>
              Personalized Insights
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>
                  {insight.actionable && insight.suggestedActions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">Suggested actions:</p>
                      {insight.suggestedActions.map((action, index) => (
                        <div key={index} className="text-xs text-gray-600 ml-2">
                          • {action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Encouragement Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <div className="text-2xl mb-2">🌟</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Remember: Progress over Perfection
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Research shows that focusing on trends rather than daily perfection leads to better long-term success. 
            You're building a sustainable habit that will last.
          </p>
          <div className="text-xs text-gray-500">
            Based on habit formation research • 66-day average formation time
          </div>
        </CardContent>
      </Card>
    </div>
  );
}