/**
 * Frequency Analytics Charts
 * 
 * Comprehensive charts and visualizations specifically designed
 * for different habit frequency types (daily, weekly, periodic)
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { 
  FrequencyTypeStats, 
  WeeklyGoalStats, 
  PeriodicHabitStats,
  ConsistencyPattern 
} from '../../utils/frequencyAnalyticsHelpers';

interface FrequencyAnalyticsChartsProps {
  frequencyStats: FrequencyTypeStats[];
  weeklyGoalStats: WeeklyGoalStats[];
  periodicStats: PeriodicHabitStats[];
  consistencyPatterns: ConsistencyPattern[];
  className?: string;
}

export function FrequencyAnalyticsCharts({
  frequencyStats,
  weeklyGoalStats,
  periodicStats,
  consistencyPatterns,
  className = ""
}: FrequencyAnalyticsChartsProps) {
  const [activeView, setActiveView] = useState<'frequency' | 'weekly' | 'periodic' | 'consistency'>('frequency');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'frequency', label: 'Frequency Overview', icon: '📊' },
          { id: 'weekly', label: 'Weekly Goals', icon: '📅' },
          { id: 'periodic', label: 'Periodic Habits', icon: '📆' },
          { id: 'consistency', label: 'Consistency', icon: '🎯' }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeView === tab.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveView(tab.id as any)}
            className="flex items-center space-x-2"
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Frequency Overview */}
      {activeView === 'frequency' && (
        <FrequencyOverviewChart frequencyStats={frequencyStats} />
      )}

      {/* Weekly Goals */}
      {activeView === 'weekly' && (
        <WeeklyGoalsChart weeklyGoalStats={weeklyGoalStats} />
      )}

      {/* Periodic Habits */}
      {activeView === 'periodic' && (
        <PeriodicHabitsChart periodicStats={periodicStats} />
      )}

      {/* Consistency Patterns */}
      {activeView === 'consistency' && (
        <ConsistencyPatternsChart consistencyPatterns={consistencyPatterns} />
      )}
    </div>
  );
}

/**
 * Frequency Overview Chart Component
 */
function FrequencyOverviewChart({ frequencyStats }: { frequencyStats: FrequencyTypeStats[] }) {
  const getFrequencyIcon = (type: string) => {
    const icons = { daily: '📅', weekly: '🗓️', periodic: '📆' };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getFrequencyColor = (type: string) => {
    const colors = {
      daily: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
      weekly: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
      periodic: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600' }
    };
    return colors[type as keyof typeof colors] || colors.daily;
  };

  if (frequencyStats.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No frequency data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Habit Frequency Performance</h3>
        <p className="text-sm text-gray-600">Success rates across different habit frequencies</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {frequencyStats.map(stat => {
              const colors = getFrequencyColor(stat.type);
              const successPercentage = Math.round(stat.successRate * 100);
              
              return (
                <div key={stat.type} className={`p-4 rounded-lg border ${colors.light}`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xl">{getFrequencyIcon(stat.type)}</span>
                    <h4 className={`font-medium ${colors.text} capitalize`}>{stat.type} Habits</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Habits:</span>
                      <span className="font-medium">{stat.habitCount}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className={`font-medium ${colors.text}`}>{successPercentage}%</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Streak:</span>
                      <span className="font-medium">{Math.round(stat.averageStreak)} days</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completions:</span>
                      <span className="font-medium">{stat.actualCompletions}/{stat.totalPossibleCompletions}</span>
                    </div>
                    
                    {stat.mostSuccessful !== 'None' && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          <strong>Top Performer:</strong><br/>
                          {stat.mostSuccessful}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Success Rate Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${colors.bg} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${successPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Chart */}
          <div className="mt-8">
            <h4 className="font-medium text-gray-900 mb-4">Success Rate Comparison</h4>
            <div className="space-y-3">
              {frequencyStats.map(stat => {
                const colors = getFrequencyColor(stat.type);
                const successPercentage = Math.round(stat.successRate * 100);
                
                return (
                  <div key={stat.type} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 w-20">
                      <span className="text-sm">{getFrequencyIcon(stat.type)}</span>
                      <span className="text-sm font-medium capitalize">{stat.type}</span>
                    </div>
                    
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-200 rounded-full h-6 flex items-center">
                        <div 
                          className={`${colors.bg} h-6 rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                          style={{ width: `${Math.max(successPercentage, 5)}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {successPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 w-16 text-right">
                      {stat.habitCount} habit{stat.habitCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Weekly Goals Chart Component
 */
function WeeklyGoalsChart({ weeklyGoalStats }: { weeklyGoalStats: WeeklyGoalStats[] }) {
  if (weeklyGoalStats.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <div>No weekly goal data available</div>
            <div className="text-sm mt-2">Create some weekly habits to see progress tracking here!</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentWeekStats = weeklyGoalStats.filter(stat => {
    const weekDate = new Date(stat.weekStart);
    const now = new Date();
    const weeksDiff = Math.floor((now.getTime() - weekDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return weeksDiff === 0; // Current week only
  });

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Weekly Goals Progress</h3>
        <p className="text-sm text-gray-600">Current week performance for weekly habits</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {currentWeekStats.map((stat, index) => {
            const completionPercentage = Math.round(stat.completionRate * 100);
            const isAheadOfSchedule = stat.daysAhead > 0;
            const isBehindSchedule = stat.daysAhead < -1;
            
            return (
              <div key={`${stat.habitId}-${index}`} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{stat.habitTitle}</h4>
                  <div className="flex items-center space-x-2">
                    {stat.goalMet && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        ✓ Goal Met
                      </span>
                    )}
                    {isAheadOfSchedule && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        🚀 Ahead
                      </span>
                    )}
                    {isBehindSchedule && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        ⏳ Behind
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-16">Progress:</span>
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full transition-all duration-500 ${
                            stat.goalMet ? 'bg-green-500' : 
                            completionPercentage >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(completionPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        {stat.completedSessions}/{stat.targetSessions}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{completionPercentage}%</span>
                  </div>
                  
                  {/* Schedule Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Schedule:</span>
                      <span className="ml-2">
                        {stat.daysAhead > 0 
                          ? `${stat.daysAhead} day${stat.daysAhead !== 1 ? 's' : ''} ahead`
                          : stat.daysAhead < -1
                          ? `${Math.abs(stat.daysAhead)} day${Math.abs(stat.daysAhead) !== 1 ? 's' : ''} behind`
                          : 'On track'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <span className="ml-2 font-medium">
                        {Math.max(0, stat.targetSessions - stat.completedSessions)} sessions
                      </span>
                    </div>
                  </div>
                  
                  {/* Preferred vs Actual Days */}
                  {stat.preferredDays.length > 0 && (
                    <div className="text-sm">
                      <div className="flex space-x-4">
                        <div>
                          <span className="text-gray-600">Preferred:</span>
                          <span className="ml-2">{stat.preferredDays.join(', ')}</span>
                        </div>
                        {stat.actualDays.length > 0 && (
                          <div>
                            <span className="text-gray-600">Completed on:</span>
                            <span className="ml-2">{stat.actualDays.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {currentWeekStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">🗓️</div>
              <div>No weekly habits active this week</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Periodic Habits Chart Component
 */
function PeriodicHabitsChart({ periodicStats }: { periodicStats: PeriodicHabitStats[] }) {
  if (periodicStats.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📆</div>
            <div>No periodic habits found</div>
            <div className="text-sm mt-2">Try creating quarterly or yearly habits!</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Periodic Habits Status</h3>
        <p className="text-sm text-gray-600">Quarterly and yearly habit tracking</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {periodicStats.map(stat => {
            const daysUntilDue = Math.ceil(
              (new Date(stat.nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <div key={stat.habitId} className={`p-4 border rounded-lg ${
                stat.isOverdue ? 'border-red-200 bg-red-50' : 
                daysUntilDue <= 7 ? 'border-yellow-200 bg-yellow-50' : 
                'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{stat.habitTitle}</h4>
                  <div className="flex items-center space-x-2">
                    {stat.isOverdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        🚨 Overdue
                      </span>
                    )}
                    {!stat.isOverdue && daysUntilDue <= 7 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        ⏰ Due Soon
                      </span>
                    )}
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize">
                      {stat.interval}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Next Due:</span>
                    <div className="font-medium">
                      {new Date(stat.nextDue).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">
                      {stat.isOverdue ? 'Days Overdue:' : 'Days Until Due:'}
                    </span>
                    <div className={`font-medium ${
                      stat.isOverdue ? 'text-red-600' : 
                      daysUntilDue <= 7 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {stat.isOverdue ? Math.abs(daysUntilDue) : daysUntilDue}
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
                
                {stat.daysSinceLastCompletion !== Infinity && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span>Days since last completion: </span>
                    <span className="font-medium">{stat.daysSinceLastCompletion}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Consistency Patterns Chart Component
 */
function ConsistencyPatternsChart({ consistencyPatterns }: { consistencyPatterns: ConsistencyPattern[] }) {
  if (consistencyPatterns.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No consistency data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPatternColor = (patternType: string) => {
    const colors = {
      strong: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
      moderate: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
      weak: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600' },
      irregular: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' }
    };
    return colors[patternType as keyof typeof colors] || colors.irregular;
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Consistency Patterns</h3>
        <p className="text-sm text-gray-600">When and how consistently you complete habits</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {consistencyPatterns.map(pattern => {
            const colors = getPatternColor(pattern.patternType);
            
            return (
              <div key={pattern.habitId} className={`p-4 border rounded-lg ${colors.light}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Habit Consistency Analysis</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 ${colors.light} ${colors.text} text-xs rounded-full capitalize`}>
                      {pattern.patternType}
                    </span>
                    <span className="text-sm text-gray-600">
                      {pattern.consistencyScore}/100
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Consistency Score Bar */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-20">Consistency:</span>
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${colors.bg} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${pattern.consistencyScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{pattern.consistencyScore}%</span>
                  </div>
                  
                  {/* Best Days */}
                  {pattern.bestDaysOfWeek.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Best days:</span>
                      <span className="ml-2 font-medium">{pattern.bestDaysOfWeek.join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {pattern.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-600 mb-1">Recommendations:</div>
                      <ul className="text-sm space-y-1">
                        {pattern.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}