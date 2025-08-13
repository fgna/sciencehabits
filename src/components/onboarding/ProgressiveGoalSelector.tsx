import React from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

interface GoalCategory {
  id: 'health' | 'productivity' | 'wellbeing';
  title: string;
  description: string;
  icon: string;
  color: string;
  goalIds: string[]; // Map to actual goal IDs
}

const goalCategories: GoalCategory[] = [
  {
    id: 'health',
    title: 'Physical Health',
    description: 'Build habits for better fitness, sleep, and energy',
    icon: '💪',
    color: 'compassion',
    goalIds: ['increase_energy', 'improve_health'], // Map to actual health goal IDs
  },
  {
    id: 'wellbeing',
    title: 'Mental Wellbeing', 
    description: 'Develop practices for stress management and emotional balance',
    icon: '🧘‍♀️',
    color: 'progress',
    goalIds: ['reduce_stress', 'improve_mood'], // Map to actual wellbeing goal IDs
  },
  {
    id: 'productivity',
    title: 'Personal Growth',
    description: 'Improve focus, learning, and personal effectiveness',
    icon: '🚀',
    color: 'research',
    goalIds: ['increase_focus'], // Map to actual productivity goal IDs
  },
];

export function ProgressiveGoalSelector() {
  const { 
    setGoals, 
    nextStep, 
    previousStep 
  } = useOnboardingStore();
  
  const { animationsEnabled, emotionalDesign } = useUIPreferencesStore();

  const handleCategorySelect = (category: GoalCategory) => {
    // Set the actual goal IDs for the selected category
    setGoals(category.goalIds);
    
    // Move to next step immediately
    nextStep();
  };

  // Only show category selection - no subgoal selection needed
  return (
    <div className="max-w-3xl mx-auto">
      <div className={`text-center mb-8 ${animationsEnabled ? 'animate-fade-in' : ''}`}>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          What matters most to you right now?
        </h1>
        <p className="text-gray-600">
          Choose the area where you'd like to build better habits.
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
              <div className="flex items-center justify-center text-sm text-primary-600 font-medium">
                <span>Choose This Focus</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-6">
          Select your main focus area to continue
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
          Choosing a category will automatically continue to the next step
        </p>
      </div>
    </div>
  );
}