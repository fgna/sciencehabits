/**
 * Micro Habit Card Component
 * 
 * Displays and manages micro-habit recovery options that provide
 * 2-minute versions of full habits to maintain context while
 * reducing barriers and building momentum back to full habits.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, Button } from '../ui';
import { MicroHabit, RecoverySession } from '../../types/recovery';
import { useRecoveryStore } from '../../stores/recoveryStore';
import { useUserStore } from '../../stores/userStore';

interface MicroHabitCardProps {
  microHabit: MicroHabit;
  recoverySession?: RecoverySession;
  onComplete?: () => void;
  onProgress?: () => void;
  className?: string;
}

export function MicroHabitCard({ 
  microHabit, 
  recoverySession, 
  onComplete, 
  onProgress,
  className = '' 
}: MicroHabitCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showScalingSteps, setShowScalingSteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const { updateRecoveryProgress, progressMicroHabit } = useRecoveryStore();
  const { userHabits, updateUserProgress } = useUserStore();
  
  const originalHabit = userHabits.find(h => h.id === microHabit.originalHabitId);
  
  const handleComplete = () => {
    setIsCompleted(true);
    
    // Mark as completed in the main habit system
    if (originalHabit) {
      updateUserProgress(originalHabit.id, new Date().toISOString().split('T')[0]);
    }
    
    // Track micro-habit progress
    progressMicroHabit(microHabit.id);
    
    // Update recovery session if exists
    if (recoverySession) {
      updateRecoveryProgress(recoverySession.id, {
        successfulDays: recoverySession.successfulDays + 1,
        currentStep: Math.min(recoverySession.currentStep + 1, recoverySession.totalSteps)
      });
    }
    
    onComplete?.();
    
    // Show scaling options after completion
    setTimeout(() => {
      setShowScalingSteps(true);
    }, 1000);
  };
  
  const handleScaleUp = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    
    if (recoverySession) {
      const progressUpdate: Partial<RecoverySession> = {
        currentStep: stepIndex,
        nextMilestone: stepIndex < microHabit.scalingSteps.length - 1 
          ? microHabit.scalingSteps[stepIndex + 1]
          : 'Return to full habit'
      };
      
      updateRecoveryProgress(recoverySession.id, progressUpdate);
    }
    
    onProgress?.();
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'minimal': return 'text-green-600 bg-green-50';
      case 'easy': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getTimeIcon = (timeRequired: number) => {
    if (timeRequired <= 1) return '⚡';
    if (timeRequired <= 2) return '🚀';
    if (timeRequired <= 5) return '⏱️';
    return '⏰';
  };
  
  return (
    <Card className={`${className} ${isCompleted ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getTimeIcon(microHabit.timeRequired)}</span>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {microHabit.name}
              </h3>
              <p className="text-sm text-gray-500">
                Micro version of {originalHabit?.title || 'your habit'}
              </p>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(microHabit.difficulty)}`}>
            {microHabit.timeRequired} min
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Description */}
        <div className="mb-4">
          <p className="text-gray-600 mb-2">{microHabit.description}</p>
          
          {microHabit.maintainsSameContext && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <span>🎯</span>
              <span>Maintains same time and place as your original habit</span>
            </div>
          )}
        </div>
        
        {/* Success Rate */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Success rate for micro habits:</span>
            <span className="font-medium text-green-600">
              {Math.round(microHabit.successRate * 100)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${microHabit.successRate * 100}%` }}
            />
          </div>
        </div>
        
        {/* Completion Button */}
        {!isCompleted && (
          <Button
            onClick={handleComplete}
            className="w-full mb-4"
            size="lg"
          >
            <span className="mr-2">✓</span>
            Complete Now ({microHabit.timeRequired} min)
          </Button>
        )}
        
        {/* Completion Confirmation */}
        {isCompleted && (
          <div className="text-center py-4 mb-4">
            <div className="text-green-600 text-2xl mb-2">🎉</div>
            <h4 className="font-medium text-green-900 mb-1">Great job!</h4>
            <p className="text-sm text-green-700">
              You maintained your habit context and built momentum
            </p>
          </div>
        )}
        
        {/* Scaling Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Progressive Scaling Path
            </h4>
            <button
              onClick={() => setShowScalingSteps(!showScalingSteps)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showScalingSteps ? 'Hide' : 'Show'} scaling
            </button>
          </div>
          
          {showScalingSteps && (
            <div className="space-y-2">
              {microHabit.scalingSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded border ${
                    index === currentStep
                      ? 'border-blue-500 bg-blue-50'
                      : index < currentStep
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {index < currentStep ? '✅' : index === currentStep ? '🎯' : '⭕'}
                    </span>
                    <span className={`text-sm ${
                      index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                  
                  {index > currentStep && isCompleted && (
                    <button
                      onClick={() => handleScaleUp(index)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Try this
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recovery Session Info */}
        {recoverySession && (
          <div className="mt-4 p-3 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">Recovery Progress:</span>
              <span className="font-medium text-blue-900">
                {recoverySession.currentStep}/{recoverySession.totalSteps} steps
              </span>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(recoverySession.currentStep / recoverySession.totalSteps) * 100}%` 
                }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">
              <strong>Next milestone:</strong> {recoverySession.nextMilestone}
            </p>
          </div>
        )}
        
        {/* Coaching Tips */}
        {recoverySession?.coachingTips && (
          <div className="mt-4">
            <h5 className="text-xs font-medium text-gray-700 mb-2">💡 Recovery Tips:</h5>
            <div className="space-y-1">
              {recoverySession.coachingTips.slice(0, 2).map((tip, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-start">
                  <span className="mr-1">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Research Note */}
        <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <strong>💡 Research:</strong> Starting with ridiculously small habits removes barriers 
          and creates positive momentum. Success builds on success.
        </div>
      </CardContent>
    </Card>
  );
}