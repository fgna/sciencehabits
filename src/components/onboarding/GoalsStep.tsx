import React, { useEffect } from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';

export function GoalsStep() {
  const { selectedGoals, availableGoals, isLoading, error, setGoals, loadGoalsData, nextStep, previousStep } = useOnboardingStore();

  useEffect(() => {
    if (availableGoals.length === 0) {
      loadGoalsData();
    }
  }, [availableGoals.length, loadGoalsData]);

  const handleGoalToggle = (goalId: string) => {
    const updatedGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(id => id !== goalId)
      : [...selectedGoals, goalId];
    
    setGoals(updatedGoals);
  };

  const canContinue = selectedGoals.length > 0;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading goals...</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load goals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadGoalsData()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          What are your goals?
        </h1>
        <p className="text-gray-600">
          Select all that apply. We'll recommend habits that help you achieve these goals.
        </p>
      </div>

      <div className="grid gap-3 mb-8 sm:grid-cols-2">
        {availableGoals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          
          return (
            <div
              key={goal.id}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-300
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                }
              `}
              onClick={() => handleGoalToggle(goal.id)}
            >
              <div className="flex items-start">
                <div className="text-2xl mr-3 mt-1">
                  {goal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-medium ${
                    isSelected ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    {goal.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isSelected ? 'text-primary-700' : 'text-gray-500'
                  }`}>
                    {goal.description}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
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

      {selectedGoals.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-blue-600 mr-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-blue-800">
              Great choice! We have <strong>{selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''}</strong> to focus on.
            </p>
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
          onClick={nextStep} 
          disabled={!canContinue}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
      
      {!canContinue && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Please select at least one goal to continue
        </p>
      )}
    </div>
  );
}