import React from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';

interface GoalCategory {
  id: 'better_sleep' | 'get_moving' | 'feel_better';
  title: string;
  description: string;
  icon: string;
  color: string;
  goalIds: string[]; // Map to actual goal IDs
}

const goalCategories: GoalCategory[] = [
  {
    id: 'better_sleep',
    title: 'Better Sleep',
    description: 'The keystone habit that affects everything else',
    icon: '🛏️',
    color: 'compassion',
    goalIds: ['better_sleep'], // Map to actual sleep goal ID
  },
  {
    id: 'get_moving',
    title: 'Get Moving', 
    description: 'Physical health with broad accessibility',
    icon: '🚶‍♀️',
    color: 'progress',
    goalIds: ['get_moving'], // Map to actual movement goal ID
  },
  {
    id: 'feel_better',
    title: 'Feel Better',
    description: 'Mood and mental wellness for immediate wins',
    icon: '😊',
    color: 'research',
    goalIds: ['feel_better'], // Map to actual mood goal ID
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
        <p className="text-sm text-gray-500">
          Select your main focus area to continue
        </p>
      </div>
    </div>
  );
}