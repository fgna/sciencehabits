import React, { useState, useEffect } from 'react';
import { EnhancedHabitCard } from '../habits/EnhancedHabitCard';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { useUserStore } from '../../stores/userStore';
import { Habit, HabitProgress } from '../../types';
import { smartSchedulingService, SmartSchedule, HabitStack } from '../../services/smartSchedulingService';

export function SmartDailyDashboard() {
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  const { currentUser, userHabits, userProgress, toggleHabitCompletion } = useUserStore();
  
  const [smartSchedule, setSmartSchedule] = useState<SmartSchedule | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState<'stacks' | 'all' | 'flexible'>('stacks');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSmartSchedule();
  }, [selectedDate, currentUser, userHabits, userProgress]);

  const loadSmartSchedule = async () => {
    if (!currentUser) {
      console.log('No current user, skipping schedule generation');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Generating smart schedule for:', {
        userId: currentUser.id,
        habitsCount: userHabits.length,
        progressCount: userProgress.length,
        selectedDate
      });
      
      // If no habits, create empty schedule immediately
      if (userHabits.length === 0) {
        console.log('No habits found, creating empty schedule');
        setSmartSchedule({
          userId: currentUser.id,
          date: selectedDate,
          stacks: [],
          flexibleSlots: [],
          adaptiveRecommendations: [],
          contextualHints: []
        });
        return;
      }
      
      const schedule = await smartSchedulingService.generateSmartSchedule(
        currentUser,
        userHabits,
        userProgress,
        selectedDate
      );
      
      console.log('Smart schedule generated:', schedule);
      setSmartSchedule(schedule);
    } catch (error) {
      console.error('Failed to load smart schedule:', error);
      // Set a fallback empty schedule to prevent infinite loading
      setSmartSchedule({
        userId: currentUser.id,
        date: selectedDate,
        stacks: [],
        flexibleSlots: [],
        adaptiveRecommendations: [],
        contextualHints: []
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onToggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    toggleHabitCompletion(habitId, today);
  };
  
  const onEditHabit = (habitId: string) => {
    // TODO: Implement edit habit functionality
    console.log('Edit habit:', habitId);
  };

  const getHabitProgress = (habitId: string) => {
    return userProgress.find(p => p.habitId === habitId);
  };

  const isHabitCompleted = (habitId: string) => {
    const habitProgress = getHabitProgress(habitId);
    return habitProgress?.completed || false;
  };

  const getContextualHint = (habitId: string) => {
    return smartSchedule?.contextualHints.find(hint => hint.habitId === habitId);
  };

  const getAdaptiveRecommendation = (habitId: string) => {
    return smartSchedule?.adaptiveRecommendations.find(rec => rec.habitId === habitId);
  };

  const renderHabitStack = (stack: HabitStack) => {
    const stackHabits = userHabits.filter(h => stack.habits.includes(h.id));
    const completedCount = stackHabits.filter(h => isHabitCompleted(h.id)).length;
    const progressPercentage = (completedCount / stackHabits.length) * 100;

    return (
      <div key={stack.id} className="mb-8">
        {/* Stack header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="w-3 h-3 bg-progress-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-gray-900">{stack.name}</h3>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {stack.schedule.startTime} - {stack.schedule.endTime} ({stack.totalDuration} min)
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {completedCount}/{stackHabits.length} complete
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-compassion-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stack effectiveness indicator */}
        <div className="bg-progress-50 border border-progress-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-progress-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-progress-800">
                Stack effectiveness: {Math.round(stack.effectiveness * 100)}%
              </span>
            </div>
            <div className="text-xs text-progress-600">
              Based on your completion patterns
            </div>
          </div>
        </div>

        {/* Habits in stack */}
        <div className="space-y-4">
          {stackHabits.map((habit, index) => (
            <EnhancedHabitCard
              key={habit.id}
              habit={habit}
              progress={getHabitProgress(habit.id)}
              isCompleted={isHabitCompleted(habit.id)}
              onToggle={onToggleHabit}
              onEdit={onEditHabit}
              contextualHint={getContextualHint(habit.id)}
              adaptiveRecommendation={getAdaptiveRecommendation(habit.id)}
              stackInfo={{
                stackName: stack.name,
                position: index + 1,
                totalInStack: stackHabits.length
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFlexibleHabits = () => {
    if (!smartSchedule) return null;

    const stackedHabitIds = new Set(smartSchedule.stacks.flatMap(stack => stack.habits));
    const flexibleHabits = userHabits.filter(h => !stackedHabitIds.has(h.id));

    if (flexibleHabits.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Flexible Habits</h3>
          <div className="text-sm text-gray-500">
            Schedule these when convenient
          </div>
        </div>
        
        <div className="space-y-4">
          {flexibleHabits.map(habit => (
            <EnhancedHabitCard
              key={habit.id}
              habit={habit}
              progress={getHabitProgress(habit.id)}
              isCompleted={isHabitCompleted(habit.id)}
              onToggle={onToggleHabit}
              onEdit={onEditHabit}
              contextualHint={getContextualHint(habit.id)}
              adaptiveRecommendation={getAdaptiveRecommendation(habit.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderAllHabits = () => {
    return (
      <div className="space-y-4">
        {userHabits.map(habit => (
          <EnhancedHabitCard
            key={habit.id}
            habit={habit}
            progress={getHabitProgress(habit.id)}
            isCompleted={isHabitCompleted(habit.id)}
            onToggle={onToggleHabit}
            onEdit={onEditHabit}
            contextualHint={getContextualHint(habit.id)}
            adaptiveRecommendation={getAdaptiveRecommendation(habit.id)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-progress-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Optimizing your daily schedule...</p>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (!smartSchedule || userHabits.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Habits to Schedule</h2>
          <p className="text-gray-600 mb-6">
            Start by adding some habits to see your personalized daily schedule.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-habits'))}
            className="px-6 py-3 bg-progress-600 text-white rounded-lg hover:bg-progress-700 transition-colors"
          >
            Add Your First Habit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Today's Smart Schedule
            </h1>
            <p className="text-gray-600">
              Personalized habit timing based on your patterns and preferences
            </p>
          </div>
          
          {/* Date selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDate(yesterday.toISOString().split('T')[0]);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Previous day"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-progress-500 focus:border-transparent"
            />
            
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Next day"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'stacks', label: 'Smart Stacks', icon: '🧱' },
            { key: 'flexible', label: 'Flexible', icon: '⚡' },
            { key: 'all', label: 'All Habits', icon: '📋' }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key as any)}
              className={`
                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeView === view.key 
                  ? 'bg-white text-progress-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <span className="mr-1">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Smart recommendations summary */}
      {smartSchedule?.adaptiveRecommendations && smartSchedule.adaptiveRecommendations.length > 0 && (
        <div className="bg-research-50 border border-research-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <div className="text-research-600 mr-3 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-research-800 mb-2">
                Smart Insights for Today
              </h3>
              <div className="text-sm text-research-700">
                I've analyzed your patterns and have {smartSchedule.adaptiveRecommendations.length} personalized suggestions to improve your habit success.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'stacks' && (
        <div>
          {smartSchedule?.stacks.map(renderHabitStack)}
          {renderFlexibleHabits()}
        </div>
      )}

      {activeView === 'flexible' && renderFlexibleHabits()}

      {activeView === 'all' && renderAllHabits()}

      {/* Daily stats */}
      <div className="mt-8 bg-compassion-50 border border-compassion-200 rounded-xl p-6">
        <h3 className="font-semibold text-compassion-800 mb-4">Today's Progress</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-compassion-700">
              {userHabits.filter(h => isHabitCompleted(h.id)).length}
            </div>
            <div className="text-sm text-compassion-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-progress-700">
              {Math.round((userHabits.filter(h => isHabitCompleted(h.id)).length / userHabits.length) * 100)}%
            </div>
            <div className="text-sm text-progress-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-research-700">
              {userHabits.reduce((sum, h) => sum + (h.timeMinutes || 10), 0)}
            </div>
            <div className="text-sm text-research-600">Minutes Planned</div>
          </div>
        </div>
      </div>
    </div>
  );
}