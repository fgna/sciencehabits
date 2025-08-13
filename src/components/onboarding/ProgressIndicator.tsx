import React from 'react';
import { OnboardingStep } from '../../stores/onboardingStore';

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
}

const steps: { id: OnboardingStep; title: string; number: number }[] = [
  { id: 'welcome', title: 'Welcome', number: 1 },
  { id: 'goals', title: 'Goals', number: 2 },
  { id: 'recommendations', title: 'Habits', number: 3 }
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentStepNumber = steps.find(step => step.id === currentStep)?.number || 1;
  
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStepNumber >= step.number
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStepNumber > step.number ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                {step.title}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={`h-0.5 transition-colors ${
                    currentStepNumber > step.number
                      ? 'bg-primary-600'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentStepNumber} of {steps.length}
        </p>
      </div>
    </div>
  );
}