/**
 * Trend Analysis View
 * 
 * Advanced trend analysis and comparative analytics for habit patterns,
 * including frequency comparisons, performance trends, and insights
 */

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { 
  FrequencyTypeStats, 
  OptimalFrequencyInsight,
  ConsistencyPattern 
} from '../../utils/frequencyAnalyticsHelpers';
import { AnalyticsData } from '../../utils/analyticsHelpers';

interface TrendAnalysisViewProps {
  analyticsData: AnalyticsData;
  frequencyStats: FrequencyTypeStats[];
  optimalFrequencyInsights: OptimalFrequencyInsight[];
  consistencyPatterns: ConsistencyPattern[];
  className?: string;
}

export function TrendAnalysisView({
  analyticsData,
  frequencyStats,
  optimalFrequencyInsights,
  consistencyPatterns,
  className = ""
}: TrendAnalysisViewProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<'performance' | 'optimization' | 'patterns' | 'insights'>('performance');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analysis Type Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'performance', label: 'Performance Trends', icon: '📈' },
          { id: 'optimization', label: 'Optimization', icon: '⚡' },
          { id: 'patterns', label: 'Behavior Patterns', icon: '🔍' },
          { id: 'insights', label: 'AI Insights', icon: '🧠' }
        ].map(analysis => (
          <Button
            key={analysis.id}
            variant={activeAnalysis === analysis.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveAnalysis(analysis.id as any)}
            className="flex items-center space-x-2"
          >
            <span>{analysis.icon}</span>
            <span>{analysis.label}</span>
          </Button>
        ))}
      </div>

      {/* Performance Trends */}
      {activeAnalysis === 'performance' && (
        <PerformanceTrends 
          analyticsData={analyticsData} 
          frequencyStats={frequencyStats} 
        />
      )}

      {/* Frequency Optimization */}
      {activeAnalysis === 'optimization' && (
        <FrequencyOptimization insights={optimalFrequencyInsights} />
      )}

      {/* Behavior Patterns */}
      {activeAnalysis === 'patterns' && (
        <BehaviorPatterns 
          consistencyPatterns={consistencyPatterns}
          analyticsData={analyticsData}
        />
      )}

      {/* AI Insights */}
      {activeAnalysis === 'insights' && (
        <AIInsights 
          analyticsData={analyticsData}
          frequencyStats={frequencyStats}
          consistencyPatterns={consistencyPatterns}
        />
      )}
    </div>
  );
}

/**
 * Performance Trends Component
 */
function PerformanceTrends({ 
  analyticsData, 
  frequencyStats 
}: { 
  analyticsData: AnalyticsData; 
  frequencyStats: FrequencyTypeStats[] 
}) {
  const trendInsights = useMemo(() => {
    // Calculate trend direction based on recent performance
    const recentCompletion = analyticsData.completionTrend;
    const consistencyTrend = analyticsData.consistencyScore;
    const momentumTrend = analyticsData.momentumScore;

    return {
      completion: {
        value: recentCompletion,
        direction: recentCompletion > 0 ? 'improving' : recentCompletion < 0 ? 'declining' : 'stable',
        color: recentCompletion > 0 ? 'text-green-600' : recentCompletion < 0 ? 'text-red-600' : 'text-yellow-600'
      },
      consistency: {
        value: consistencyTrend,
        direction: consistencyTrend > 70 ? 'strong' : consistencyTrend > 40 ? 'moderate' : 'weak',
        color: consistencyTrend > 70 ? 'text-green-600' : consistencyTrend > 40 ? 'text-yellow-600' : 'text-red-600'
      },
      momentum: {
        value: momentumTrend,
        direction: momentumTrend > 70 ? 'high' : momentumTrend > 40 ? 'moderate' : 'low',
        color: momentumTrend > 70 ? 'text-green-600' : momentumTrend > 40 ? 'text-yellow-600' : 'text-red-600'
      }
    };
  }, [analyticsData]);

  return (
    <div className="space-y-6">
      {/* Key Trend Metrics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">📈 Performance Trends</h3>
          <p className="text-sm text-gray-600">Your habit performance patterns over time</p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Trend */}
            <div className="text-center">
              <div className="text-2xl mb-2">
                {trendInsights.completion.direction === 'improving' ? '📈' : 
                 trendInsights.completion.direction === 'declining' ? '📉' : '➡️'}
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Completion Rate</h4>
              <div className={`text-2xl font-bold ${trendInsights.completion.color}`}>
                {trendInsights.completion.value > 0 ? '+' : ''}{Math.round(trendInsights.completion.value)}%
              </div>
              <p className="text-sm text-gray-600 capitalize">{trendInsights.completion.direction}</p>
            </div>

            {/* Consistency Score */}
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-medium text-gray-900 mb-1">Consistency</h4>
              <div className={`text-2xl font-bold ${trendInsights.consistency.color}`}>
                {Math.round(trendInsights.consistency.value)}/100
              </div>
              <p className="text-sm text-gray-600 capitalize">{trendInsights.consistency.direction}</p>
            </div>

            {/* Momentum Score */}
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-medium text-gray-900 mb-1">Momentum</h4>
              <div className={`text-2xl font-bold ${trendInsights.momentum.color}`}>
                {Math.round(trendInsights.momentum.value)}/100
              </div>
              <p className="text-sm text-gray-600 capitalize">{trendInsights.momentum.direction}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequency Performance Comparison */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Frequency Type Performance</h3>
          <p className="text-sm text-gray-600">How different habit frequencies are working for you</p>
        </CardHeader>
        
        <CardContent>
          {frequencyStats.length > 0 ? (
            <div className="space-y-4">
              {frequencyStats.map(stat => (
                <FrequencyPerformanceCard key={stat.type} stat={stat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No frequency data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly/Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
        </CardHeader>
        
        <CardContent>
          <WeeklyTrendChart weeklyStats={analyticsData.weeklyStats} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Frequency Performance Card
 */
function FrequencyPerformanceCard({ stat }: { stat: FrequencyTypeStats }) {
  const getFrequencyIcon = (type: string) => {
    const icons = { daily: '📅', weekly: '🗓️', periodic: '📆' };
    return icons[type as keyof typeof icons] || '📊';
  };

  const successPercentage = Math.round(stat.successRate * 100);

  return (
    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="text-xl">{getFrequencyIcon(stat.type)}</span>
        <div>
          <h4 className="font-medium text-gray-900 capitalize">{stat.type} Habits</h4>
          <p className="text-sm text-gray-600">{stat.habitCount} habit{stat.habitCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Success Rate</span>
          <span className="text-sm font-medium">{successPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              successPercentage >= 80 ? 'bg-green-500' :
              successPercentage >= 60 ? 'bg-blue-500' :
              successPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${successPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm text-gray-600">Avg Streak</div>
        <div className="font-medium">{Math.round(stat.averageStreak)} days</div>
      </div>
    </div>
  );
}

/**
 * Weekly Trend Chart Component
 */
function WeeklyTrendChart({ weeklyStats }: { weeklyStats: any[] }) {
  if (!weeklyStats || weeklyStats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No weekly data available
      </div>
    );
  }

  // Take last 8 weeks for trend
  const recentWeeks = weeklyStats.slice(-8);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Completion Rate by Week</span>
        <span>{recentWeeks.length} weeks shown</span>
      </div>
      
      <div className="flex items-end space-x-2 h-32">
        {recentWeeks.map((week, index) => {
          const height = Math.max(week.completionRate * 100, 5);
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-primary-500 rounded-t transition-all duration-700"
                style={{ height: `${height}%` }}
                title={`Week ${week.weekNumber}: ${Math.round(week.completionRate * 100)}%`}
              />
              <div className="text-xs text-gray-500 mt-1">
                W{week.weekNumber}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Frequency Optimization Component
 */
function FrequencyOptimization({ insights }: { insights: OptimalFrequencyInsight[] }) {
  const optimizationOpportunities = insights.filter(insight => 
    insight.expectedImprovement > 0 && insight.confidence > 0.5
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">⚡ Frequency Optimization</h3>
          <p className="text-sm text-gray-600">AI-powered suggestions to improve your habit success rates</p>
        </CardHeader>
        
        <CardContent>
          {optimizationOpportunities.length > 0 ? (
            <div className="space-y-4">
              {optimizationOpportunities.map(insight => (
                <OptimizationCard key={insight.habitId} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✨</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Your frequencies look good!</h4>
              <p className="text-gray-600">No optimization suggestions at this time. Keep tracking to unlock insights.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Optimization Card Component
 */
function OptimizationCard({ insight }: { insight: OptimalFrequencyInsight }) {
  const getCurrentFrequencyLabel = (freq: any) => {
    if (freq.type === 'daily') return 'Daily';
    if (freq.type === 'weekly') return `${freq.weeklyTarget?.sessionsPerWeek || 0}x per week`;
    if (freq.type === 'periodic') return `${freq.periodicTarget?.interval || 'periodic'}`;
    return 'Unknown';
  };

  const getSuggestedFrequencyLabel = (freq: any) => {
    if (freq.type === 'daily') return 'Daily';
    if (freq.type === 'weekly') return `${freq.weeklyTarget?.sessionsPerWeek || 0}x per week`;
    if (freq.type === 'periodic') return `${freq.periodicTarget?.interval || 'periodic'}`;
    return 'Unknown';
  };

  return (
    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">Frequency Adjustment Suggested</h4>
          <p className="text-sm text-orange-700">
            Confidence: {Math.round(insight.confidence * 100)}% • 
            Expected improvement: +{Math.round(insight.expectedImprovement * 100)}%
          </p>
        </div>
        <div className="text-orange-500 text-xl">💡</div>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Current:</span>
            <div className="font-medium">{getCurrentFrequencyLabel(insight.currentFrequency)}</div>
          </div>
          <div>
            <span className="text-gray-600">Suggested:</span>
            <div className="font-medium text-orange-700">
              {getSuggestedFrequencyLabel(insight.suggestedFrequency)}
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-white rounded border">
          <div className="text-sm text-gray-700">
            <strong>Why this change:</strong> {insight.reasoning}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Behavior Patterns Component
 */
function BehaviorPatterns({ 
  consistencyPatterns, 
  analyticsData 
}: { 
  consistencyPatterns: ConsistencyPattern[];
  analyticsData: AnalyticsData;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">🔍 Behavior Patterns</h3>
          <p className="text-sm text-gray-600">Insights into your habit completion patterns</p>
        </CardHeader>
        
        <CardContent>
          {/* Day of Week Analysis */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Daily Performance Patterns</h4>
            <DayOfWeekAnalysis dailyStats={analyticsData.dailyStats} />
          </div>
          
          {/* Consistency Patterns */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Habit Consistency Analysis</h4>
            {consistencyPatterns.length > 0 ? (
              <div className="space-y-3">
                {consistencyPatterns.map(pattern => (
                  <ConsistencyPatternCard key={pattern.habitId} pattern={pattern} />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No consistency patterns available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Day of Week Analysis Component
 */
function DayOfWeekAnalysis({ dailyStats }: { dailyStats: any[] }) {
  const dayOfWeekStats = useMemo(() => {
    const dayMap: Record<string, { completions: number; total: number }> = {};
    
    dailyStats.forEach(stat => {
      const day = stat.dayOfWeek;
      if (!dayMap[day]) {
        dayMap[day] = { completions: 0, total: 0 };
      }
      dayMap[day].completions += stat.completions;
      dayMap[day].total += stat.totalHabits;
    });
    
    return Object.entries(dayMap).map(([day, data]) => ({
      day,
      rate: data.total > 0 ? data.completions / data.total : 0,
      completions: data.completions,
      total: data.total
    }));
  }, [dailyStats]);

  const maxRate = Math.max(...dayOfWeekStats.map(d => d.rate), 0.1);

  return (
    <div className="space-y-3">
      {dayOfWeekStats.map(stat => (
        <div key={stat.day} className="flex items-center space-x-3">
          <div className="w-12 text-sm font-medium text-gray-700">{stat.day}</div>
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stat.rate / maxRate) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600 w-12 text-right">
            {Math.round(stat.rate * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Consistency Pattern Card Component
 */
function ConsistencyPatternCard({ pattern }: { pattern: ConsistencyPattern }) {
  const getPatternIcon = (type: string) => {
    const icons = { strong: '🎯', moderate: '📊', weak: '📈', irregular: '📉' };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getPatternColor = (type: string) => {
    const colors = {
      strong: 'text-green-600',
      moderate: 'text-blue-600', 
      weak: 'text-yellow-600',
      irregular: 'text-red-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="p-3 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getPatternIcon(pattern.patternType)}</span>
          <span className={`text-sm font-medium capitalize ${getPatternColor(pattern.patternType)}`}>
            {pattern.patternType} Pattern
          </span>
        </div>
        <span className="text-sm text-gray-600">{pattern.consistencyScore}/100</span>
      </div>
      
      {pattern.bestDaysOfWeek.length > 0 && (
        <div className="text-sm text-gray-600 mb-2">
          <strong>Best days:</strong> {pattern.bestDaysOfWeek.join(', ')}
        </div>
      )}
      
      {pattern.recommendations.length > 0 && (
        <div className="text-sm text-gray-600">
          <strong>Tip:</strong> {pattern.recommendations[0]}
        </div>
      )}
    </div>
  );
}

/**
 * AI Insights Component
 */
function AIInsights({ 
  analyticsData, 
  frequencyStats, 
  consistencyPatterns 
}: { 
  analyticsData: AnalyticsData;
  frequencyStats: FrequencyTypeStats[];
  consistencyPatterns: ConsistencyPattern[];
}) {
  const insights = useMemo(() => {
    const insights: string[] = [];
    
    // Performance insights
    if (analyticsData.overallCompletionRate > 0.8) {
      insights.push("🌟 Excellent! You're maintaining a completion rate above 80%.");
    } else if (analyticsData.overallCompletionRate < 0.5) {
      insights.push("💪 Your completion rate could improve. Consider reducing habit frequency or focusing on fewer habits.");
    }
    
    // Frequency insights
    const bestFrequency = frequencyStats.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    , frequencyStats[0]);
    
    if (bestFrequency && frequencyStats.length > 1) {
      insights.push(`📊 Your ${bestFrequency.type} habits have the highest success rate (${Math.round(bestFrequency.successRate * 100)}%).`);
    }
    
    // Consistency insights
    const strongPatterns = consistencyPatterns.filter(p => p.patternType === 'strong').length;
    if (strongPatterns > 0) {
      insights.push(`🎯 You have ${strongPatterns} habit${strongPatterns !== 1 ? 's' : ''} with strong consistency patterns.`);
    }
    
    // Streak insights
    if (analyticsData.longestOverallStreak > 30) {
      insights.push(`🔥 Impressive! Your longest streak is ${analyticsData.longestOverallStreak} days.`);
    }
    
    // Add default insight if none generated
    if (insights.length === 0) {
      insights.push("📈 Keep tracking your habits to unlock personalized insights!");
    }
    
    return insights;
  }, [analyticsData, frequencyStats, consistencyPatterns]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">🧠 AI-Powered Insights</h3>
        <p className="text-sm text-gray-600">Personalized observations about your habit patterns</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{insight}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}