/**
 * Mobile-First Dashboard
 * 
 * Designed for 360px-430px screens with thumb navigation only.
 * Follows strict mobile-first guidelines with maximum 3 items visible,
 * single-column layouts, and research-backed content integration.
 */

import React, { useState, useMemo } from 'react';
import { useUserStore } from '../../stores/userStore';
import { HabitResearchModal } from '../research/HabitResearchModal';

// Mobile-specific interfaces
interface MobilePrimaryMetric {
  icon: string;
  value: string;
  label: string;
  subtitle?: string;
  researchBacked: boolean;
}

interface MobileTodayStatus {
  completed: number;
  total: number;
  message: string;
}

interface MobileHabitSummary {
  id: string;
  name: string;
  completion: number;
  status: 'good' | 'needs-attention' | 'new';
  isCompletedToday: boolean;
  researchBacked: boolean;
}

export function MobileFirstDashboard() {
  const { currentUser, userHabits, userProgress, updateUserProgress } = useUserStore();
  
  // Mobile state management
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [showScienceModal, setShowScienceModal] = useState(false);
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

  const today = new Date().toISOString().split('T')[0];

  // Calculate mobile-optimized metrics
  const mobileMetrics = useMemo(() => {
    const habitsWithProgress = userHabits.map(habit => {
      const progress = userProgress.find(p => p.habitId === habit.id);
      const isCompletedToday = progress?.completions.includes(today) || false;
      
      return {
        ...habit,
        progress,
        isCompletedToday,
        completion: progress ? 
          Math.round((progress.completions.length / Math.max(progress.totalDays, 1)) * 100) : 0
      };
    });

    // Today's status
    const todayStatus: MobileTodayStatus = {
      completed: habitsWithProgress.filter(h => h.isCompletedToday).length,
      total: habitsWithProgress.length,
      message: habitsWithProgress.filter(h => h.isCompletedToday).length === habitsWithProgress.length 
        ? "All done! 🎉" 
        : habitsWithProgress.filter(h => h.isCompletedToday).length > 0
        ? "Almost there!"
        : "Let's get started!"
    };

    // Today's primary metric - current streak (most relevant for daily dashboard)
    const currentStreak = Math.max(...userProgress.map(p => p.currentStreak), 0);
    
    const primaryMetric: MobilePrimaryMetric = {
      icon: '🔥',
      value: `${currentStreak}`,
      label: 'Current Streak',
      subtitle: currentStreak >= 7 ? 'Amazing momentum!' : 'Keep building!',
      researchBacked: true
    };

    // Mobile habit summaries (max 3 shown)
    const habitSummaries: MobileHabitSummary[] = habitsWithProgress
      .map(habit => ({
        id: habit.id,
        name: habit.title.length > 20 ? `${habit.title.substring(0, 20)}...` : habit.title,
        completion: habit.completion,
        status: (habit.completion >= 70 ? 'good' : 
                habit.completion >= 40 ? 'needs-attention' : 'new') as 'good' | 'needs-attention' | 'new',
        isCompletedToday: habit.isCompletedToday,
        researchBacked: (habit.researchIds?.length || 0) > 0
      }))
      .slice(0, 3); // Mobile constraint: max 3 items

    return {
      primaryMetric,
      todayStatus,
      habitSummaries,
      encouragement: getEncouragementMessage(todayStatus, currentStreak)
    };
  }, [userHabits, userProgress, today]);

  // Helper functions
  function getEncouragementMessage(todayStatus: MobileTodayStatus, streak: number): string {
    if (todayStatus.completed === todayStatus.total && todayStatus.total > 0) {
      return "Perfect day! Your brain is building stronger pathways.";
    }
    if (streak >= 7) {
      return "Amazing streak! Research shows you're in the habit formation zone.";
    }
    if (streak >= 3) {
      return "Great momentum! Your neural pathways are strengthening.";
    }
    if (todayStatus.completed > 0) {
      return "Great start! Small steps create lasting change.";
    }
    return "Today's a fresh start for building better habits!";
  }

  async function handleCompleteHabit(habitId: string) {
    await updateUserProgress(habitId);
  }

  function handleViewResearch(habitId: string) {
    const habit = userHabits.find(h => h.id === habitId);
    if (habit && habit.researchIds?.length) {
      setResearchModal({
        isOpen: true,
        habitId: habit.id,
        habitTitle: habit.title,
        researchIds: habit.researchIds
      });
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">👋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600">Complete onboarding to start your science-backed habit journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Sticky */}
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* App Name */}
            <h1 className="text-lg font-semibold text-gray-900">Today</h1>
            
            {/* Profile Icon */}
            <button className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm">👤</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        
        {/* Primary Metric Card - Hero Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="text-4xl mb-3">{mobileMetrics.primaryMetric.icon}</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {mobileMetrics.primaryMetric.value}
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {mobileMetrics.primaryMetric.label}
            </div>
            {mobileMetrics.primaryMetric.subtitle && (
              <div className="text-xs text-gray-500 mb-3">
                {mobileMetrics.primaryMetric.subtitle}
              </div>
            )}
            {mobileMetrics.primaryMetric.researchBacked && (
              <div className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                📚 Research-backed
              </div>
            )}
          </div>
        </div>

        {/* Today's Progress - Visual Bar */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Today's Progress</span>
            <span className="text-sm text-gray-500">
              {mobileMetrics.todayStatus.completed}/{mobileMetrics.todayStatus.total}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${mobileMetrics.todayStatus.total > 0 
                  ? (mobileMetrics.todayStatus.completed / mobileMetrics.todayStatus.total) * 100 
                  : 0}%` 
              }}
            />
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900 mb-1">
              {mobileMetrics.todayStatus.message}
            </div>
          </div>
        </div>

        {/* Encouragement Message */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="text-sm text-blue-800">
            {mobileMetrics.encouragement}
          </div>
        </div>

        {/* Habit Accordion - Collapsible List */}
        {mobileMetrics.habitSummaries.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">Your Habits</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {mobileMetrics.habitSummaries.map((habit) => (
                <div key={habit.id} className="overflow-hidden">
                  
                  {/* Habit Summary - Always Visible */}
                  <button
                    onClick={() => setExpandedHabit(
                      expandedHabit === habit.id ? null : habit.id
                    )}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors min-h-[48px]"
                  >
                    <div className="flex items-center justify-between">
                      
                      {/* Left: Status + Name */}
                      <div className="flex items-center flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                          habit.status === 'good' ? 'bg-green-100 text-green-600' :
                          habit.status === 'needs-attention' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-sm font-bold">{habit.completion}%</span>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {habit.name}
                            </h4>
                            {habit.researchBacked && (
                              <span className="text-xs">📚</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {habit.isCompletedToday ? '✓ Completed' : 'Tap to expand'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Complete Button + Arrow */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {!habit.isCompletedToday && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteHabit(habit.id);
                            }}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-700 transition-colors min-h-[32px]"
                          >
                            ✓ Done
                          </button>
                        )}
                        
                        <span className={`text-gray-400 transition-transform duration-200 ${
                          expandedHabit === habit.id ? 'rotate-180' : ''
                        }`}>
                          ↓
                        </span>
                      </div>
                    </div>
                  </button>
                  
                  {/* Expanded Content */}
                  {expandedHabit === habit.id && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="pt-3 space-y-3">
                        
                        {/* Quick Tip */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h5 className="text-xs font-semibold text-blue-900 mb-1">💡 Quick Tip</h5>
                          <p className="text-xs text-blue-800">
                            Start with just 2 minutes to build the neural pathway.
                          </p>
                        </div>
                        
                        {/* Research Link */}
                        {habit.researchBacked && (
                          <button
                            onClick={() => handleViewResearch(habit.id)}
                            className="w-full text-left bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  📚 View Research
                                </div>
                                <div className="text-xs text-gray-500">
                                  Learn the science behind this habit
                                </div>
                              </div>
                              <span className="text-gray-400">→</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Floating Action Button - Science Modal */}
      <button
        onClick={() => setShowScienceModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-20"
        aria-label="View today's science insight"
      >
        <span className="text-xl">🧠</span>
      </button>

      {/* Science Bottom Sheet Modal */}
      {showScienceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white rounded-t-xl w-full max-h-[80vh] animate-slide-up">
            <div className="px-4 py-6">
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
              
              {/* Content */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Today's Insight</h2>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    🧠 Why This Works
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Habits take an average of 66 days to become automatic. Your brain creates 
                    neural pathways through repetition, making behaviors easier over time.
                  </p>
                  <div className="text-xs text-blue-600">
                    📚 Lally et al. (2010) - European Journal of Social Psychology
                  </div>
                </div>
                
                <button
                  onClick={() => setShowScienceModal(false)}
                  className="w-full bg-gray-100 text-gray-700 rounded-lg py-3 font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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