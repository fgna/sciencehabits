import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent } from '../ui';
import { CreateHabitForm } from './CreateHabitForm';
import { useHabitStore } from '../../stores/habitStore';
import { useUserStore } from '../../stores/userStore';
import { CleanHabitCard } from '../ui/CleanHabitCard';
import { HabitResearchModal } from '../research/HabitResearchModal';
import { Habit } from '../../types';

export function HabitsView() {
  const [showCreateForm, setShowCreateForm] = useState(false);
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
  
  const { 
    customHabits, 
    isLoading, 
    error,
    loadCustomHabits, 
    startEditing,
    deleteHabit,
    setError 
  } = useHabitStore();
  
  const { currentUser, userHabits, userProgress, refreshProgress } = useUserStore();

  useEffect(() => {
    if (currentUser) {
      loadCustomHabits(currentUser.id);
    }
  }, [currentUser, loadCustomHabits]);

  const handleCreateSuccess = async () => {
    // Refresh user data to show new custom habits
    if (currentUser) {
      await refreshProgress();
      await loadCustomHabits(currentUser.id);
    }
  };

  const handleEdit = (habit: Habit) => {
    startEditing(habit);
    setShowCreateForm(true);
  };

  const handleDelete = async (habit: Habit) => {
    if (!currentUser) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${habit.title}"? This will also remove all progress data for this habit.`
    );
    
    if (confirmed) {
      const success = await deleteHabit(habit.id, currentUser.id);
      if (success) {
        await refreshProgress();
      }
    }
  };

  const handleViewResearch = (habitId: string) => {
    const habit = userHabits.find(h => h.id === habitId);
    if (habit) {
      setResearchModal({
        isOpen: true,
        habitId: habit.id,
        habitTitle: habit.title,
        researchIds: habit.researchIds || []
      });
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    const { updateUserProgress } = useUserStore.getState();
    await updateUserProgress(habitId);
  };


  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Habits</h1>
        <p className="text-gray-600">
          Manage your habit collection - both science-backed and custom habits
        </p>
      </div>

      {/* Error display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habit Categories */}
      <div className="space-y-8">
        {/* Science-backed habits */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Science-Backed Habits</h2>
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Research Verified
            </div>
          </div>
          
          {userHabits.filter(h => !h.isCustom).length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🧬</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Science-Backed Habits Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Complete the onboarding process to get personalized habit recommendations based on research.
                  </p>
                  <Button 
                    onClick={() => {
                      if (window.confirm('This will restart your onboarding process. Are you sure?')) {
                        localStorage.removeItem('sciencehabits_user_id');
                        window.location.reload();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Start Onboarding Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userHabits.filter(h => !h.isCustom).map((habit) => {
                const progress = userProgress.find(p => p.habitId === habit.id);
                const isCompleted = progress?.completions.includes(new Date().toISOString().split('T')[0]) || false;
                return (
                  <CleanHabitCard 
                    key={habit.id} 
                    habit={habit}
                    progress={progress}
                    onComplete={handleCompleteHabit}
                    onViewResearch={handleViewResearch}
                    isCompleted={isCompleted}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Custom habits */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">Custom Habits</h2>
              <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                Personal
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Custom Habit
            </Button>
          </div>
          
          {customHabits.length === 0 ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Custom Habits Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create personalized habits tailored to your specific needs and goals.
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    Create Your First Custom Habit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {customHabits.map((habit) => {
                const progress = userProgress.find(p => p.habitId === habit.id);
                const isCompleted = progress?.completions.includes(new Date().toISOString().split('T')[0]) || false;
                return (
                  <CleanHabitCard 
                    key={habit.id} 
                    habit={habit}
                    progress={progress}
                    onComplete={handleCompleteHabit}
                    onViewResearch={handleViewResearch}
                    isCompleted={isCompleted}
                    showActions
                    onEdit={() => handleEdit(habit)}
                    onDelete={() => handleDelete(habit)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <CreateHabitForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
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

