import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button } from '../ui';
import { HabitAnalytics } from '../../utils/analyticsHelpers';
import { formatPercentage } from '../../stores/analyticsStore';

interface HabitPerformanceChartProps {
  habitPerformance: HabitAnalytics[];
}

export function HabitPerformanceChart({ habitPerformance }: HabitPerformanceChartProps) {
  const [sortBy, setSortBy] = useState<'completionRate' | 'streak' | 'consistency'>('completionRate');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const sortedHabits = [...habitPerformance].sort((a, b) => {
    switch (sortBy) {
      case 'completionRate':
        return b.completionRate - a.completionRate;
      case 'streak':
        return b.currentStreak - a.currentStreak;
      case 'consistency':
        return b.consistencyScore - a.consistencyScore;
      default:
        return 0;
    }
  });

  const getCategoryIcon = (category: string) => {
    const icons = {
      stress: '🧘‍♀️',
      productivity: '⚡',
      health: '💪',
      energy: '🔋',
      sleep: '😴',
      unknown: '✨'
    };
    return icons[category as keyof typeof icons] || icons.unknown;
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return { icon: '📈', color: 'text-green-600' };
      case 'down': return { icon: '📉', color: 'text-red-600' };
      default: return { icon: '➡️', color: 'text-gray-600' };
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Habit Performance</h3>
          <div className="flex space-x-2">
            <Button
              variant={sortBy === 'completionRate' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('completionRate')}
            >
              Completion Rate
            </Button>
            <Button
              variant={sortBy === 'streak' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('streak')}
            >
              Current Streak
            </Button>
            <Button
              variant={sortBy === 'consistency' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('consistency')}
            >
              Consistency
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHabits.map((habit, index) => {
            const trend = getTrendIcon(habit.trendDirection);
            const isExpanded = showDetails === habit.habitId;
            
            return (
              <div key={habit.habitId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setShowDetails(isExpanded ? null : habit.habitId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryIcon(habit.habitCategory)}</span>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{habit.habitTitle}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-600">
                            {formatPercentage(habit.completionRate)} completion
                          </span>
                          <span className="text-sm text-gray-600">
                            {habit.currentStreak} day streak
                          </span>
                          <div className={`flex items-center space-x-1 text-sm ${trend.color}`}>
                            <span>{trend.icon}</span>
                            <span className="capitalize">{habit.trendDirection}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Performance bar */}
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getPerformanceColor(habit.completionRate)} transition-all duration-500`}
                          style={{ width: `${Math.max(5, habit.completionRate)}%` }}
                        />
                      </div>
                      
                      <span className="text-lg font-semibold text-gray-900 w-12 text-right">
                        {Math.round(habit.completionRate)}%
                      </span>
                      
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {habit.totalCompletions}
                        </div>
                        <p className="text-xs text-gray-600">Total Completions</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {habit.longestStreak}
                        </div>
                        <p className="text-xs text-gray-600">Longest Streak</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {Math.round(habit.consistencyScore)}
                        </div>
                        <p className="text-xs text-gray-600">Consistency Score</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {Math.round(habit.averageGapBetweenCompletions)}
                        </div>
                        <p className="text-xs text-gray-600">Avg Gap (days)</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-600">Last completed: </span>
                          <span className="font-medium">
                            {habit.lastCompleted 
                              ? new Date(habit.lastCompleted).toLocaleDateString() 
                              : 'Never'
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Days tracked: </span>
                          <span className="font-medium">{habit.daysTracked}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {habitPerformance.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Habit Data Yet</h3>
              <p className="text-gray-600">
                Start tracking habits to see detailed performance analytics here.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple visualization component for completion patterns
export function CompletionPatternChart({ 
  completions, 
  title 
}: { 
  completions: string[]; 
  title: string; 
}) {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      <div className="flex space-x-1">
        {last30Days.map((date, index) => {
          const hasCompletion = completions.includes(date);
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' });
          
          return (
            <div key={date} className="flex flex-col items-center space-y-1">
              <div 
                className={`w-3 h-8 rounded-sm ${
                  hasCompletion ? 'bg-green-500' : 'bg-gray-200'
                }`}
                title={`${date}: ${hasCompletion ? 'Completed' : 'Not completed'}`}
              />
              {index % 7 === 0 && (
                <span className="text-xs text-gray-500">{dayName}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}