import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '../ui';
import { useUserStore } from '../../stores/userStore';
import { EnhancedAnalyticsView } from './EnhancedAnalyticsView';

export function AnalyticsView() {
  const { userProgress, userHabits } = useUserStore();
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [stats, setStats] = useState({
    totalHabits: 0,
    totalCompletions: 0,
    completionRate: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  useEffect(() => {
    if (userProgress.length === 0 || userHabits.length === 0) {
      return;
    }

    // Calculate basic stats from Progress interface
    const totalCompletions = userProgress.reduce((total, progress) => total + progress.completions.length, 0);
    
    // Find earliest date user started tracking (from progress entries)
    let earliestDate = new Date();
    userProgress.forEach(progress => {
      if (progress.dateStarted) {
        const startDate = new Date(progress.dateStarted);
        if (startDate < earliestDate) {
          earliestDate = startDate;
        }
      } else if (progress.completions.length > 0) {
        const firstCompletion = new Date(progress.completions[0]);
        if (firstCompletion < earliestDate) {
          earliestDate = firstCompletion;
        }
      }
    });
    
    // Calculate actual days since user started (not just last 7 days)
    const today = new Date();
    const daysSinceStart = Math.max(1, Math.ceil((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));
    const cappedDays = Math.min(daysSinceStart, 30); // Cap at 30 days for reasonable display
    
    const totalPossibleCompletions = userHabits.length * cappedDays;
    const completionRate = totalPossibleCompletions > 0 ? (totalCompletions / totalPossibleCompletions) * 100 : 0;

    // Calculate current and longest streaks
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (userProgress.length > 0) {
      // Get current and longest streaks from progress data
      currentStreak = Math.max(...userProgress.map(p => p.currentStreak), 0);
      longestStreak = Math.max(...userProgress.map(p => p.longestStreak), 0);
    }

    setStats({
      totalHabits: userHabits.length,
      totalCompletions,
      completionRate: Math.round(completionRate),
      currentStreak,
      longestStreak
    });
  }, [userProgress, userHabits]);

  if (userProgress.length === 0 && userHabits.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Yet</h2>
              <p className="text-gray-600">
                Start tracking habits to see your progress analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use enhanced view if requested
  if (isEnhanced) {
    return <EnhancedAnalyticsView onBackToSimple={() => setIsEnhanced(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your habit completion and streaks</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEnhanced(true)}
        >
          📊 Enhanced Analytics
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalHabits}
              </div>
              <div className="text-sm text-gray-600">Active Habits</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.totalCompletions}
              </div>
              <div className="text-sm text-gray-600">Total Completions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.completionRate}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Progress */}
      <Card>
        <CardContent>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Habit Progress</h2>
            {userProgress.length > 0 ? (
              <div className="space-y-2">
                {userProgress
                  .slice(0, 10)
                  .map((progress, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-900">
                          {userHabits.find(h => h.id === progress.habitId)?.title || 'Habit'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({progress.completions.length} completions)
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {progress.currentStreak > 0 ? `${progress.currentStreak} day streak` : 'No current streak'}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No progress yet. Complete some habits to see your progress here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simple Encouragement */}
      <Card>
        <CardContent>
          <div className="p-6 text-center">
            {stats.currentStreak > 0 ? (
              <div>
                <div className="text-2xl mb-2">🔥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Great job! You're on a {stats.currentStreak}-day streak!
                </h3>
                <p className="text-gray-600">
                  Keep up the momentum and continue building healthy habits.
                </p>
              </div>
            ) : stats.totalCompletions > 0 ? (
              <div>
                <div className="text-2xl mb-2">💪</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  You've completed {stats.totalCompletions} habits so far!
                </h3>
                <p className="text-gray-600">
                  Every completion is progress. Start a new streak today!
                </p>
              </div>
            ) : (
              <div>
                <div className="text-2xl mb-2">🌱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to start your journey?
                </h3>
                <p className="text-gray-600">
                  Complete your first habit to see your progress analytics here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}