import React from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';

export function WelcomeStep() {
  const nextStep = useOnboardingStore((state) => state.nextStep);

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-12">
        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
          <span className="text-3xl text-white">🧬</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to ScienceHabits
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Let's get you started with habits that actually work.
        </p>
      </div>

      <div className="text-center">
        <Button onClick={nextStep} size="lg" fullWidth>
          Get Started
        </Button>
        
        <p className="text-xs text-gray-500 mt-4">
          Takes less than 2 minutes to set up
        </p>
      </div>
    </div>
  );
}