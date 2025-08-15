/**
 * Mobile-First Habits View
 * 
 * Single-column layout optimized for 360px screens.
 * Maximum 3 habits visible without scrolling.
 */

import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { HabitResearchModal } from '../research/HabitResearchModal';

interface MobileHabitItem {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  isCompleted: boolean;
  streak: number;
  completion: number;
  researchBacked: boolean;
}

export function MobileFirstHabitsView() {
  const { userHabits, userProgress, updateUserProgress } = useUserStore();
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
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

  // Process habits for mobile display
  const mobileHabits: MobileHabitItem[] = userHabits.map(habit => {
    const progress = userProgress.find(p => p.habitId === habit.id);
    const isCompleted = progress?.completions.includes(today) || false;
    const completion = progress ? 
      Math.round((progress.completions.length / Math.max(progress.totalDays, 1)) * 100) : 0;

    return {
      id: habit.id,
      title: habit.title.length > 25 ? `${habit.title.substring(0, 25)}...` : habit.title,
      description: habit.description.length > 60 ? `${habit.description.substring(0, 60)}...` : habit.description,
      timeMinutes: habit.timeMinutes,
      isCompleted,
      streak: progress?.currentStreak || 0,
      completion,
      researchBacked: (habit.researchIds?.length || 0) > 0
    };
  });

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

  function getStatusColor(completion: number): string {
    if (completion >= 80) return 'bg-green-100 text-green-600';
    if (completion >= 60) return 'bg-blue-100 text-blue-600';
    if (completion >= 40) return 'bg-yellow-100 text-yellow-600';
    return 'bg-gray-100 text-gray-600';
  }

  if (mobileHabits.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Habits Yet</h2>
          <p className="text-gray-600 mb-6">Add your first science-backed habit to get started</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Add Habit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">My Habits</h1>
        <p className="text-sm text-gray-600 mt-1">
          {mobileHabits.filter(h => h.isCompleted).length} of {mobileHabits.length} completed today
        </p>
      </div>

      {/* Habits List */}
      <div className="px-4 py-4 space-y-3">
        {mobileHabits.map((habit) => (
          <div 
            key={habit.id}
            className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm"
          >
            
            {/* Habit Summary */}
            <button
              onClick={() => setExpandedHabit(
                expandedHabit === habit.id ? null : habit.id
              )}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors min-h-[48px]"
            >
              <div className="flex items-center space-x-3">
                
                {/* Status Circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  getStatusColor(habit.completion)
                }`}>
                  <span className="text-sm font-bold">
                    {habit.completion}%
                  </span>
                </div>
                
                {/* Habit Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {habit.title}
                    </h3>
                    {habit.researchBacked && (
                      <span className="text-xs">📚</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {habit.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {habit.timeMinutes} min
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      {habit.streak} day streak
                    </span>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex-shrink-0">
                  {habit.isCompleted ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteHabit(habit.id);
                      }}
                      className="bg-blue-600 text-white text-xs px-3 py-2 rounded-full hover:bg-blue-700 transition-colors min-h-[32px]"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            </button>
            
            {/* Expanded Details */}
            {expandedHabit === habit.id && (
              <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                <div className="pt-3 space-y-3">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">{habit.streak}</div>
                      <div className="text-xs text-gray-600">Current Streak</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">{habit.completion}%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                  
                  {/* Quick Tip */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-900 mb-1">💡 Quick Tip</h4>
                    <p className="text-xs text-blue-800">
                      Stack this habit after something you already do daily for better consistency.
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
                          <div className="text-xs font-medium text-gray-900 mb-1">
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

      {/* Add Habit Button */}
      <div className="px-4 pb-6">
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[48px]">
          + Add New Habit
        </button>
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