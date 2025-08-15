/**
 * Mobile Habit Accordion
 * 
 * Expandable accordion showing habit performance with progressive disclosure.
 * Optimized for mobile with thumb-friendly touch targets.
 */

import React, { useState } from 'react';
import { Habit, Progress } from '../../../types';
import { AnalyticsData } from '../../../utils/analyticsHelpers';

interface MobileHabitAccordionProps {
  habits: Habit[];
  progress: Progress[];
  analytics: AnalyticsData;
}

interface HabitSummary {
  id: string;
  name: string;
  consistency: number;
  currentStreak: number;
  longestStreak: number;
  trend: 'improving' | 'stable' | 'declining' | 'starting';
  completionRate: number;
  daysSinceStart: number;
}

export function MobileHabitAccordion({ habits, progress, analytics }: MobileHabitAccordionProps) {
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  // Calculate habit summaries
  const habitSummaries: HabitSummary[] = habits.map(habit => {
    const habitProgress = progress.find(p => p.habitId === habit.id);
    
    if (!habitProgress) {
      return {
        id: habit.id,
        name: habit.title,
        consistency: 0,
        currentStreak: 0,
        longestStreak: 0,
        trend: 'starting' as const,
        completionRate: 0,
        daysSinceStart: 0
      };
    }

    // Calculate days since start
    const startDate = new Date(habitProgress.dateStarted);
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate overall completion rate (total completions / total days since start)
    const totalPossibleDays = Math.max(daysSinceStart, 1);
    const completionRate = (habitProgress.completions.length / totalPossibleDays) * 100;
    
    // Calculate recent consistency rate (last 30 days for better accuracy)
    const last30Days = 30;
    const recentPeriod = Math.min(daysSinceStart, last30Days);
    const recentCompletions = habitProgress.completions.filter(completion => {
      const completionDate = new Date(completion);
      const daysAgo = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= last30Days;
    });
    const consistencyRate = recentPeriod > 0 ? (recentCompletions.length / recentPeriod) * 100 : 0;
    
    // Determine trend (simplified)
    let trend: 'improving' | 'stable' | 'declining' | 'starting' = 'stable';
    if (daysSinceStart < 7) {
      trend = 'starting';
    } else if (habitProgress.currentStreak > habitProgress.longestStreak * 0.8) {
      trend = 'improving';
    } else if (habitProgress.currentStreak < habitProgress.longestStreak * 0.3) {
      trend = 'declining';
    }

    return {
      id: habit.id,
      name: habit.title,
      consistency: Math.round(consistencyRate), // Recent 30-day consistency rate
      currentStreak: habitProgress.currentStreak,
      longestStreak: habitProgress.longestStreak,
      trend,
      completionRate: Math.round(completionRate), // Overall completion rate since start
      daysSinceStart
    };
  });

  // Sort by current streak and consistency
  const sortedHabits = [...habitSummaries].sort((a, b) => {
    if (a.currentStreak !== b.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    return b.consistency - a.consistency;
  });

  if (habits.length === 0) {
    return (
      <div className="mb-6 px-4">
        <h3 className="text-lg font-semibold mb-3">Habit Performance</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-sm text-gray-600">Add habits to see performance analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 px-4">
      <h3 className="text-lg font-semibold mb-3">Habit Performance</h3>
      
      <div className="space-y-2">
        {sortedHabits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            isExpanded={expandedHabit === habit.id}
            onToggle={() => setExpandedHabit(
              expandedHabit === habit.id ? null : habit.id
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface HabitCardProps {
  habit: HabitSummary;
  isExpanded: boolean;
  onToggle: () => void;
}

function HabitCard({ habit, isExpanded, onToggle }: HabitCardProps) {
  const getTrendColor = (trend: string) => {
    const trendColors = {
      improving: 'text-green-600 bg-green-100',
      stable: 'text-blue-600 bg-blue-100',
      declining: 'text-orange-600 bg-orange-100',
      starting: 'text-purple-600 bg-purple-100'
    };
    return trendColors[trend as keyof typeof trendColors] || trendColors.stable;
  };

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 80) return 'text-green-600 bg-green-100';
    if (consistency >= 60) return 'text-blue-600 bg-blue-100';
    if (consistency >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      
      {/* Clickable Summary */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors min-h-[44px]"
      >
        <div className="flex items-center justify-between">
          
          {/* Left: Consistency Badge + Habit Info */}
          <div className="flex items-center flex-1 min-w-0">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center mr-3 flex-shrink-0
              ${getConsistencyColor(habit.consistency)}
            `}>
              <span className="text-sm font-bold">
                {habit.consistency}%
              </span>
            </div>
            
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {habit.name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`
                  text-xs px-2 py-1 rounded-full font-medium capitalize
                  ${getTrendColor(habit.trend)}
                `}>
                  {habit.trend}
                </span>
                <span className="text-xs text-gray-500">
                  {habit.daysSinceStart} days
                </span>
              </div>
            </div>
          </div>
          
          {/* Right: Current Streak + Expand Arrow */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-600">Current</div>
              <div className="text-sm font-semibold text-gray-900">
                {habit.currentStreak} days
              </div>
            </div>
            <div className="text-gray-400">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${
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
        </div>
      </button>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
          <HabitDetailView habit={habit} />
        </div>
      )}
    </div>
  );
}

interface HabitDetailViewProps {
  habit: HabitSummary;
}

function HabitDetailView({ habit }: HabitDetailViewProps) {
  return (
    <div className="pt-4 space-y-4">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-600">{habit.currentStreak}</div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-600">{habit.longestStreak}</div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>
      </div>
      
      {/* Dual Progress Metrics */}
      <div className="space-y-3">
        {/* Recent Consistency (30-day) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Recent Consistency</span>
            <span className="text-xs text-gray-500">{Math.round(habit.consistency)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(habit.consistency, 0), 100)}%` }}
            />
          </div>
        </div>
        
        {/* Overall Completion Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">Overall Completion</span>
            <span className="text-xs text-gray-500">{Math.round(habit.completionRate)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(habit.completionRate, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-xs font-semibold text-blue-900 mb-1">💡 Insight</h5>
        <p className="text-xs text-blue-800">
          {habit.consistency >= 70 && habit.completionRate >= 70
            ? "Excellent consistency and completion! You're building strong neural pathways."
            : habit.consistency >= 70 && habit.completionRate < 70
            ? "Great recent consistency! Your overall completion rate shows you're improving."
            : habit.consistency < 70 && habit.completionRate >= 70
            ? "Strong overall performance. Focus on recent consistency to maintain momentum."
            : habit.consistency >= 50 || habit.completionRate >= 50
            ? "Good progress. Small improvements compound over time."
            : habit.trend === 'starting'
            ? "Just getting started. Focus on small, consistent actions."
            : "Consider breaking this habit into smaller, easier steps."
          }
        </p>
      </div>
    </div>
  );
}