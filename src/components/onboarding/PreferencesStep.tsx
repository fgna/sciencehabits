import React, { useState } from 'react';
import { Button } from '../ui';
import { useOnboardingStore, lifestyleOptions, timePreferenceOptions, dailyTimeOptions } from '../../stores/onboardingStore';
import { User } from '../../types';

export function PreferencesStep() {
  const { userData, setUserData, nextStep, previousStep } = useOnboardingStore();
  
  const [selectedLifestyle, setSelectedLifestyle] = useState<User['lifestyle'] | null>(
    userData.lifestyle || null
  );
  const [selectedTimePreference, setSelectedTimePreference] = useState<User['preferredTime'] | null>(
    userData.preferredTime || null
  );
  const [selectedDailyMinutes, setSelectedDailyMinutes] = useState<number>(
    userData.dailyMinutes || 10
  );

  const handleContinue = () => {
    if (!selectedLifestyle || !selectedTimePreference) return;
    
    setUserData({
      lifestyle: selectedLifestyle,
      preferredTime: selectedTimePreference,
      dailyMinutes: selectedDailyMinutes,
      language: 'en'
    });
    
    nextStep();
  };

  const canContinue = selectedLifestyle && selectedTimePreference;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your lifestyle
        </h1>
        <p className="text-gray-600">
          We'll customize habit recommendations to fit your daily routine.
        </p>
      </div>

      <div className="space-y-8">
        {/* Lifestyle Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What best describes your lifestyle?
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-3">
            {lifestyleOptions.map((option) => {
              const isSelected = selectedLifestyle === option.id;
              
              return (
                <div
                  key={option.id}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-300
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedLifestyle(option.id)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <h3 className={`font-medium mb-1 ${
                      isSelected ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {option.title}
                    </h3>
                    <p className={`text-sm ${
                      isSelected ? 'text-primary-700' : 'text-gray-500'
                    }`}>
                      {option.description}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Preference Selection */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            When do you prefer to build new habits?
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2">
            {timePreferenceOptions.map((option) => {
              const isSelected = selectedTimePreference === option.id;
              
              return (
                <div
                  key={option.id}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-300
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedTimePreference(option.id)}
                >
                  <div className="flex items-start">
                    <div className="text-2xl mr-3 mt-1">{option.icon}</div>
                    <div className="flex-1">
                      <h3 className={`font-medium mb-1 ${
                        isSelected ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {option.title}
                      </h3>
                      <p className={`text-sm mb-1 ${
                        isSelected ? 'text-primary-700' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </p>
                      <p className={`text-xs ${
                        isSelected ? 'text-primary-600' : 'text-gray-400'
                      }`}>
                        {option.time}
                      </p>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Daily Time Commitment */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How much time can you commit daily?
          </h2>
          
          <div className="grid gap-2 sm:grid-cols-4">
            {dailyTimeOptions.map((option) => {
              const isSelected = selectedDailyMinutes === option.value;
              
              return (
                <div
                  key={option.value}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all text-center hover:border-primary-300
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSelectedDailyMinutes(option.value)}
                >
                  <div className={`font-medium mb-1 ${
                    isSelected ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </div>
                  <div className={`text-xs ${
                    isSelected ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {option.description}
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-sm text-gray-500 mt-3 text-center">
            Don't worry - you can always adjust this later!
          </p>
        </div>
      </div>

      {canContinue && (
        <div className="text-center mt-8">
          <Button 
            onClick={handleContinue}
            className="px-8 py-3"
          >
            See My Habits
          </Button>
        </div>
      )}
    </div>
  );
}