import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Habit } from '../../types';
import { dbHelpers } from '../../services/storage/database';

interface HabitCardProps {
  habit: Habit;
  isSelected: boolean;
  onToggle: () => void;
}

function HabitCard({ habit, isSelected, onToggle }: HabitCardProps) {
  const getCategoryIcon = (category: string) => {
    const icons = {
      stress: '🧘‍♀️',
      productivity: '⚡',
      health: '💪',
      energy: '🔋',
      sleep: '😴'
    };
    return icons[category as keyof typeof icons] || '✨';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'text-green-600 bg-green-100',
      intermediate: 'text-yellow-600 bg-yellow-100',
      advanced: 'text-red-600 bg-red-100'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div
      className={`
        relative p-5 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-300
        ${isSelected 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-200 bg-white hover:bg-gray-50'
        }
      `}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{getCategoryIcon(habit.category)}</span>
          <div>
            <h3 className={`font-semibold ${
              isSelected ? 'text-primary-900' : 'text-gray-900'
            }`}>
              {habit.title}
            </h3>
            <div className="flex items-center mt-1 space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(habit.difficulty)}`}>
                {habit.difficulty}
              </span>
              <span className="text-xs text-gray-500">
                {habit.timeMinutes} min
              </span>
            </div>
          </div>
        </div>
        
        {isSelected && (
          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <p className={`text-sm mb-3 ${
        isSelected ? 'text-primary-800' : 'text-gray-600'
      }`}>
        {habit.description}
      </p>
      
      <div className="text-xs text-gray-500">
        <div className="mb-1">
          <strong>Goals:</strong> {habit.goalTags.join(', ')}
        </div>
        <div>
          <strong>Research studies:</strong> {habit.researchIds.length} backing this habit
        </div>
      </div>
    </div>
  );
}

export function RecommendationsStep() {
  const { selectedGoals, userData, nextStep, previousStep, setError } = useOnboardingStore();
  const [recommendedHabits, setRecommendedHabits] = useState<Habit[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure database is initialized
      await dbHelpers.initializeDatabase();
      
      // Create a mock user object for recommendations
      const mockUser = {
        id: 'temp',
        createdAt: new Date().toISOString(),
        goals: selectedGoals,
        dailyMinutes: userData.dailyMinutes || 10,
        preferredTime: userData.preferredTime || 'flexible',
        lifestyle: userData.lifestyle || 'professional',
        language: userData.language || 'en',
        trial: {
          hasUsedTrial: false,
          isActive: false
        },
        isPremium: false
      };

      console.log('Mock user for recommendations:', mockUser);

      const habits = await dbHelpers.getRecommendedHabits(mockUser);
      console.log('Recommended habits found:', habits.length, habits);
      
      // If no recommended habits found, try getting all habits for debugging
      if (habits.length === 0) {
        console.log('No recommended habits found, checking all habits in database...');
        const allHabits = await dbHelpers.getAllHabits();
        console.log('All habits in database:', allHabits.length, allHabits);
        
        // If we have habits but filtering failed, use a more lenient approach
        if (allHabits.length > 0) {
          const flexibleHabits = allHabits.filter(habit => {
            const hasMatchingGoal = !selectedGoals.length || habit.goalTags.some(tag => selectedGoals.includes(tag));
            const isDurationOk = habit.timeMinutes <= (userData.dailyMinutes || 20);
            return !habit.isCustom && hasMatchingGoal && isDurationOk;
          });
          
          console.log('Flexible filtering found:', flexibleHabits.length, flexibleHabits);
          
          if (flexibleHabits.length > 0) {
            setRecommendedHabits(flexibleHabits);
            const topHabits = flexibleHabits.slice(0, 3).map(h => h.id);
            setSelectedHabits(topHabits);
            return;
          }
        }
      } else {
        setRecommendedHabits(habits);
        // Pre-select top 3 habits
        const topHabits = habits.slice(0, 3).map(h => h.id);
        setSelectedHabits(topHabits);
      }
      
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setError('Failed to load habit recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHabitToggle = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId)
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleContinue = () => {
    // Store selected habits in the store for the final step
    const store = useOnboardingStore.getState();
    const selectedHabitObjects = recommendedHabits.filter(h => selectedHabits.includes(h.id));
    
    // Store in userData with any type assertion for now
    store.setUserData({ 
      ...store.userData,
      selectedInitialHabits: selectedHabitObjects 
    } as any);
    
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Finding perfect habits for you...
        </h2>
        <p className="text-gray-600">
          Based on your goals and preferences
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Your Personalized Habits
        </h1>
        <p className="text-gray-600 mb-4">
          We found <strong>{recommendedHabits.length} science-backed habits</strong> that match your goals.
          Choose the ones you'd like to start with.
        </p>
        
        {selectedGoals.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Focusing on:</strong> {selectedGoals.join(', ')}
          </div>
        )}
      </div>

      {recommendedHabits.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🤔</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No habits found
          </h2>
          <p className="text-gray-600 mb-4">
            We couldn't find habits matching your preferences. Let's go back and adjust them.
          </p>
          <Button onClick={previousStep}>
            Adjust Preferences
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {recommendedHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isSelected={selectedHabits.includes(habit.id)}
                onToggle={() => handleHabitToggle(habit.id)}
              />
            ))}
          </div>

          {selectedHabits.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="text-green-600 mr-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    {selectedHabits.length} habit{selectedHabits.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-green-700">
                    Perfect! Starting small increases your success rate by 85%.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={previousStep}
              className="flex-1"
            >
              Back
            </Button>
            
            <Button 
              onClick={handleContinue}
              disabled={selectedHabits.length === 0}
              className="flex-1"
            >
              Start Building Habits
            </Button>
          </div>
          
          {selectedHabits.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Select at least one habit to get started
            </p>
          )}
        </>
      )}
    </div>
  );
}