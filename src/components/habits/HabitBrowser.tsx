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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { currentUser, userHabits, refreshProgress } = useUserStore();

  // Clear messages on user actions (matches existing failure message behavior)
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const loadAvailableHabits = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    clearMessages();
    
    try {
      // Initialize database first to ensure bundled content is loaded
      await dbHelpers.initializeDatabase();
      
      // Get all science-backed habits from the system
      const allHabits = await dbHelpers.getAllHabits();
      
      // Sort by category and name for consistent display
      const sortedHabits = allHabits.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });
      
      setAvailableHabits(sortedHabits);
      console.log(`📚 Loaded ${sortedHabits.length} available habits`);
    } catch (error) {
      console.error('Failed to load available habits:', error);
      setError('Failed to load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, clearMessages]);

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

  const filterHabits = useCallback(() => {
    if (!availableHabits.length) return;
    
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
    
    // Filter out habits user already has
    const userHabitIds = new Set(userHabits.map(h => h.id));
    filtered = filtered.filter(habit => !userHabitIds.has(habit.id));
    
    setFilteredHabits(filtered);
    console.log(`🔍 Filtered to ${filtered.length} habits (goal: ${selectedGoal || 'all'})`);
  }, [availableHabits, selectedGoal, userHabits]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableHabits();
      loadUserGoals();
    }
  }, [isOpen, loadAvailableHabits, loadUserGoals]);

  useEffect(() => {
    filterHabits();
  }, [filterHabits]);

  // Fallback auto-dismiss success message after 10 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAddHabit = async (habit: Habit) => {
    if (!currentUser) return;
    
    // Clear any existing messages
    clearMessages();
    
    try {
      // Check if progress already exists for this habit
      const existingProgress = await dbHelpers.getProgress(currentUser.id, habit.id);
      
      if (existingProgress) {
        console.log('Habit already being tracked:', habit.title);
        setError('This habit is already being tracked.');
        return;
      }
      
      // Create progress tracking for this habit for the current user
      await dbHelpers.createProgress(currentUser.id, habit.id);
      
      // Show success message
      setSuccessMessage('Habit added successfully!');
      
      // Refresh available habits to remove the newly added one from the list
      await loadAvailableHabits();
      await refreshProgress();
      
      console.log('✅ Habit added successfully:', habit.title);
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
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-700 text-sm">{successMessage}</p>
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
                  clearMessages();
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
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading habits...</p>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No habits found for the selected category.</p>
            <p className="text-sm text-gray-500">
              Try selecting a different category or check back later for new habits.
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}