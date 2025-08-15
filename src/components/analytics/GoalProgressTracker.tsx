import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { AnalyticsData, HabitAnalytics } from '../../utils/analyticsHelpers';
// import { formatPercentage } from '../../stores/analyticsStore';

interface Goal {
  id: string;
  type: 'completion_rate' | 'streak' | 'consistency' | 'total_completions' | 'category_focus';
  title: string;
  description: string;
  target: number;
  current: number;
  deadline?: string;
  habitId?: string;
  category?: string;
  icon: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

interface GoalProgressTrackerProps {
  analytics: AnalyticsData;
  habitPerformance: HabitAnalytics[];
}

export function GoalProgressTracker({ analytics, habitPerformance }: GoalProgressTrackerProps) {
  const [viewMode, setViewMode] = useState<'active' | 'completed' | 'all'>('active');
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);

  const goals = useMemo(() => {
    return generateSmartGoals(analytics, habitPerformance);
  }, [analytics, habitPerformance]);

  const activeGoals = goals.filter(goal => goal.current < goal.target);
  const completedGoals = goals.filter(goal => goal.current >= goal.target);

  const displayGoals = viewMode === 'active' ? activeGoals : 
                      viewMode === 'completed' ? completedGoals : goals;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Goal Progress Tracker</h3>
              <p className="text-sm text-gray-600">
                {completedGoals.length} completed • {activeGoals.length} in progress
              </p>
            </div>
            {/* Smart Goal Status Toggle */}
            <div className="flex items-center space-x-3">
              {completedGoals.length > 0 && (
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showCompletedGoals}
                    onChange={(e) => {
                      setShowCompletedGoals(e.target.checked);
                      if (e.target.checked && viewMode === 'active') {
                        setViewMode('all');
                      } else if (!e.target.checked && viewMode !== 'active') {
                        setViewMode('active');
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Show completed ({completedGoals.length})</span>
                </label>
              )}
              <div className="flex space-x-1">
                <Button
                  variant={viewMode === 'active' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('active');
                    setShowCompletedGoals(false);
                  }}
                >
                  🎯 Active
                </Button>
                {showCompletedGoals && (
                  <Button
                    variant={viewMode === 'completed' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('completed')}
                  >
                    ✅ Completed
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GoalsList goals={displayGoals} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="text-md font-semibold text-gray-900">Success Metrics</h4>
        </CardHeader>
        <CardContent>
          <SuccessMetricsView 
            analytics={analytics}
            habitPerformance={habitPerformance}
            completedGoals={completedGoals.length}
            totalGoals={goals.length}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h4 className="text-md font-semibold text-gray-900">Progress Insights</h4>
        </CardHeader>
        <CardContent>
          <GoalInsights goals={goals} analytics={analytics} />
        </CardContent>
      </Card>
    </div>
  );
}

function GoalsList({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goals Found</h3>
        <p className="text-gray-600">
          Goals are automatically generated based on your habit tracking patterns.
        </p>
      </div>
    );
  }

  const prioritySections = {
    high: goals.filter(g => g.priority === 'high'),
    medium: goals.filter(g => g.priority === 'medium'),
    low: goals.filter(g => g.priority === 'low')
  };

  return (
    <div className="space-y-6">
      {Object.entries(prioritySections).map(([priority, priorityGoals]) => {
        if (priorityGoals.length === 0) return null;
        
        return (
          <div key={priority}>
            <div className="flex items-center space-x-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${
                priority === 'high' ? 'bg-red-500' : 
                priority === 'medium' ? 'bg-yellow-500' : 
                'bg-green-500'
              }`} />
              <h5 className="font-medium text-gray-900 capitalize">{priority} Priority</h5>
              <span className="text-sm text-gray-500">({priorityGoals.length})</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {priorityGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = Math.min(100, (goal.current / goal.target) * 100);
  const isCompleted = goal.current >= goal.target;
  const isNearCompletion = progress >= 80;

  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (isNearCompletion) return 'bg-yellow-500';
    return goal.color === 'blue' ? 'bg-blue-500' :
           goal.color === 'purple' ? 'bg-purple-500' :
           goal.color === 'orange' ? 'bg-orange-500' :
           'bg-primary-500';
  };

  const getCardBorder = () => {
    if (isCompleted) return 'border-green-300 bg-green-50';
    if (goal.priority === 'high') return 'border-red-200 bg-red-50';
    if (goal.priority === 'medium') return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  return (
    <div className={`rounded-lg border-2 transition-all hover:shadow-md ${getCardBorder()}`}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-opacity-50 transition-colors rounded-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{goal.icon}</span>
            <div className="flex-1">
              <h6 className="font-medium text-gray-900">{goal.title}</h6>
              <p className="text-xs text-gray-600 line-clamp-1">{goal.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isCompleted && (
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Progress Bar - Always Visible */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className={`font-medium ${
              isCompleted ? 'text-green-600' : 'text-gray-600'
            }`}>
              {Math.round(progress)}% Complete
            </span>
            <span className="text-gray-500 text-xs">
              {formatGoalValue(goal.current, goal.type)} / {formatGoalValue(goal.target, goal.type)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.max(3, progress)}%` }}
            />
          </div>
        </div>
      </button>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{goal.description}</p>
            
            {goal.deadline && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
              </div>
            )}
            
            {goal.habitId && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Individual habit goal</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <div className={`w-2 h-2 rounded-full ${
                goal.priority === 'high' ? 'bg-red-500' : 
                goal.priority === 'medium' ? 'bg-yellow-500' : 
                'bg-green-500'
              }`} />
              <span className="capitalize">{goal.priority} priority</span>
            </div>
          </div>

          {isNearCompletion && !isCompleted && (
            <div className="text-xs text-yellow-700 bg-yellow-100 px-3 py-2 rounded-md">
              🔥 Almost there! Keep going!
            </div>
          )}

          {isCompleted && (
            <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded-md">
              🎉 Goal completed! Great job!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuccessMetricsView({ 
  analytics, 
  habitPerformance, 
  completedGoals, 
  totalGoals 
}: {
  analytics: AnalyticsData;
  habitPerformance: HabitAnalytics[];
  completedGoals: number;
  totalGoals: number;
}) {
  const successMetrics = [
    {
      title: 'Goal Completion Rate',
      value: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      suffix: '%',
      icon: '🎯',
      color: 'text-blue-600'
    },
    {
      title: 'Average Habit Success',
      value: Math.round(analytics.overallCompletionRate),
      suffix: '%',
      icon: '📈',
      color: 'text-green-600'
    },
    {
      title: 'Consistency Score',
      value: Math.round(analytics.consistencyScore),
      suffix: '/100',
      icon: '⚡',
      color: 'text-purple-600'
    },
    {
      title: 'Active Streaks',
      value: analytics.currentStreaks.filter(s => s > 0).length,
      suffix: '',
      icon: '🔥',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {successMetrics.map((metric, index) => (
        <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl mb-2">{metric.icon}</div>
          <div className={`text-2xl font-bold mb-1 ${metric.color}`}>
            {metric.value}{metric.suffix}
          </div>
          <p className="text-xs text-gray-600">{metric.title}</p>
        </div>
      ))}
    </div>
  );
}

function GoalInsights({ goals, analytics }: { goals: Goal[], analytics: AnalyticsData }) {
  const insights = [];

  const completedGoals = goals.filter(g => g.current >= g.target);
  const nearCompletionGoals = goals.filter(g => {
    const progress = (g.current / g.target) * 100;
    return progress >= 80 && progress < 100;
  });

  if (completedGoals.length > 0) {
    insights.push({
      title: 'Excellent Progress!',
      message: `You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''}. This shows great commitment to your habit building journey.`,
      type: 'positive' as const,
      icon: '🎉'
    });
  }

  if (nearCompletionGoals.length > 0) {
    insights.push({
      title: 'Almost There!',
      message: `You're close to completing ${nearCompletionGoals.length} goal${nearCompletionGoals.length > 1 ? 's' : ''}. A little more effort will get you across the finish line.`,
      type: 'info' as const,
      icon: '🔥'
    });
  }

  if (analytics.overallCompletionRate >= 80) {
    insights.push({
      title: 'High Achiever',
      message: `Your ${Math.round(analytics.overallCompletionRate)}% overall completion rate puts you in the top tier of habit trackers. Keep up the excellent work!`,
      type: 'positive' as const,
      icon: '🌟'
    });
  }

  if (analytics.consistencyScore < 60) {
    insights.push({
      title: 'Focus on Consistency',
      message: 'Consider spacing out your habit completions more evenly throughout the tracking period for better long-term results.',
      type: 'info' as const,
      icon: '📊'
    });
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div key={index} className={`p-3 rounded-lg ${
          insight.type === 'positive' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start space-x-2">
            <span className="text-lg">{insight.icon}</span>
            <div>
              <p className={`text-sm font-medium ${
                insight.type === 'positive' ? 'text-green-800' : 'text-blue-800'
              }`}>
                {insight.title}
              </p>
              <p className={`text-sm ${
                insight.type === 'positive' ? 'text-green-700' : 'text-blue-700'
              }`}>
                {insight.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function generateSmartGoals(analytics: AnalyticsData, habitPerformance: HabitAnalytics[]): Goal[] {
  const goals: Goal[] = [];
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  // Overall completion rate goals
  if (analytics.overallCompletionRate < 80) {
    goals.push({
      id: 'overall_completion_80',
      type: 'completion_rate',
      title: 'Reach 80% Overall Completion',
      description: 'Achieve a steady 80% completion rate across all habits',
      target: 80,
      current: analytics.overallCompletionRate,
      icon: '🎯',
      color: 'blue',
      priority: 'high',
      deadline: futureDate.toISOString()
    });
  }

  // Streak goals
  if (analytics.longestOverallStreak < 30) {
    goals.push({
      id: 'streak_30',
      type: 'streak',
      title: '30-Day Streak Master',
      description: 'Maintain a 30-day streak for any habit',
      target: 30,
      current: analytics.longestOverallStreak,
      icon: '🔥',
      color: 'orange',
      priority: 'medium',
      deadline: futureDate.toISOString()
    });
  }

  // Consistency goals
  if (analytics.consistencyScore < 75) {
    goals.push({
      id: 'consistency_75',
      type: 'consistency',
      title: 'Improve Consistency',
      description: 'Achieve a consistency score of 75 or higher',
      target: 75,
      current: analytics.consistencyScore,
      icon: '⚡',
      color: 'purple',
      priority: 'medium',
      deadline: futureDate.toISOString()
    });
  }

  // Total completions goals
  const nextCompletionMilestone = analytics.totalCompletions < 100 ? 100 :
                                  analytics.totalCompletions < 250 ? 250 :
                                  analytics.totalCompletions < 500 ? 500 : 1000;

  goals.push({
    id: `completions_${nextCompletionMilestone}`,
    type: 'total_completions',
    title: `${nextCompletionMilestone} Completions Club`,
    description: `Reach ${nextCompletionMilestone} total habit completions`,
    target: nextCompletionMilestone,
    current: analytics.totalCompletions,
    icon: '💯',
    color: 'green',
    priority: analytics.totalCompletions < 100 ? 'high' : 'low',
    deadline: futureDate.toISOString()
  });

  // Individual habit goals (top 3 habits by potential)
  const habitGoals = habitPerformance
    .filter(habit => habit.completionRate < 90)
    .sort((a, b) => (b.completionRate + b.consistencyScore) - (a.completionRate + a.consistencyScore))
    .slice(0, 3)
    .map(habit => ({
      id: `habit_improve_${habit.habitId}`,
      type: 'completion_rate' as const,
      title: `Improve ${habit.habitTitle}`,
      description: `Reach 80% completion rate for this habit`,
      target: 80,
      current: habit.completionRate,
      habitId: habit.habitId,
      icon: '📈',
      color: 'blue',
      priority: 'medium' as const,
      deadline: futureDate.toISOString()
    }));

  goals.push(...habitGoals);

  return goals.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function formatGoalValue(value: number, type: Goal['type']): string {
  switch (type) {
    case 'completion_rate':
    case 'consistency':
      return `${Math.round(value)}%`;
    case 'streak':
      return `${Math.round(value)} days`;
    case 'total_completions':
      return Math.round(value).toString();
    default:
      return Math.round(value).toString();
  }
}