import React from 'react';

interface SimpleProgressProps {
  completedToday: number;
  totalToday: number;
  currentStreak: number;
  onSelectGoals?: () => void;
}

export function SimpleProgress({ completedToday, totalToday, currentStreak, onSelectGoals }: SimpleProgressProps) {
  const percentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const hasHabits = totalToday > 0;
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {hasHabits ? (
        <>
          <h3 className="font-semibold text-gray-900 mb-4">Today's Progress</h3>
          
          <div className="space-y-6">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Daily completion</span>
                <span className="font-medium text-gray-900">{completedToday}/{totalToday} habits</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Daily progress: ${percentage}% complete`}
                >
                  <span className="sr-only">{percentage}% complete</span>
                </div>
              </div>
            </div>
            
            {/* Current streak */}
            <div className="flex items-center justify-between py-3 px-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center">
                <span className="text-lg mr-2">🔥</span>
                <span className="font-medium text-gray-900">Current Streak</span>
              </div>
              <span className="text-xl font-bold text-orange-600">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
        
            {/* Encouragement message */}
            {percentage === 100 ? (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm font-medium text-green-800">
                  🎉 Perfect day! All habits completed
                </p>
              </div>
            ) : percentage >= 50 ? (
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-800">
                  Great progress! You're more than halfway there
                </p>
              </div>
            ) : completedToday > 0 ? (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-sm font-medium text-yellow-800">
                  Nice start! Every habit completed counts
                </p>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-600">
                  Ready to begin? Start with any habit above
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Welcome to ScienceHabits!</h3>
          <p className="text-sm font-medium text-gray-600 mb-4">
            Ready to begin?
          </p>
          {onSelectGoals ? (
            <button
              onClick={onSelectGoals}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Select a Goal
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Start by selecting your goals in the onboarding
            </p>
          )}
        </div>
      )}
    </div>
  );
}