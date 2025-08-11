import React from 'react';
import { Card, CardHeader, CardContent } from '../ui';

interface StatsData {
  totalHabits: number;
  totalCompletions: number;
  longestStreak: number;
  avgStreak: number;
  activeStreaks: number;
}

interface ProgressStatsCardProps {
  stats: StatsData;
}

export function ProgressStatsCard({ stats }: ProgressStatsCardProps) {
  const { totalHabits, totalCompletions, longestStreak, avgStreak, activeStreaks } = stats;

  const statItems = [
    {
      label: 'Active Habits',
      value: totalHabits,
      icon: '🎯',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Completions',
      value: totalCompletions,
      icon: '✅',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Longest Streak',
      value: `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`,
      icon: '🏆',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Current Streaks',
      value: `${activeStreaks}/${totalHabits}`,
      icon: '🔥',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Your Progress</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${item.bgColor} mb-2`}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${item.color} mb-1`}>
                {item.value}
              </div>
              <div className="text-sm text-gray-600">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress insights */}
        {totalCompletions > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-1">
              {longestStreak >= 7 && (
                <p className="flex items-center">
                  <span className="mr-2">🌟</span>
                  You've built a strong habit with your {longestStreak}-day streak!
                </p>
              )}
              {activeStreaks > 0 && (
                <p className="flex items-center">
                  <span className="mr-2">🔥</span>
                  You have {activeStreaks} active streak{activeStreaks > 1 ? 's' : ''} going strong.
                </p>
              )}
              {avgStreak >= 3 && (
                <p className="flex items-center">
                  <span className="mr-2">📈</span>
                  Your average streak is {avgStreak} days - showing great consistency!
                </p>
              )}
              {totalCompletions >= 50 && (
                <p className="flex items-center">
                  <span className="mr-2">🎉</span>
                  Incredible! You've completed {totalCompletions} habits total.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Motivational message for new users */}
        {totalCompletions === 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-gray-600 text-sm">
              Your journey starts today! Complete your first habit to see your progress grow.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklyProgressChart({ progress }: { progress: any[] }) {
  // This could be expanded to show a 7-day completion chart
  // For now, showing a simple weekly overview
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end space-x-2">
          {last7Days.map((date, index) => {
            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            const completions = progress.reduce((count, p) => {
              return count + (p.completions.includes(date) ? 1 : 0);
            }, 0);
            
            const maxHeight = 48; // max height in pixels
            const height = Math.max(4, (completions / Math.max(1, progress.length)) * maxHeight);
            
            return (
              <div key={date} className="flex flex-col items-center space-y-1">
                <div 
                  className="bg-primary-500 rounded-t min-h-[4px] w-8 transition-all"
                  style={{ height: `${height}px` }}
                />
                <span className="text-xs text-gray-500">{dayName}</span>
                <span className="text-xs font-medium text-gray-700">{completions}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-center text-xs text-gray-500">
          Habits completed per day
        </div>
      </CardContent>
    </Card>
  );
}