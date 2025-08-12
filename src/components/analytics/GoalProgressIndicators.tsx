/**
 * Goal Progress Indicators
 * 
 * Visual components for tracking progress toward weekly goals,
 * periodic habits, and overall completion targets
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui';
import { WeeklyGoalStats, PeriodicHabitStats, ProgressForecast } from '../../utils/frequencyAnalyticsHelpers';

interface GoalProgressIndicatorsProps {
  weeklyGoalStats: WeeklyGoalStats[];
  periodicStats: PeriodicHabitStats[];
  progressForecast: ProgressForecast[];
  className?: string;
}

export function GoalProgressIndicators({
  weeklyGoalStats,
  periodicStats,
  progressForecast,
  className = ""
}: GoalProgressIndicatorsProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<'current' | 'upcoming' | 'forecast'>('current');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timeframe Selector */}
      <div className="flex space-x-2">
        {[
          { id: 'current', label: 'Current Week', icon: '🎯' },
          { id: 'upcoming', label: 'Upcoming', icon: '📅' },
          { id: 'forecast', label: 'Forecast', icon: '🔮' }
        ].map(timeframe => (
          <button
            key={timeframe.id}
            onClick={() => setActiveTimeframe(timeframe.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTimeframe === timeframe.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{timeframe.icon}</span>
            <span>{timeframe.label}</span>
          </button>
        ))}
      </div>

      {/* Current Week Progress */}
      {activeTimeframe === 'current' && (
        <CurrentWeekProgress weeklyGoalStats={weeklyGoalStats} />
      )}

      {/* Upcoming Periodic Habits */}
      {activeTimeframe === 'upcoming' && (
        <UpcomingHabits periodicStats={periodicStats} />
      )}

      {/* Progress Forecast */}
      {activeTimeframe === 'forecast' && (
        <ProgressForecastView progressForecast={progressForecast} />
      )}
    </div>
  );
}

/**
 * Current Week Progress Component
 */
function CurrentWeekProgress({ weeklyGoalStats }: { weeklyGoalStats: WeeklyGoalStats[] }) {
  const currentWeekStats = weeklyGoalStats.filter(stat => {
    const weekDate = new Date(stat.weekStart);
    const now = new Date();
    const weeksDiff = Math.floor((now.getTime() - weekDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return weeksDiff === 0;
  });

  if (currentWeekStats.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Weekly Goals Active</h3>
            <p className="text-gray-600">Create weekly habit goals to track your progress here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall weekly progress
  const totalTargetSessions = currentWeekStats.reduce((sum, stat) => sum + stat.targetSessions, 0);
  const totalCompletedSessions = currentWeekStats.reduce((sum, stat) => sum + stat.completedSessions, 0);
  const overallProgress = totalTargetSessions > 0 ? totalCompletedSessions / totalTargetSessions : 0;
  const goalsMetCount = currentWeekStats.filter(stat => stat.goalMet).length;

  return (
    <div className="space-y-6">
      {/* Overall Weekly Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">This Week's Goals</h3>
              <p className="text-sm text-gray-600">
                {goalsMetCount} of {currentWeekStats.length} goals completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(overallProgress * 100)}%
              </div>
              <div className="text-xs text-gray-500">Overall Progress</div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Overall Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Week Progress</span>
              <span className="text-sm text-gray-500">
                {totalCompletedSessions}/{totalTargetSessions} sessions
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(overallProgress * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Individual Goal Progress */}
          <div className="space-y-4">
            {currentWeekStats.map((stat, index) => (
              <WeeklyGoalCard key={`${stat.habitId}-${index}`} stat={stat} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Weekly Goal Card Component
 */
function WeeklyGoalCard({ stat }: { stat: WeeklyGoalStats }) {
  const completionPercentage = Math.round(stat.completionRate * 100);
  const sessionsRemaining = Math.max(0, stat.targetSessions - stat.completedSessions);
  const daysRemainingInWeek = 7 - new Date().getDay();
  
  const getStatusColor = () => {
    if (stat.goalMet) return 'text-green-600';
    if (stat.daysAhead > 0) return 'text-blue-600';
    if (stat.daysAhead < -1) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusMessage = () => {
    if (stat.goalMet) return '✅ Goal Complete!';
    if (stat.daysAhead > 0) return `🚀 ${stat.daysAhead} day${stat.daysAhead !== 1 ? 's' : ''} ahead`;
    if (stat.daysAhead < -1) return `⏳ ${Math.abs(stat.daysAhead)} day${Math.abs(stat.daysAhead) !== 1 ? 's' : ''} behind`;
    return '🎯 On track';
  };

  const getProgressBarColor = () => {
    if (stat.goalMet) return 'bg-green-500';
    if (completionPercentage >= 75) return 'bg-blue-500';
    if (completionPercentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{stat.habitTitle}</h4>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {stat.completedSessions}/{stat.targetSessions}
          </span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${getProgressBarColor()} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
          {/* Completion percentage overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Remaining:</span>
          <span className="ml-2 font-medium">{sessionsRemaining} sessions</span>
        </div>
        <div>
          <span className="text-gray-500">Days left:</span>
          <span className="ml-2 font-medium">{daysRemainingInWeek} days</span>
        </div>
      </div>
      
      {/* Pace Analysis */}
      {!stat.goalMet && sessionsRemaining > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <span className="text-gray-600">
            {daysRemainingInWeek > 0 
              ? `Complete ${Math.ceil(sessionsRemaining / daysRemainingInWeek)} session${Math.ceil(sessionsRemaining / daysRemainingInWeek) !== 1 ? 's' : ''} per day to reach your goal`
              : sessionsRemaining === 1
              ? 'Complete 1 more session today to reach your goal!'
              : `${sessionsRemaining} sessions overdue - complete them when possible`
            }
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Upcoming Habits Component
 */
function UpcomingHabits({ periodicStats }: { periodicStats: PeriodicHabitStats[] }) {
  // Filter for habits due within next 30 days
  const upcomingHabits = periodicStats.filter(stat => {
    const daysUntilDue = Math.ceil(
      (new Date(stat.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue >= 0 && daysUntilDue <= 30;
  }).sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());

  const overdueHabits = periodicStats.filter(stat => stat.isOverdue);

  if (upcomingHabits.length === 0 && overdueHabits.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Periodic Habits</h3>
            <p className="text-gray-600">All your periodic habits are on track!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue Habits */}
      {overdueHabits.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-red-600">🚨 Overdue Habits</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueHabits.map(stat => (
                <PeriodicHabitCard key={stat.habitId} stat={stat} isOverdue />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Habits */}
      {upcomingHabits.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">📅 Upcoming Periodic Habits</h3>
            <p className="text-sm text-gray-600">Due within the next 30 days</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingHabits.map(stat => (
                <PeriodicHabitCard key={stat.habitId} stat={stat} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Periodic Habit Card Component
 */
function PeriodicHabitCard({ stat, isOverdue = false }: { stat: PeriodicHabitStats; isOverdue?: boolean }) {
  const daysUntilDue = Math.ceil(
    (new Date(stat.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const urgencyLevel = isOverdue ? 'critical' : 
                      daysUntilDue <= 3 ? 'high' : 
                      daysUntilDue <= 7 ? 'medium' : 'low';

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'high': return 'border-orange-300 bg-orange-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getUrgencyIcon = () => {
    switch (urgencyLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⏰';
      default: return '📅';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getUrgencyColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{stat.habitTitle}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getUrgencyIcon()}</span>
          <span className="text-sm font-medium text-gray-600 capitalize">
            {stat.interval}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Due Date:</span>
          <div className="font-medium">
            {new Date(stat.nextDue).toLocaleDateString()}
          </div>
        </div>
        <div>
          <span className="text-gray-600">
            {isOverdue ? 'Days Overdue:' : 'Days Until Due:'}
          </span>
          <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {Math.abs(daysUntilDue)}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Last Completed:</span>
          <div className="font-medium">
            {stat.lastCompleted 
              ? new Date(stat.lastCompleted).toLocaleDateString()
              : 'Never'
            }
          </div>
        </div>
        <div>
          <span className="text-gray-600">Success Rate:</span>
          <div className={`font-medium ${
            stat.successRate >= 0.8 ? 'text-green-600' :
            stat.successRate >= 0.5 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {Math.round(stat.successRate * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Progress Forecast Component
 */
function ProgressForecastView({ progressForecast }: { progressForecast: ProgressForecast[] }) {
  if (progressForecast.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔮</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Forecast Data</h3>
            <p className="text-gray-600">Complete more habits to generate predictions!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take next 7 days for weekly forecast
  const weeklyForecast = progressForecast.slice(0, 7);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">🔮 Progress Forecast</h3>
        <p className="text-sm text-gray-600">Predicted completion rates for the next 7 days</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {weeklyForecast.map((forecast, index) => {
            const date = new Date(forecast.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const confidencePercentage = Math.round(forecast.confidence * 100);
            
            return (
              <div key={forecast.date} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-20">
                  <div className="font-medium text-sm text-gray-900">{dayName}</div>
                  <div className="text-xs text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Projected Completions</span>
                    <span className="text-sm font-medium text-gray-900">
                      ~{Math.round(forecast.projected)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(forecast.projected * 20, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-500">Confidence</div>
                  <div className={`text-sm font-medium ${
                    confidencePercentage >= 70 ? 'text-green-600' :
                    confidencePercentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {confidencePercentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 text-sm">💡</span>
            <div className="text-sm text-blue-800">
              <strong>Forecast Notes:</strong> Predictions based on your recent completion patterns. 
              Higher confidence indicates more reliable predictions based on consistent behavior.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}