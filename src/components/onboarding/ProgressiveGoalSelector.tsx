import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { Goal } from '../../services/goalsService';
import { GoalExplainer } from './GoalExplainer';
import { PersonalizationPreview } from './PersonalizationPreview';

interface GoalCategory {
  id: 'health' | 'productivity' | 'wellbeing';
  title: string;
  description: string;
  icon: string;
  color: string;
}

const goalCategories: GoalCategory[] = [
  {
    id: 'health',
    title: 'Physical Health',
    description: 'Build habits for better fitness, sleep, and energy',
    icon: '💪',
    color: 'compassion',
  },
  {
    id: 'wellbeing',
    title: 'Mental Wellbeing', 
    description: 'Develop practices for stress management and emotional balance',
    icon: '🧘‍♀️',
    color: 'progress',
  },
  {
    id: 'productivity',
    title: 'Personal Growth',
    description: 'Improve focus, learning, and personal effectiveness',
    icon: '🚀',
    color: 'research',
  },
];

export function ProgressiveGoalSelector() {
  const { 
    selectedGoals, 
    availableGoals, 
    isLoading, 
    error, 
    setGoals, 
    loadGoalsData, 
    nextStep, 
    previousStep 
  } = useOnboardingStore();
  
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();
  
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [categoryGoals, setCategoryGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (availableGoals.length === 0) {
      loadGoalsData();
    }
  }, [availableGoals.length, loadGoalsData]);

  useEffect(() => {
    if (selectedCategory && availableGoals.length > 0) {
      // Filter goals by category - this would need to be implemented in the goals service
      const filtered = availableGoals.filter(goal => 
        goal.category?.toLowerCase() === selectedCategory.id
      );
      setCategoryGoals(filtered);
    }
  }, [selectedCategory, availableGoals]);

  const handleCategorySelect = (category: GoalCategory) => {
    setSelectedCategory(category);
    setShowPreview(false);
    
    // Animate to next step if animations are enabled
    if (animationsEnabled) {
      setTimeout(() => setShowPreview(true), 200);
    } else {
      setShowPreview(true);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    const updatedGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(id => id !== goalId)
      : [...selectedGoals, goalId];
    
    setGoals(updatedGoals);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowPreview(false);
    setCategoryGoals([]);
  };

  const canContinue = selectedGoals.length > 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load goals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadGoalsData()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className={`text-center mb-8 ${animationsEnabled ? 'animate-fade-in' : ''}`}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            What matters most to you right now?
          </h1>
          <p className="text-gray-600">
            Let's start by exploring one area where you'd like to see positive changes. 
            Don't worry, you can add more goals later.
          </p>
        </div>

        <div className="grid gap-4 mb-8 md:grid-cols-3">
          {goalCategories.map((category, index) => (
            <div
              key={category.id}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105
                ${emotionalDesign === 'compassionate' ? 'card-compassionate hover:shadow-lg' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}
                ${animationsEnabled ? 'interactive-gentle' : ''}
              `}
              onClick={() => handleCategorySelect(category)}
              style={{
                animationDelay: animationsEnabled ? `${index * 100}ms` : '0ms',
              }}
            >
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {category.description}
                </p>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <span>Explore</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-6">
            Choose the area that resonates most with your current priorities
          </p>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={previousStep}
              className="flex-1"
            >
              Back
            </Button>
            
            <Button 
              onClick={nextStep}
              disabled
              className="flex-1 opacity-50"
            >
              Continue
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 mt-2">
            Select a category to continue
          </p>
        </div>
      </div>
    );
  }

  // Goal Selection Within Category View
  return (
    <div className="max-w-4xl mx-auto">
      <div className={`mb-6 ${animationsEnabled ? 'animate-slide-up' : ''}`}>
        <button
          onClick={handleBackToCategories}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to categories
        </button>
        
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-4">{selectedCategory.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory.title} Goals
            </h1>
            <p className="text-gray-600">
              {selectedCategory.description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Goal Selection */}
        <div className="lg:col-span-2">
          <div className="grid gap-3 mb-6">
            {availableGoals.map((goal, index) => {
              const isSelected = selectedGoals.includes(goal.id);
              
              return (
                <div
                  key={goal.id}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? `border-${selectedCategory.color}-500 bg-${selectedCategory.color}-50` 
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                    }
                    ${animationsEnabled ? 'hover:scale-[1.02]' : ''}
                  `}
                  onClick={() => handleGoalToggle(goal.id)}
                  style={{
                    animationDelay: animationsEnabled ? `${index * 50}ms` : '0ms',
                  }}
                >
                  <div className="flex items-start">
                    <div className="text-2xl mr-3 mt-1">
                      {goal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-medium ${
                        isSelected ? `text-${selectedCategory.color}-900` : 'text-gray-900'
                      }`}>
                        {goal.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        isSelected ? `text-${selectedCategory.color}-700` : 'text-gray-500'
                      }`}>
                        {goal.description}
                      </p>
                      
                      {/* Research teaser */}
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
                        </svg>
                        <span>Research-backed strategies</span>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className={`w-6 h-6 bg-${selectedCategory.color}-500 rounded-full flex items-center justify-center ${
                          animationsEnabled ? 'animate-scale-in' : ''
                        }`}>
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          {showPreview && (
            <div className={`sticky top-6 ${animationsEnabled ? 'animate-fade-in' : ''}`}>
              <PersonalizationPreview 
                selectedGoals={selectedGoals}
                category={selectedCategory}
              />
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {selectedGoals.length > 0 && (
        <div className={`bg-compassion-50 border border-compassion-200 rounded-lg p-4 mb-6 ${
          animationsEnabled ? 'animate-gentle-bounce' : ''
        }`}>
          <div className="flex items-center">
            <div className="text-compassion-600 mr-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-compassion-800">
              Excellent! You've selected <strong>{selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''}</strong> to focus on.
              {selectedGoals.length > 1 && ' Starting with multiple goals shows great commitment!'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleBackToCategories}
          className="flex-1"
        >
          Choose Different Category
        </Button>
        
        <Button 
          onClick={nextStep} 
          disabled={!canContinue}
          className={`flex-1 ${canContinue && animationsEnabled ? 'hover:animate-compassionate-pulse' : ''}`}
        >
          {canContinue ? 'Continue with These Goals' : 'Select at Least One Goal'}
        </Button>
      </div>
      
      {!canContinue && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Choose goals that align with what matters most to you right now
        </p>
      )}
    </div>
  );
}