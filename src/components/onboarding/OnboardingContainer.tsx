import React, { useEffect } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { ProgressIndicator } from './ProgressIndicator';
import { WelcomeStep } from './WelcomeStep';
import { GoalsStep } from './GoalsStep';
import { PreferencesStep } from './PreferencesStep';
import { RecommendationsStep } from './RecommendationsStep';
import { initializeDatabase, dbHelpers } from '../../services/storage/database';

interface OnboardingContainerProps {
  onComplete: (userId: string) => void;
}

export function OnboardingContainer({ onComplete }: OnboardingContainerProps) {
  const { currentStep, userData, selectedGoals, setLoading, setError, error } = useOnboardingStore();

  useEffect(() => {
    // Initialize database when onboarding starts
    initializeDatabase().catch((error) => {
      console.error('Failed to initialize database:', error);
      setError('Failed to load application data');
    });
  }, [setError]);

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create user with all collected data
      const user = await dbHelpers.createUser({
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
      });

      // Create initial progress entries for selected habits
      const selectedHabits = (userData as any).selectedInitialHabits || [];
      console.log('Creating progress entries for selected habits:', selectedHabits.length, selectedHabits);
      
      for (const habit of selectedHabits) {
        console.log('Creating progress for habit:', habit.id, habit.title);
        await dbHelpers.createProgress(user.id, habit.id);
      }
      
      console.log('User created successfully:', user);
      console.log('Progress entries created for habits:', selectedHabits.map((h: any) => h.id));

      // Store user ID in localStorage for persistence
      localStorage.setItem('sciencehabits_user_id', user.id);

      onComplete(user.id);
      
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setError('Failed to set up your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-complete when reaching the complete step
  useEffect(() => {
    if (currentStep === 'complete') {
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'goals':
        return <GoalsStep />;
      case 'preferences':
        return <PreferencesStep />;
      case 'recommendations':
        return <RecommendationsStep />;
      case 'complete':
        return (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Setting up your account...
            </h2>
            <p className="text-gray-600">
              Almost ready to start building better habits!
            </p>
          </div>
        );
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <ProgressIndicator currentStep={currentStep} />
        )}
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          {renderStep()}
        </div>
        
        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Something went wrong
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}