import React from 'react';
import { useUserStore, getTodayCompletions, getDashboardStats } from '../../stores/userStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useCurrentDate } from '../../hooks/useCurrentDate';
import { Card, CardContent } from '../ui';
import { HabitChecklistCard } from './HabitChecklistCard';
import { ProgressStatsCard } from './ProgressStatsCard';
import { WeeklyProgressDashboard } from './WeeklyProgressDashboard';

export function TodayView() {
  const { currentUser, userHabits, userProgress, isLoading, error, updateUserProgress } = useUserStore();
  const { resetOnboarding } = useOnboardingStore();
  const { todayDisplay } = useCurrentDate();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Refresh Page
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser || userHabits.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
              <p className="text-gray-600 mb-6">
                Complete onboarding to start your science-backed habit journey
              </p>
              <button
                onClick={() => {
                  // Reset onboarding to start fresh goal selection
                  resetOnboarding();
                  // Clear user data and trigger re-initialization
                  localStorage.removeItem('sciencehabits_user_id');
                  window.location.reload();
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Select a goal
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separate daily and weekly habits
  const dailyHabits = userHabits.filter(h => h.frequency.type === 'daily');
  const weeklyHabits = userHabits.filter(h => h.frequency.type === 'weekly');
  
  const todayCompletions = getTodayCompletions(userProgress) || [];
  const stats = getDashboardStats(userProgress);
  
  // Calculate completion percentage based on daily habits for "today's progress"
  const dailyCompletions = todayCompletions.filter(completion => 
    dailyHabits.find(h => h.id === completion.habitId)
  );
  const completionPercentage = dailyHabits.length > 0 
    ? Math.round((dailyCompletions.length / dailyHabits.length) * 100)
    : 0;

  // Handler for habit completion
  const handleHabitComplete = async (habitId: string) => {
    await updateUserProgress(habitId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeOfDayGreeting()}{currentUser.name ? `, ${currentUser.name}` : ''}!
          </h1>
          <p className="text-gray-600">{todayDisplay}</p>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600">
            {completionPercentage}%
          </div>
          <div className="text-sm text-gray-500">
            {dailyCompletions.length} of {dailyHabits.length} daily habits
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <ProgressStatsCard stats={stats} />

      {/* Weekly Goals Dashboard */}
      {weeklyHabits.length > 0 && (
        <WeeklyProgressDashboard 
          habits={weeklyHabits}
          progress={userProgress}
          onHabitComplete={handleHabitComplete}
        />
      )}

      {/* Today's Daily Habits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Today's Habits</h2>
          {completionPercentage === 100 && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              All done! 🎉
            </div>
          )}
        </div>

        <div className="space-y-4">
          {dailyHabits.map((habit) => (
            <HabitChecklistCard 
              key={habit.id} 
              habit={habit}
              progress={userProgress.find(p => p.habitId === habit.id)}
            />
          ))}
          
          {dailyHabits.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No daily habits configured.</p>
              <p className="text-sm mt-1">All your habits are weekly or periodic.</p>
            </div>
          )}
        </div>
      </div>

      {/* Motivational Message */}
      {completionPercentage > 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-2xl mb-2">
                {getMotivationalEmoji(completionPercentage)}
              </div>
              <p className="text-gray-700 font-medium">
                {getMotivationalMessage(completionPercentage, stats.longestStreak)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function getMotivationalEmoji(percentage: number): string {
  if (percentage === 100) return '🎉';
  if (percentage >= 75) return '🔥';
  if (percentage >= 50) return '💪';
  if (percentage >= 25) return '🌱';
  return '✨';
}

function getMotivationalMessage(percentage: number, longestStreak: number): string {
  if (percentage === 100) {
    return "Perfect day! You've completed all your habits. Your consistency is building lasting change.";
  }
  if (percentage >= 75) {
    return "You're on fire! Just a few more habits to complete your perfect day.";
  }
  if (percentage >= 50) {
    return "Great progress! You're halfway there. Small steps lead to big changes.";
  }
  if (percentage >= 25) {
    return "Nice start! Every habit completed is a step toward your goals.";
  }
  if (longestStreak > 0) {
    return `Remember your ${longestStreak}-day streak? You can build that momentum again.`;
  }
  return "Today is a new opportunity to build positive habits. Start with just one!";
}