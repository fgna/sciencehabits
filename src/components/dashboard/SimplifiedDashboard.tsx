import React, { useMemo, useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { MinimalHabitCard, SimpleProgress } from '../ui';
import { HabitResearchModal } from '../research/HabitResearchModal';

export function SimplifiedDashboard() {
  const { currentUser, userHabits, userProgress, clearUser } = useUserStore();
  const [researchModal, setResearchModal] = useState<{
    isOpen: boolean;
    habitId: string;
    habitTitle: string;
    researchIds: string[];
  }>({
    isOpen: false,
    habitId: '',
    habitTitle: '',
    researchIds: []
  });
  
  // Handle restarting onboarding to select goals
  const handleSelectGoals = async () => {
    try {
      // Clear user data to restart onboarding
      await clearUser();
      // Remove the stored user ID so onboarding shows again
      localStorage.removeItem('sciencehabits_user_id');
      // Refresh the page to restart the app flow
      window.location.reload();
    } catch (error) {
      console.error('Failed to restart onboarding:', error);
    }
  };
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate which habits are completed today
  const habitsWithProgress = useMemo(() => {
    return userHabits.map(habit => {
      const progress = userProgress.find(p => p.habitId === habit.id);
      const isCompletedToday = progress?.completions.includes(today) || false;
      
      return {
        ...habit,
        progress,
        isCompletedToday
      };
    });
  }, [userHabits, userProgress, today]);
  
  // Get the next uncompleted habit
  const nextHabit = habitsWithProgress.find(h => !h.isCompletedToday);
  
  // Calculate today's progress
  const todayProgress = {
    completed: habitsWithProgress.filter(h => h.isCompletedToday).length,
    total: habitsWithProgress.length,
    percentage: habitsWithProgress.length > 0 
      ? Math.round((habitsWithProgress.filter(h => h.isCompletedToday).length / habitsWithProgress.length) * 100)
      : 0
  };
  
  // Get current streak (longest current streak among all habits)
  const currentStreak = Math.max(...userProgress.map(p => p.currentStreak), 0);
  
  // Helper functions
  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  async function handleCompleteHabit(habitId: string) {
    const { updateUserProgress } = useUserStore.getState();
    await updateUserProgress(habitId);
  }
  
  function handleSkipHabit(habitId: string) {
    // For now, just log the skip - could add skip tracking later
    console.log('Skipped habit:', habitId);
  }
  
  function handleViewResearch(habitId: string) {
    // Find the habit to get its research IDs
    const habit = userHabits.find(h => h.id === habitId);
    if (habit) {
      setResearchModal({
        isOpen: true,
        habitId: habit.id,
        habitTitle: habit.title,
        researchIds: habit.researchIds || []
      });
    }
  }
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to ScienceHabits</h2>
          <p className="text-gray-500">Please complete onboarding to get started</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Simple Welcome Message */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeOfDay()}, {currentUser.name || 'there'}!
          </h1>
          <p className="text-gray-600 mt-2">
            {nextHabit 
              ? "Let's focus on your next habit"
              : todayProgress.completed > 0 
                ? "Great job! You've completed all habits for today" 
                : "Ready to start your day?"}
          </p>
        </div>
        
        {/* Focus Card - Next Habit or Completion Message */}
        {nextHabit ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-blue-600">NEXT UP</span>
              <span className="text-sm text-gray-500">{nextHabit.timeMinutes} min</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{nextHabit.title}</h2>
            <p className="text-gray-600 mb-6">{nextHabit.description}</p>
            <button
              onClick={() => handleCompleteHabit(nextHabit.id)}
              className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Now
            </button>
          </div>
        ) : todayProgress.completed > 0 ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">All Done!</h2>
              <p className="text-gray-600">You've completed all {todayProgress.completed} habits for today</p>
            </div>
          </div>
        ) : null}
        
        {/* Simple Progress Overview */}
        <SimpleProgress 
          completedToday={todayProgress.completed}
          totalToday={todayProgress.total}
          currentStreak={currentStreak}
          onSelectGoals={handleSelectGoals}
        />
        
        {/* Minimal Habit List */}
        {habitsWithProgress.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Today's Habits</h3>
            </div>
            <div>
              {habitsWithProgress.map(habit => (
                <MinimalHabitCard
                  key={habit.id}
                  habit={{
                    id: habit.id,
                    title: habit.title,
                    duration: `${habit.timeMinutes} min`,
                    isCompleted: habit.isCompletedToday,
                    instructions: Array.isArray(habit.instructions) ? habit.instructions.join('\n') : habit.instructions,
                    whyEffective: habit.whyEffective
                  }}
                  onComplete={handleCompleteHabit}
                  onSkip={handleSkipHabit}
                  onViewResearch={handleViewResearch}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Research Modal */}
      <HabitResearchModal
        isOpen={researchModal.isOpen}
        onClose={() => setResearchModal({ ...researchModal, isOpen: false })}
        habitId={researchModal.habitId}
        habitTitle={researchModal.habitTitle}
        researchIds={researchModal.researchIds}
      />
    </div>
  );
}