import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent } from '../ui';
import { CreateHabitForm } from './CreateHabitForm';
import { useHabitStore } from '../../stores/habitStore';
import { useUserStore } from '../../stores/userStore';
import { DetailedHabitCard } from './DetailedHabitCard';
import { HabitResearchModal } from '../research/HabitResearchModal';
import { HabitBrowser } from './HabitBrowser';
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
  

  const [showHabitBrowser, setShowHabitBrowser] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
    // Show success message first
    setSuccessMessage('New habit has been created and added to your collection!');
    
    // Refresh user data to show new custom habits  
    if (currentUser) {
      await refreshProgress();
      await loadCustomHabits(currentUser.id);
      // Also refresh user data to ensure immediate display
      const { loadUserData } = useUserStore.getState();
      await loadUserData(currentUser.id);
    }
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleEdit = (habit: Habit) => {
    startEditing(habit);
    setShowCreateForm(true);
  };


  const handleViewResearch = (habitId: string) => {
    const habit = userHabits.find(h => h.id === habitId);
    console.log('🔬 handleViewResearch called:', { habitId, habit, hasResearchBacked: habit?.researchBacked });
    
    if (habit) {
      // For habits with embedded research data, create a synthetic research article
      if (habit.researchBacked && (habit.researchSummary || habit.sources || habit.whyEffective)) {
        console.log('🔬 Habit has embedded research data:', {
          researchSummary: habit.researchSummary,
          sources: habit.sources,
          whyEffective: habit.whyEffective
        });
        
        // Create a synthetic research article from the habit's embedded data
        const syntheticResearchId = `${habit.id}_research`;
        console.log('🔬 Creating synthetic research article:', syntheticResearchId);
        
        setResearchModal({
          isOpen: true,
          habitId: habit.id,
          habitTitle: habit.title,
          researchIds: [syntheticResearchId]
        });
      } else {
        console.log('🔬 Habit has no embedded research data available');
        // Still try to open the modal - the modal will show "No research articles found"
        setResearchModal({
          isOpen: true,
          habitId: habit.id,
          habitTitle: habit.title,
          researchIds: []
        });
      }
    } else {
      console.log('🔬 Habit not found for ID:', habitId);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    const { updateUserProgress } = useUserStore.getState();
    await updateUserProgress(habitId);
  };

  const handleSkipHabit = (habitId: string) => {
    // For now, just show a message - can be enhanced later
    console.log(`Skipped habit: ${habitId}`);
    // Could add to localStorage or implement skip tracking system
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
      </div>

      {/* Success message display */}
      {successMessage && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuccessMessage(null)}
                className="ml-auto"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900">Science-Backed Habits</h2>
              <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Research Verified
              </div>
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
                  <DetailedHabitCard 
                    key={habit.id} 
                    habit={habit}
                    progress={progress}
                    onComplete={handleCompleteHabit}
                    onSkip={handleSkipHabit}
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
                  <DetailedHabitCard 
                    key={habit.id} 
                    habit={habit}
                    progress={progress}
                    onComplete={handleCompleteHabit}
                    onSkip={handleSkipHabit}
                    onViewResearch={handleViewResearch}
                    isCompleted={isCompleted}
                    showActions
                    onEdit={() => handleEdit(habit)}
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


      {/* Habit Browser Modal */}
      <HabitBrowser
        isOpen={showHabitBrowser}
        onClose={() => setShowHabitBrowser(false)}
      />
    </div>
  );
}

