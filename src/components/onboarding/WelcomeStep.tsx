import React from 'react';
import { Button } from '../ui';
import { useOnboardingStore } from '../../stores/onboardingStore';

export function WelcomeStep() {
  const nextStep = useOnboardingStore((state) => state.nextStep);

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
          <span className="text-3xl text-white">🧬</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to ScienceHabits
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Build habits that actually work, backed by real scientific research.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          What makes us different?
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-sm">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Evidence-based:</strong> Every habit is backed by peer-reviewed research
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-secondary-600 text-sm">⚡</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Micro-habits:</strong> Start with just 2-5 minutes per day
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm">🎯</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Personalized:</strong> Tailored to your goals and lifestyle
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-600 text-sm">🔒</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Privacy-first:</strong> All your data stays on your device
              </p>
            </div>
          </div>
        </div>
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