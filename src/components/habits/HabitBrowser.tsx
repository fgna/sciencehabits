/**
 * Habit Browser Component
 * 
 * Allows users to browse and add science-backed habits that they're not currently tracking
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card } from '../ui';
import { Habit } from '../../types';
import { dbHelpers } from '../../services/storage/database';
import { useUserStore } from '../../stores/userStore';

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  category: string;
  priority: number;
}

interface HabitBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserHabits: Habit[];
}

export function HabitBrowser({ isOpen, onClose, currentUserHabits }: HabitBrowserProps) {
  const [availableHabits, setAvailableHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  
  const { currentUser, refreshProgress } = useUserStore();

  useEffect(() => {
    if (isOpen) {
      loadAvailableHabits();
      loadUserGoals();
    }
  }, [isOpen]);

  useEffect(() => {
    filterHabits();
  }, [availableHabits, selectedGoal, currentUserHabits, userGoals]);

  const loadAvailableHabits = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all science-backed habits from the system
      const allHabits = await dbHelpers.getAllHabits();
      
      // Filter out custom habits and habits the user is already tracking
      const currentHabitIds = new Set(currentUserHabits.map(h => h.id));
      const available = allHabits.filter(habit => 
        !habit.isCustom && !currentHabitIds.has(habit.id)
      );
      
      setAvailableHabits(available);
    } catch (error) {
      console.error('Failed to load available habits:', error);
      setError('Failed to load available habits');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserGoals = async () => {
    try {
      // Load goals.json to get goal details
      const response = await fetch('/data/goals.json');
      const goalsData = await response.json();
      
      if (currentUser && currentUser.goals) {
        // Filter to only show goals the user has selected
        const relevantGoals = goalsData.goals.filter((goal: Goal) => 
          currentUser.goals.includes(goal.id)
        );
        setUserGoals(relevantGoals);
      }
    } catch (error) {
      console.error('Failed to load user goals:', error);
    }
  };

  const filterHabits = () => {
    let filtered = availableHabits;
    
    if (selectedGoal !== 'all') {
      // Map goal IDs to their corresponding tags/keywords that might appear in goalTags
      const goalTagMappings: Record<string, string[]> = {
        'reduce_stress': ['stress', 'relaxation', 'mindfulness', 'meditation', 'anxiety'],
        'increase_focus': ['focus', 'concentration', 'attention', 'productivity', 'cognitive'],
        'improve_mood': ['mood', 'happiness', 'depression', 'emotional', 'wellbeing'],
        'increase_energy': ['energy', 'fatigue', 'vitality', 'motivation'],
        'improve_health': ['health', 'fitness', 'nutrition', 'exercise', 'wellness'],
        'better_sleep': ['sleep', 'insomnia', 'rest', 'recovery']
      };
      
      const relevantTags = goalTagMappings[selectedGoal] || [selectedGoal];
      
      filtered = availableHabits.filter(habit => {
        if (!habit.goalTags) return false;
        
        // Check if any of the habit's goalTags match the selected goal's keywords
        return habit.goalTags.some(tag => 
          relevantTags.some(relevantTag => 
            tag.toLowerCase().includes(relevantTag.toLowerCase()) ||
            relevantTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
      });
    }
    
    setFilteredHabits(filtered);
  };

  const handleAddHabit = async (habit: Habit) => {
    if (!currentUser) return;
    
    try {
      setError(null);
      
      // Create a progress entry for this habit (this will make it appear in user's habit list)
      await dbHelpers.createProgress(currentUser.id, habit.id);
      
      // Refresh user data to show the new habit
      await refreshProgress();
      
      // Remove from available list
      setAvailableHabits(prev => prev.filter(h => h.id !== habit.id));
      
    } catch (error) {
      console.error('Failed to add habit:', error);
      setError('Failed to add habit to your list');
    }
  };

  const goalOptions = [
    { id: 'all', title: 'All Goals', icon: '🎯' },
    ...userGoals.map(goal => ({
      id: goal.id,
      title: goal.title,
      icon: goal.icon
    }))
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Science-Backed Habits</h2>
            <p className="text-gray-600 mt-1">
              Choose from research-verified habits to add to your tracking
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Goal Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Your Goals
          </label>
          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-auto"
          >
            {goalOptions.map(goal => (
              <option key={goal.id} value={goal.id}>
                {goal.icon} {goal.title}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading habits...</span>
          </div>
        ) : (
          /* Habits List */
          <div className="max-h-96 overflow-y-auto">
            {filteredHabits.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No New Habits Available</h3>
                <p className="text-gray-600">
                  {availableHabits.length === 0 
                    ? "You're already tracking all available science-backed habits!"
                    : "No habits match the selected goal."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHabits.map((habit) => (
                  <Card key={habit.id} className="hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{habit.title}</h3>
                            <span className="text-sm text-gray-500">{habit.timeMinutes} min</span>
                            {habit.category && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {habit.category}
                              </span>
                            )}
                            {habit.difficulty && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {habit.difficulty}
                              </span>
                            )}
                          </div>
                          
                          {habit.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {habit.description}
                            </p>
                          )}
                          
                          {habit.researchIds && habit.researchIds.length > 0 && (
                            <div className="flex items-center text-xs text-blue-600">
                              <span>🔬</span>
                              <span className="ml-1">{habit.researchIds.length} research studies</span>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleAddHabit(habit)}
                          size="sm"
                          className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {filteredHabits.length} habit{filteredHabits.length !== 1 ? 's' : ''} available
          </p>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}