import React from 'react';
import { Habit, Progress } from '../../types';
import { Card, CardContent } from '../ui';
import {
  getWeeklyGoalProgress,
  getRemainingSessionsForWeek,
  getDaysRemainingInWeek,
  isWeeklyGoalMet,
  getWeeklyGoalUrgency,
  getPreferredDaysString,
  isPreferredDay
} from '../../utils/weeklyGoalHelpers';
import { getFrequencyDescription } from '../../utils/frequencyHelpers';

interface WeeklyGoalCardProps {
  habit: Habit;
  progress: Progress;
  onComplete: () => void;
  showDetails?: boolean;
}

export function WeeklyGoalCard({ habit, progress, onComplete, showDetails = false }: WeeklyGoalCardProps) {
  // Only render for weekly habits
  if (habit.frequency.type !== 'weekly' || !habit.frequency.weeklyTarget) {
    return null;
  }

  const { sessionsPerWeek, preferredDays } = habit.frequency.weeklyTarget;
  const weeklyProgress = progress.weeklyProgress || [];
  
  const goalProgress = getWeeklyGoalProgress(weeklyProgress, sessionsPerWeek);
  const remainingSessions = getRemainingSessionsForWeek(weeklyProgress, sessionsPerWeek);
  const daysRemaining = getDaysRemainingInWeek();
  const isGoalMet = isWeeklyGoalMet(weeklyProgress, sessionsPerWeek);
  const urgency = getWeeklyGoalUrgency(weeklyProgress, sessionsPerWeek);
  const isPreferredToday = isPreferredDay(habit.frequency);
  
  const urgencyColors = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200', 
    high: 'bg-red-50 border-red-200'
  };

  const progressColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500'
  };

  const currentWeekProgress = weeklyProgress.find(w => 
    w.weekStart === new Date().toISOString().split('T')[0].slice(0, 8) + 
    (new Date().getDay() === 0 ? '01' : String(new Date().getDate() - new Date().getDay() + 1).padStart(2, '0'))
  );

  const completedSessions = currentWeekProgress?.completedSessions || 0;

  return (
    <Card className={`${urgencyColors[urgency]} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">📅</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 text-sm">{habit.title}</h3>
              <p className="text-xs text-gray-500">{getFrequencyDescription(habit.frequency)}</p>
            </div>
          </div>
          
          {isGoalMet && (
            <div className="flex items-center space-x-1">
              <span className="text-green-600 text-lg">✅</span>
              <span className="text-xs font-medium text-green-700">Goal Met!</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{completedSessions} of {sessionsPerWeek} sessions</span>
            <span>{goalProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${progressColors[urgency]}`}
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Messages */}
        <div className="mb-3">
          {isGoalMet ? (
            <p className="text-sm text-green-700 font-medium">
              🎉 Weekly goal achieved! Great consistency this week.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{remainingSessions}</span> more session{remainingSessions !== 1 ? 's' : ''} needed
              </p>
              <p className="text-xs text-gray-600">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left this week
              </p>
              
              {urgency === 'high' && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Challenging to achieve - {remainingSessions} sessions in {daysRemaining} days
                </p>
              )}
            </div>
          )}
        </div>

        {/* Preferred Days Info */}
        {showDetails && preferredDays && preferredDays.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Preferred days:</span> {getPreferredDaysString(habit.frequency)}
            </p>
            {isPreferredToday && (
              <p className="text-xs text-blue-600 mt-1">
                ✨ Today is one of your preferred days!
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        {!isGoalMet && (
          <button
            onClick={onComplete}
            disabled={isGoalMet}
            className={`
              w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200
              ${urgency === 'high' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : urgency === 'medium'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
              ${isPreferredToday ? 'ring-2 ring-purple-300 ring-offset-1' : ''}
            `}
          >
            {urgency === 'high' ? 'Complete Now!' : 'Mark Complete'}
            {isPreferredToday && ' ⭐'}
          </button>
        )}

        {/* Completed Sessions This Week */}
        {showDetails && currentWeekProgress && currentWeekProgress.completedDates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-1">Completed this week:</p>
            <div className="flex flex-wrap gap-1">
              {currentWeekProgress.completedDates.map((date, index) => (
                <span
                  key={index}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                >
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}