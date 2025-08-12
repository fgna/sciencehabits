import React from 'react';
import { Habit, Progress } from '../../types';
import { Card, CardContent, CardHeader } from '../ui';
import { WeeklyGoalCard } from '../progress/WeeklyGoalCard';
import {
  getWeekStart,
  getWeekEnd,
  getWeeklyStreak,
  getWeeklyGoalProgress,
  isWeeklyGoalMet
} from '../../utils/weeklyGoalHelpers';

interface WeeklyProgressDashboardProps {
  habits: Habit[];
  progress: Progress[];
  onHabitComplete: (habitId: string) => void;
}

export function WeeklyProgressDashboard({ 
  habits, 
  progress, 
  onHabitComplete 
}: WeeklyProgressDashboardProps) {
  // Filter to only weekly habits
  const weeklyHabits = habits.filter(h => h.frequency.type === 'weekly');
  
  if (weeklyHabits.length === 0) {
    return null;
  }

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weekRange = `${new Date(weekStart).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })} - ${new Date(weekEnd).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })}`;

  // Calculate weekly stats
  const weeklyStats = weeklyHabits.map(habit => {
    const habitProgress = progress.find(p => p.habitId === habit.id);
    const weeklyProgress = habitProgress?.weeklyProgress || [];
    const targetSessions = habit.frequency.weeklyTarget?.sessionsPerWeek || 3;
    
    return {
      habit,
      progress: habitProgress,
      goalProgress: getWeeklyGoalProgress(weeklyProgress, targetSessions),
      isGoalMet: isWeeklyGoalMet(weeklyProgress, targetSessions),
      weeklyStreak: getWeeklyStreak(weeklyProgress)
    };
  });

  const totalWeeklyGoals = weeklyStats.length;
  const completedGoals = weeklyStats.filter(s => s.isGoalMet).length;
  const averageProgress = weeklyStats.length > 0 
    ? Math.round(weeklyStats.reduce((sum, s) => sum + s.goalProgress, 0) / weeklyStats.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Weekly Overview Header */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Weekly Goals</h2>
              <p className="text-sm text-gray-600">{weekRange}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {completedGoals}/{totalWeeklyGoals}
              </div>
              <p className="text-xs text-gray-600">Goals Achieved</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Overview */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{averageProgress}%</div>
              <p className="text-xs text-gray-600">Avg Progress</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {weeklyStats.reduce((sum, s) => sum + s.weeklyStreak, 0)}
              </div>
              <p className="text-xs text-gray-600">Total Streaks</p>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{totalWeeklyGoals}</div>
              <p className="text-xs text-gray-600">Weekly Habits</p>
            </div>
          </div>

          {/* Overall Weekly Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Overall Weekly Progress</span>
              <span>{averageProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-600">{completedGoals} completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-gray-600">{totalWeeklyGoals - completedGoals} in progress</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Weekly Goal Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">This Week's Goals</h3>
        
        {/* Group by completion status */}
        <div className="space-y-4">
          {/* Incomplete goals first (more urgent) */}
          {weeklyStats
            .filter(stat => !stat.isGoalMet)
            .sort((a, b) => {
              // Sort by urgency, then by progress
              const urgencyA = getUrgencyScore(a.habit, a.progress);
              const urgencyB = getUrgencyScore(b.habit, b.progress);
              if (urgencyA !== urgencyB) return urgencyB - urgencyA; // Higher urgency first
              return b.goalProgress - a.goalProgress; // Higher progress first
            })
            .map(({ habit, progress }) => (
              <WeeklyGoalCard
                key={habit.id}
                habit={habit}
                progress={progress!}
                onComplete={() => onHabitComplete(habit.id)}
                showDetails={true}
              />
            ))}

          {/* Completed goals */}
          {weeklyStats
            .filter(stat => stat.isGoalMet)
            .map(({ habit, progress }) => (
              <WeeklyGoalCard
                key={habit.id}
                habit={habit}
                progress={progress!}
                onComplete={() => onHabitComplete(habit.id)}
                showDetails={false}
              />
            ))}
        </div>

        {/* Empty state */}
        {totalWeeklyGoals === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Weekly Goals</h3>
            <p className="text-gray-600 mb-4">You don't have any weekly habits set up yet.</p>
            <p className="text-sm text-gray-500">
              Consider creating habits with weekly goals like "Exercise 3 times per week" or "Meditate 4 times per week".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate urgency score for sorting
function getUrgencyScore(habit: Habit, progress?: Progress): number {
  if (!progress || !habit.frequency.weeklyTarget) return 0;
  
  const { getWeeklyGoalUrgency } = require('../../utils/weeklyGoalHelpers');
  const urgency = getWeeklyGoalUrgency(
    progress.weeklyProgress || [], 
    habit.frequency.weeklyTarget.sessionsPerWeek
  );
  
  const urgencyScores: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
  return urgencyScores[urgency] || 0;
}