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

  const { currentUser, userHabits, refreshProgress } = useUserStore();

  const loadAvailableHabits = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
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

  const filterHabits = useCallback(() => {
    if (!availableHabits.length) return;
    
    let filtered = [...availableHabits];
    
    // Filter by selected goal
    if (selectedGoal && selectedGoal !== 'all') {
      filtered = filtered.filter(habit => 
        habit.goalTags && habit.goalTags.includes(selectedGoal)
      );
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

  const handleAddHabit = async (habit: Habit) => {
    try {
      // Add habit to database - this should be implemented via userStore or directly
      await dbHelpers.addHabit(habit);
      
      // Refresh available habits to remove the newly added one
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

        {/* Goal Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Goal Category
          </label>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
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