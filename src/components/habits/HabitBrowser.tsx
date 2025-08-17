/**
 * Habit Browser Component
 * 
 * Allows users to browse and add science-backed habits that they're not currently tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Card } from '../ui';
import { Habit } from '../../types';
import { dbHelpers } from '../../services/storage/database';
import { useUserStore } from '../../stores/userStore';

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

interface HabitBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HabitBrowser({ isOpen, onClose }: HabitBrowserProps) {
  const [availableHabits, setAvailableHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { currentUser, userHabits, refreshProgress, loadUserData } = useUserStore();

  // Clear messages on user actions (matches existing failure message behavior)
  const clearMessages = useCallback(() => {
    console.log('🔍 clearMessages called - clearing both error and success messages');
    setError(null);
    setSuccessMessage(null);
  }, []);

  const loadAvailableHabits = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Initialize database first to ensure bundled content is loaded
      await dbHelpers.initializeDatabase();
      
      // Get all science-backed habits from the system (exclude custom habits)
      const allHabits = await dbHelpers.getAllHabits();
      const scienceBackedHabits = allHabits.filter(habit => !habit.isCustom);
      
      // Sort by category and name for consistent display
      const sortedHabits = scienceBackedHabits.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });
      
      setAvailableHabits(sortedHabits);
      console.log(`📚 Loaded ${allHabits.length} total habits, ${sortedHabits.length} science-backed habits available for browsing`);
    } catch (error) {
      console.error('Failed to load available habits:', error);
      setError('Failed to load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const loadUserGoals = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      // Get user's selected goals from their profile
      const goals = currentUser.goals || [];
      setUserGoals(goals);
      console.log(`🎯 User has ${goals.length} selected goals:`, goals);
    } catch (error) {
      console.error('Failed to load user goals:', error);
    }
  }, [currentUser]);

  const filterHabits = useCallback(async () => {
    if (!availableHabits.length || !currentUser) return;
    
    setIsFiltering(true);
    
    try {
      let filtered = [...availableHabits];
      
      // Filter by selected goal
      if (selectedGoal && selectedGoal !== 'all') {
        filtered = filtered.filter(habit => {
          // Check both category and goalTags for matches
          const matchesCategory = habit.category === selectedGoal;
          const matchesGoalTags = habit.goalTags && habit.goalTags.includes(selectedGoal);
          return matchesCategory || matchesGoalTags;
        });
      }
      
      // Get habits user is tracking from progress data instead of userHabits
      const userProgress = await dbHelpers.getUserProgress(currentUser.id);
      const trackedHabitIds = new Set(userProgress.map((p: any) => p.habitId));
      
      console.log(`🔍 DETAILED FILTERING DEBUG:`);
      console.log(`  Available habits before filtering:`, filtered.map(h => ({ id: h.id, title: h.title })));
      console.log(`  User habit IDs from userHabits store:`, userHabits.map(h => h.id));
      console.log(`  User habit IDs from progress data:`, Array.from(trackedHabitIds));
      console.log(`  Progress data:`, userProgress.map((p: any) => ({ habitId: p.habitId, completions: p.completions?.length || 0 })));
      
      // Filter using progress data (more reliable)
      const finalFiltered = filtered.filter(habit => {
        const hasHabit = trackedHabitIds.has(habit.id);
        console.log(`    Habit "${habit.title}" (${habit.id}): user tracking? ${hasHabit} → ${hasHabit ? 'FILTERED OUT' : 'INCLUDED'}`);
        return !hasHabit;
      });
      
      setFilteredHabits(finalFiltered);
      console.log(`🔍 FINAL RESULT: ${filtered.length} available → ${finalFiltered.length} after removing tracked habits`);
    } catch (error) {
      console.error('Failed to load user progress for filtering:', error);
      // Fallback: don't show any habits if filtering fails
      setFilteredHabits([]);
    } finally {
      setIsFiltering(false);
    }
  }, [availableHabits, selectedGoal, userHabits, currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      // Clear old data to prevent flickering
      setFilteredHabits([]);
      setError(null);
      
      // Load data sequentially to avoid flickering
      const loadData = async () => {
        try {
          console.log('🔄 Modal opened - loading data...');
          await loadAvailableHabits();
          await loadUserGoals();
          // Filter will run automatically via the filterHabits useEffect
        } catch (error) {
          console.error('Failed to load data:', error);
        }
      };
      loadData();
    }
  }, [isOpen, currentUser, loadAvailableHabits, loadUserGoals]);

  useEffect(() => {
    filterHabits();
  }, [filterHabits]);

  // Debug: Monitor success message changes
  useEffect(() => {
    console.log('🔍 Success message changed:', successMessage ? `"${successMessage}"` : 'null');
  }, [successMessage]);


  const handleAddHabit = async (habit: Habit) => {
    if (!currentUser) return;
    
    // Clear only error messages, keep success messages
    setError(null);
    
    try {
      // Check if progress already exists for this habit
      const existingProgress = await dbHelpers.getProgress(currentUser.id, habit.id);
      
      if (existingProgress) {
        console.log('❌ Habit already being tracked:', habit.title);
        console.log('❌ THIS HABIT SHOULD HAVE BEEN FILTERED OUT!');
        console.log('❌ Habit ID:', habit.id);
        console.log('❌ Current userHabits in store:', userHabits.map(h => ({id: h.id, title: h.title})));
        setError('This habit is already being tracked.');
        // Force refresh the habit list to fix the display
        await refreshProgress();
        await loadUserData(currentUser.id);
        return;
      }
      
      // Create progress tracking for this habit for the current user
      await dbHelpers.createProgress(currentUser.id, habit.id);
      
      // Show success message FIRST, before any data refreshing
      console.log('✅ Setting success message: Habit added successfully!');
      setSuccessMessage('Habit added successfully!');
      
      console.log('✅ Habit added successfully:', habit.title);
      
      // Manually remove the habit from filteredHabits to provide immediate feedback
      setFilteredHabits(prev => prev.filter(h => h.id !== habit.id));
      
      // Delay user data refresh to prevent interference with success message
      setTimeout(() => {
        loadUserData(currentUser.id).catch(error => {
          console.error('Failed to refresh user data:', error);
        });
      }, 500); // Small delay to let success message render
      
    } catch (error) {
      console.error('Failed to add habit:', error);
      setError('Failed to add habit. Please try again.');
    }
  };

  const goalOptions = [
    { id: 'all', label: 'All Categories', icon: '🎯' },
    { id: 'better_sleep', label: 'Better Sleep', icon: '😴' },
    { id: 'feel_better', label: 'Feel Better', icon: '😊' },
    { id: 'get_moving', label: 'Get Moving', icon: '🏃‍♂️' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Browse Science-Backed Habits
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div 
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-2 text-green-400 hover:text-green-600 focus:outline-none"
                aria-label="Dismiss success message"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Goal Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Goal Category
          </label>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((goal) => (
              <button
                key={goal.id}
                onClick={() => {
                  console.log('🔍 Goal filter clicked:', goal.id, 'NOT clearing success messages');
                  // Only clear error messages, preserve success messages
                  setError(null);
                  setSelectedGoal(goal.id);
                }}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedGoal === goal.id
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{goal.icon}</span>
                <span>{goal.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Habit List */}
        {(isLoading || isFiltering) ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">
              {isLoading ? 'Loading habits...' : 'Filtering habits...'}
            </p>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No new habits available for the selected category.</p>
            <p className="text-sm text-gray-500">
              You may have already added all available habits, or try selecting a different category.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredHabits.map((habit) => (
              <Card key={habit.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{habit.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{habit.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {habit.category}
                      </span>
                      <span>🔬 Science-backed</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddHabit(habit)}
                    size="sm"
                    className="ml-4"
                  >
                    Add Habit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔍 Modal closing, clearing success message');
              setSuccessMessage(null);
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}