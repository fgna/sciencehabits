import React from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { AnalyticsData } from '../../utils/analyticsHelpers';
import { formatPercentage, formatTrend, getScoreColor, getScoreLabel } from '../../stores/analyticsStore';

interface ProgressOverviewProps {
  analytics: AnalyticsData;
}

export function ProgressOverview({ analytics }: ProgressOverviewProps) {
  const trend = formatTrend(analytics.completionTrend);

  const overviewStats = [
    {
      title: 'Overall Completion Rate',
      value: formatPercentage(analytics.overallCompletionRate),
      trend: trend,
      icon: '🎯',
      description: 'Average daily completion across all habits'
    },
    {
      title: 'Active Habits',
      value: analytics.activeHabitsCount.toString(),
      icon: '📋',
      description: 'Habits currently being tracked'
    },
    {
      title: 'Total Completions',
      value: analytics.totalCompletions.toString(),
      icon: '✅',
      description: `Over ${analytics.totalDaysTracked} days tracked`
    },
    {
      title: 'Longest Streak',
      value: `${analytics.longestOverallStreak} days`,
      icon: '🔥',
      description: 'Best consecutive days achieved'
    }
  ];

  const performanceScores = [
    {
      title: 'Consistency Score',
      score: analytics.consistencyScore,
      description: 'How evenly spaced your habit completions are',
      icon: '📊'
    },
    {
      title: 'Momentum Score',
      score: analytics.momentumScore,
      description: 'Current habit momentum and recent activity',
      icon: '🚀'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{stat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    {stat.trend && (
                      <div className={`flex items-center space-x-1 text-sm font-medium ${stat.trend.color}`}>
                        <span>{stat.trend.icon}</span>
                        <span>{stat.trend.text}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{stat.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Scores */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Performance Analysis</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceScores.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{item.icon}</span>
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                </div>
                
                {/* Score display */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getScoreColor(item.score)}`}>
                      {getScoreLabel(item.score)}
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {Math.round(item.score)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.score >= 80 ? 'bg-green-500' :
                        item.score >= 60 ? 'bg-yellow-500' :
                        item.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Streak Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Streak Analysis</h3>
            <div className="text-sm text-gray-500">
              {analytics.currentStreaks.filter(s => s > 0).length} active streaks
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {Math.round(analytics.averageStreak)}
              </div>
              <p className="text-sm text-gray-600">Average Current Streak</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {analytics.longestOverallStreak}
              </div>
              <p className="text-sm text-gray-600">Longest Ever Streak</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {analytics.currentStreaks.filter(s => s > 0).length}
              </div>
              <p className="text-sm text-gray-600">Active Streaks</p>
            </div>
          </div>

          {/* Streak distribution */}
          {analytics.streakDistribution.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Streak Distribution</h4>
              <div className="space-y-2">
                {analytics.streakDistribution.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {item.length === 0 ? 'No streak' : `${item.length} day${item.length > 1 ? 's' : ''}`}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.max(10, (item.count / Math.max(...analytics.streakDistribution.map(s => s.count))) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {generateInsights(analytics).map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg ${insight.type === 'positive' ? 'bg-green-50 border border-green-200' : insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{insight.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${insight.type === 'positive' ? 'text-green-800' : insight.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
                      {insight.title}
                    </p>
                    <p className={`text-sm ${insight.type === 'positive' ? 'text-green-700' : insight.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'}`}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateInsights(analytics: AnalyticsData): Array<{
  title: string;
  message: string;
  type: 'positive' | 'warning' | 'info';
  icon: string;
}> {
  const insights = [];

  // Completion rate insights
  if (analytics.overallCompletionRate >= 80) {
    insights.push({
      title: 'Excellent Progress!',
      message: `You're maintaining an ${Math.round(analytics.overallCompletionRate)}% completion rate. Keep up the outstanding work!`,
      type: 'positive' as const,
      icon: '🌟'
    });
  } else if (analytics.overallCompletionRate < 50) {
    insights.push({
      title: 'Room for Improvement',
      message: `Your completion rate is ${Math.round(analytics.overallCompletionRate)}%. Consider reducing the number of habits or adjusting your routine.`,
      type: 'warning' as const,
      icon: '💡'
    });
  }

  // Streak insights
  if (analytics.longestOverallStreak >= 30) {
    insights.push({
      title: 'Streak Master!',
      message: `Your longest streak of ${analytics.longestOverallStreak} days shows incredible dedication and consistency.`,
      type: 'positive' as const,
      icon: '🔥'
    });
  }

  // Trend insights
  if (analytics.completionTrend > 10) {
    insights.push({
      title: 'Building Momentum',
      message: `Your completion rate has improved by ${Math.round(analytics.completionTrend)}% recently. You're on the right track!`,
      type: 'positive' as const,
      icon: '📈'
    });
  } else if (analytics.completionTrend < -10) {
    insights.push({
      title: 'Declining Trend',
      message: `Your completion rate has dropped by ${Math.abs(Math.round(analytics.completionTrend))}%. Consider what might be causing this.`,
      type: 'warning' as const,
      icon: '📉'
    });
  }

  // Consistency insights
  if (analytics.consistencyScore >= 80) {
    insights.push({
      title: 'Highly Consistent',
      message: 'Your habit completions are well-distributed throughout your tracking period. This consistency is key to long-term success.',
      type: 'positive' as const,
      icon: '🎯'
    });
  } else if (analytics.consistencyScore < 50) {
    insights.push({
      title: 'Inconsistent Pattern',
      message: 'Your habit completions show an irregular pattern. Try to establish more consistent timing for better results.',
      type: 'info' as const,
      icon: '📊'
    });
  }

  // Active habits insights
  if (analytics.activeHabitsCount >= 5) {
    insights.push({
      title: 'Ambitious Tracker',
      message: `You're tracking ${analytics.activeHabitsCount} habits. Make sure you're not overwhelming yourself - quality over quantity!`,
      type: 'info' as const,
      icon: '📋'
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights for readability
}