/**
 * User Onboarding Flow Component
 * 
 * Manages the complete user onboarding process including:
 * - Registration/Login
 * - Cloud provider selection
 * - Initial sync setup
 */

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { CloudProviderSelector } from './CloudProviderSelector';
import { AuthResult, CloudConfig } from '../../types/sync';

type OnboardingStep = 'auth-choice' | 'login' | 'register' | 'provider-selection' | 'complete';

interface OnboardingFlowProps {
  onComplete: (user: AuthResult, cloudConfig: CloudConfig | null) => void;
  className?: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('auth-choice');
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);

  const handleAuthChoice = (choice: 'login' | 'register') => {
    setCurrentStep(choice);
  };

  const handleAuthSuccess = (result: AuthResult) => {
    setAuthResult(result);
    setCurrentStep('provider-selection');
  };

  const handleProviderSelected = (cloudConfig: CloudConfig | null) => {
    if (authResult) {
      onComplete(authResult, cloudConfig);
    }
  };

  const handleBackToAuthChoice = () => {
    setCurrentStep('auth-choice');
    setAuthResult(null);
  };

  const handleSwitchAuthMode = (mode: 'login' | 'register') => {
    setCurrentStep(mode);
  };

  if (currentStep === 'auth-choice') {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="w-full max-w-md mx-auto p-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🧪</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ScienceHabits</h1>
            <p className="text-gray-600 text-lg">
              Build lasting habits with science-backed insights
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleAuthChoice('register')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </button>
            
            <button
              onClick={() => handleAuthChoice('login')}
              className="w-full bg-white text-gray-700 border border-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              I Already Have an Account
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Privacy First</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Open Source</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Free Forever</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'login') {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="w-full p-6">
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            onSwitchToRegister={() => handleSwitchAuthMode('register')}
          />
          
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToAuthChoice}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'register') {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="w-full p-6">
          <RegisterForm
            onRegisterSuccess={handleAuthSuccess}
            onSwitchToLogin={() => handleSwitchAuthMode('login')}
          />
          
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToAuthChoice}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'provider-selection') {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
        <div className="w-full p-6">
          <CloudProviderSelector
            onProviderSelected={handleProviderSelected}
            onBack={() => setCurrentStep('auth-choice')}
          />
        </div>
      </div>
    );
  }

  // This shouldn't be reached, but just in case
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${className}`}>
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <p>Setting up your account...</p>
      </div>
    </div>
  );
};