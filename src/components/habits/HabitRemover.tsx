/**
 * Habit Remover Component
 * 
 * Allows users to view and remove habits they're currently tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Card } from '../ui';
import { Habit } from '../../types';
import { dbHelpers } from '../../services/storage/database';
import { useUserStore } from '../../stores/userStore';
import { useHabitStore } from '../../stores/habitStore';

interface HabitRemoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HabitRemover({ isOpen, onClose }: HabitRemoverProps) {
  const [currentHabits, setCurrentHabits] = useState<Habit[]>([]);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { currentUser, userHabits, userProgress, refreshProgress, loadUserData } = useUserStore();
  const { customHabits, loadCustomHabits } = useHabitStore();


  const loadCurrentHabits = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Get user's progress to find tracked habits
      const userProgress = await dbHelpers.getUserProgress(currentUser.id);
      const trackedHabitIds = userProgress.map(p => p.habitId);
      
      // Get all habits (science-backed + custom)
      const allHabits = await dbHelpers.getAllHabits();
      const allCustomHabits = await dbHelpers.getCustomHabits(currentUser.id);
      
      // Combine and filter to only tracked habits
      const combinedHabits = [...allHabits, ...allCustomHabits];
      const trackedHabits = combinedHabits.filter(habit => trackedHabitIds.includes(habit.id));
      
      // Sort by category and title
      const sortedHabits = trackedHabits.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.title.localeCompare(b.title);
      });
      
      setCurrentHabits(sortedHabits);
      
      console.log(`📚 Loaded ${sortedHabits.length} current habits for removal`);
    } catch (error) {
      console.error('Failed to load current habits:', error);
      setError('Failed to load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const filterHabits = useCallback(() => {
    if (!currentHabits.length) return;
    
    // Show all habits without category filtering
    setFilteredHabits([...currentHabits]);
    console.log(`🔍 Showing ${currentHabits.length} habits`);
  }, [currentHabits]);

  useEffect(() => {
    if (isOpen && currentUser) {
      // Clear old data
      setCurrentHabits([]);
      setFilteredHabits([]);
      setError(null);
      setSuccessMessage(null);
      
      loadCurrentHabits();
    }
  }, [isOpen, currentUser, loadCurrentHabits]);

  useEffect(() => {
    filterHabits();
  }, [filterHabits]);

  const handleRemoveHabit = async (habit: Habit) => {
    if (!currentUser) return;
    
    setError(null);
    
    try {
      if (habit.isCustom) {
        // For custom habits, delete the habit entirely
        const { deleteHabit } = useHabitStore.getState();
        const success = await deleteHabit(habit.id, currentUser.id);
        
        if (!success) {
          setError('Failed to delete custom habit.');
          return;
        }
        
        setSuccessMessage(`Custom habit "${habit.title}" has been deleted.`);
      } else {
        // For science-backed habits, just remove from tracking (delete progress)
        await dbHelpers.deleteProgress(currentUser.id, habit.id);
        setSuccessMessage(`"${habit.title}" has been removed from your tracking.`);
      }
      
      // Remove from current display immediately
      setCurrentHabits(prev => prev.filter(h => h.id !== habit.id));
      setFilteredHabits(prev => prev.filter(h => h.id !== habit.id));
      
      // Refresh user data
      await refreshProgress();
      if (currentUser) {
        await loadUserData(currentUser.id);
        await loadCustomHabits(currentUser.id);
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to remove habit:', error);
      setError('Failed to remove habit. Please try again.');
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Remove Habits
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
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
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}


        {/* Habit List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading your habits...</p>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No habits to remove.</p>
            <p className="text-sm text-gray-500">
              You don't have any habits to remove yet.
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
                      {habit.isCustom ? (
                        <span>✨ Custom</span>
                      ) : (
                        <span>🔬 Science-backed</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveHabit(habit)}
                    size="sm"
                    variant="outline"
                    className="ml-4 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {habit.isCustom ? 'Delete' : 'Remove'}
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