/**
 * Google Drive Setup Guide Component
 * 
 * Provides user-friendly setup instructions for developers and clear
 * messaging about Google Drive sync configuration.
 */

import React, { useState } from 'react';
import { Button, Card, CardContent } from '../ui';

interface GoogleDriveSetupGuideProps {
  onBack?: () => void;
  onComplete?: () => void;
  className?: string;
}

export const GoogleDriveSetupGuide: React.FC<GoogleDriveSetupGuideProps> = ({
  onBack,
  onComplete,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    {
      title: "Quick Setup Needed",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 leading-relaxed">
            We need to connect your Google account for secure syncing. 
            This is a one-time setup that takes about 2 minutes.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What you'll get:
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Sync habits across all your devices</li>
              <li>✅ Automatic backup to your Google Drive</li>
              <li>✅ Access from phone, tablet, and computer</li>
              <li>✅ End-to-end encryption for privacy</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Developer Configuration",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            For development, Google Drive sync requires OAuth configuration.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Quick Setup Steps:</h4>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Google Drive API</li>
              <li>Create OAuth 2.0 client ID (Web application)</li>
              <li>Add your domain to authorized origins</li>
              <li>Copy client ID to .env.local file</li>
            </ol>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              💡 For production deployments, this is already configured automatically.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Alternative Options",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            While we set up Google Drive, you can start using ScienceHabits right away:
          </p>
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-1">Stay Local Only</h4>
              <p className="text-sm text-gray-600 mb-3">
                Keep everything on this device. Most private option, perfect for getting started.
              </p>
              <Button variant="outline" className="w-full">
                Continue Without Sync
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-1">NextCloud</h4>
              <p className="text-sm text-gray-600 mb-3">
                Use your own cloud server if you have one. Great for privacy.
              </p>
              <Button variant="outline" className="w-full">
                Set Up NextCloud
              </Button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="p-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-1 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Current step content */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900">
            {steps[currentStep - 1].title}
          </h2>
          
          <div className="text-left">
            {steps[currentStep - 1].content}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1"
            >
              ← Back
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              className="flex-1"
            >
              Next →
            </Button>
          ) : (
            <Button
              onClick={onBack}
              className="flex-1"
            >
              Choose Different Option
            </Button>
          )}
        </div>

        {/* Skip option */}
        {onBack && (
          <div className="text-center mt-4">
            <button 
              onClick={onBack}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              ← Back to sync options
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};